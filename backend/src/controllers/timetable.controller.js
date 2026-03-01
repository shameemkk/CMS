import Timetable from '../models/TimeTable.js';
import Subject from '../models/Subject.js';
import MinorMajor from '../models/MinorMajor.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Time slots configuration
const TIME_SLOTS = [
  { startTime: '09:30', endTime: '10:30' },  // 1st period
  { startTime: '10:30', endTime: '11:20' },  // 2nd period
  // 11:20 - 11:30 break (10 min)
  { startTime: '11:30', endTime: '12:30' },  // 3rd period
  // 12:30 - 13:30 lunch break (1 hour)
  { startTime: '13:30', endTime: '14:30' },  // 4th period
  { startTime: '14:30', endTime: '15:30' },  // 5th period
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Generate automatic timetable
const generateTimetable = asyncHandler(async (req, res) => {
  const { department, semester } = req.body;

  console.log('🔍 Timetable generation request:', { 
    department, 
    semester, 
    userRole: req.user.role, 
    userDept: req.user.department,
    departmentMatch: req.user.department === department 
  });

  if (!department || !semester) {
    throw new ApiError(400, 'Department and semester are required');
  }

  // HODs can only generate timetables for their own department
  if (req.user.role === 'hod' && req.user.department !== department) {
    throw new ApiError(403, 'You can only generate timetables for your own department');
  }

  try {
    // Check if timetable already exists
    const existingTimetable = await Timetable.findOne({
      department,
      semester,
      status: { $in: ['active', 'draft'] }
    });

    console.log('📋 Existing timetable check:', existingTimetable ? 'Found existing' : 'None found');

    if (existingTimetable) {
      throw new ApiError(400, 'Timetable already exists for this department and semester');
    }

    // Get all subjects for the department and semester
    const subjects = await Subject.find({
      department,
      semester,
      status: 'active'
    }).populate('assignedTeacher');

    console.log('📚 Subjects found:', subjects.length);
    console.log('📚 Subject details:', subjects.map(s => ({ 
      name: s.name, 
      code: s.code, 
      hasTeacher: !!s.assignedTeacher,
      teacherName: s.assignedTeacher?.fullName 
    })));

    if (subjects.length === 0) {
      throw new ApiError(404, 'No subjects found for the specified department and semester');
    }

    // Validate that all subjects have assigned teachers
    const subjectsWithoutTeachers = subjects.filter(subject => !subject.assignedTeacher);
    console.log('👨‍🏫 Subjects without teachers:', subjectsWithoutTeachers.length);
    
    if (subjectsWithoutTeachers.length > 0) {
      console.log('❌ Missing teachers for:', subjectsWithoutTeachers.map(s => s.name));
      throw new ApiError(400, `Some subjects don't have assigned teachers: ${subjectsWithoutTeachers.map(s => s.name).join(', ')}`);
    }

    // Get existing active timetables for the same semester type (odd/even)
    // Odd semesters: 1, 3, 5, 7 | Even semesters: 2, 4, 6, 8
    const isOddSemester = semester % 2 === 1;
    const activeSemesters = isOddSemester
      ? [1, 3, 5, 7]
      : [2, 4, 6, 8];

    const existingTimetables = await Timetable.find({
      department,
      semester: { $in: activeSemesters, $ne: semester },
      status: { $in: ['active', 'draft'] }
    }).populate('timeSlots.teacher');

    // Fetch active MinorMajor configurations for this department
    const minorMajorConfigs = await MinorMajor.find({ department, isActive: true });
    console.log('📊 MinorMajor configs found:', minorMajorConfigs.length, minorMajorConfigs.map(c => ({
      subjectType: c.subjectType,
      prioritySlot: c.prioritySlot
    })));

    // Generate timetable slots with conflict checking and MinorMajor priority slots
    const timeSlots = generateTimeSlots(subjects, existingTimetables, minorMajorConfigs);
    console.log('⏰ Generated time slots:', timeSlots.length);

    // Create new timetable
    const timetable = new Timetable({
      department,
      semester,
      timeSlots,
      createdBy: req.user._id,
      status: 'draft'
    });

    await timetable.save();
    console.log('✅ Timetable saved successfully with ID:', timetable._id);

    // Populate the created timetable
    const populatedTimetable = await Timetable.findById(timetable._id)
      .populate('timeSlots.subject')
      .populate('timeSlots.teacher')
      .populate('createdBy', 'fullName email');

    res.status(201).json(
      new ApiResponse(201, populatedTimetable, 'Timetable generated successfully')
    );

  } catch (error) {
    console.error('❌ Timetable generation error:', error.message);
    console.error('❌ Full error:', error);
    
    // Provide more specific error messages based on the error type
    let errorMessage = error.message;
    
    if (error.message.includes('already exists')) {
      errorMessage = 'A timetable already exists for this department and semester. Please delete the existing one first or edit it instead.';
    } else if (error.message.includes('No subjects found')) {
      errorMessage = 'No active subjects found for this department and semester. Please add subjects first before generating a timetable.';
    } else if (error.message.includes("don't have assigned teachers")) {
      errorMessage = 'Some subjects do not have assigned teachers. Please assign teachers to all subjects before generating a timetable.';
    } else if (error.message.includes('Teacher conflict')) {
      errorMessage = 'Teacher scheduling conflict detected. Some teachers are already scheduled for other semesters at the same time.';
    } else if (error.message.includes('validation failed')) {
      errorMessage = 'Invalid data provided. Please check all required fields and try again.';
    } else if (!errorMessage || errorMessage === 'undefined') {
      errorMessage = 'An unexpected error occurred while generating the timetable. Please try again.';
    }
    
    throw new ApiError(500, errorMessage);
  }
});

// Helper function to generate time slots
function generateTimeSlots(subjects, existingTimetables = [], minorMajorConfigs = []) {
  const timeSlots = [];
  const teacherSchedule = new Map(); // Track teacher availability
  const subjectHoursScheduled = new Map(); // Track hours scheduled per subject

  // Initialize subject hours tracking
  subjects.forEach(subject => {
    subjectHoursScheduled.set(subject._id.toString(), 0);
  });

  // Initialize teacher schedule
  subjects.forEach(subject => {
    if (subject.assignedTeacher) {
      teacherSchedule.set(subject.assignedTeacher._id.toString(), new Set());
    }
  });

  // Block out time slots where teachers are already scheduled in other active timetables
  existingTimetables.forEach(timetable => {
    if (timetable.timeSlots) {
      timetable.timeSlots.forEach(slot => {
        if (slot.teacher && slot.teacher._id) {
          const teacherId = slot.teacher._id.toString();
          const slotKey = `${slot.day}-${slot.startTime}-${slot.endTime}`;

          if (!teacherSchedule.has(teacherId)) {
            teacherSchedule.set(teacherId, new Set());
          }
          teacherSchedule.get(teacherId).add(slotKey);
        }
      });
    }
  });

  // Build priority slot map: slotIndex (0-based) → config[]
  // MinorMajor.prioritySlot is 1-based, so subtract 1
  const prioritySlotMap = new Map();
  minorMajorConfigs.forEach(config => {
    const slotIndex = config.prioritySlot - 1;
    if (!prioritySlotMap.has(slotIndex)) {
      prioritySlotMap.set(slotIndex, []);
    }
    prioritySlotMap.get(slotIndex).push(config);
  });

  // Set of subject types that have a MinorMajor config (handled by priority slots)
  const configuredSubjectTypes = new Set(minorMajorConfigs.map(c => c.subjectType));

  // Pre-check: does the configured subject type exist among this semester's subjects?
  const subjectTypeExistsMap = new Map();
  minorMajorConfigs.forEach(config => {
    const exists = subjects.some(s => s.subjectType === config.subjectType);
    subjectTypeExistsMap.set(config.subjectType, exists);
  });

  // Generate slots for each day
  for (const day of DAYS) {
    for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
      const timeSlot = TIME_SLOTS[slotIndex];

      // ── Priority slot handling (MinorMajor config) ──────────────────────────
      if (prioritySlotMap.has(slotIndex)) {
        const configs = prioritySlotMap.get(slotIndex);

        for (const config of configs) {
          const { subjectType } = config;
          const subjectExistsInSemester = subjectTypeExistsMap.get(subjectType);

          if (!subjectExistsInSemester) {
            // Subject type not found in semester subjects → reserve the slot
            timeSlots.push({
              day,
              startTime: timeSlot.startTime,
              endTime: timeSlot.endTime,
              isReserved: true,
              reservedLabel: `Reserved for ${subjectType.toUpperCase()}`,
              room: 'TBA',
            });
          } else {
            // Subject type exists → try to schedule a subject of that type
            const prioritySubjects = subjects.filter(s => s.subjectType === subjectType);
            const suitableSubject = findSuitableSubjectOfType(
              prioritySubjects,
              subjectHoursScheduled,
              teacherSchedule,
              day,
              timeSlot
            );

            if (suitableSubject) {
              const slotKey = `${day}-${timeSlot.startTime}-${timeSlot.endTime}`;
              const subjectId = suitableSubject._id.toString();
              const teacherId = suitableSubject.assignedTeacher._id.toString();

              timeSlots.push({
                day,
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                subject: suitableSubject._id,
                teacher: suitableSubject.assignedTeacher._id,
                subjectType: suitableSubject.subjectType,
                room: generateRoomNumber(suitableSubject.subjectType),
              });

              subjectHoursScheduled.set(subjectId, subjectHoursScheduled.get(subjectId) + 1);
              if (!teacherSchedule.has(teacherId)) {
                teacherSchedule.set(teacherId, new Set());
              }
              teacherSchedule.get(teacherId).add(slotKey);
            }
            // If hours exhausted or teacher conflict, skip this slot for that day
          }
        }
        continue; // Do not run normal scheduling for priority slot indices
      }

      // ── Normal slot handling ─────────────────────────────────────────────────
      const suitableSubject = findSuitableSubject(
        subjects,
        subjectHoursScheduled,
        teacherSchedule,
        day,
        slotIndex,
        timeSlot,
        configuredSubjectTypes
      );

      if (suitableSubject) {
        const slotKey = `${day}-${timeSlot.startTime}-${timeSlot.endTime}`;
        const subjectId = suitableSubject._id.toString();
        const teacherId = suitableSubject.assignedTeacher._id.toString();

        timeSlots.push({
          day,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          subject: suitableSubject._id,
          teacher: suitableSubject.assignedTeacher._id,
          subjectType: suitableSubject.subjectType,
          room: generateRoomNumber(suitableSubject.subjectType),
        });

        subjectHoursScheduled.set(subjectId, subjectHoursScheduled.get(subjectId) + 1);
        teacherSchedule.get(teacherId).add(slotKey);
      }
    }
  }

  return timeSlots;
}

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Find a subject of a specific type for a MinorMajor priority slot
function findSuitableSubjectOfType(subjects, subjectHoursScheduled, teacherSchedule, day, timeSlot) {
  const available = subjects.filter(subject => {
    const subjectId = subject._id.toString();
    const teacherId = subject.assignedTeacher._id.toString();
    const hoursScheduled = subjectHoursScheduled.get(subjectId);

    if (hoursScheduled >= subject.hoursPerWeek) return false;

    const slotKey = `${day}-${timeSlot.startTime}-${timeSlot.endTime}`;
    if (teacherSchedule.get(teacherId)?.has(slotKey)) return false;

    return true;
  });

  if (available.length === 0) return null;

  available.sort((a, b) => {
    const aScheduled = subjectHoursScheduled.get(a._id.toString());
    const bScheduled = subjectHoursScheduled.get(b._id.toString());
    if (aScheduled !== bScheduled) return aScheduled - bScheduled;
    return b.hoursPerWeek - a.hoursPerWeek;
  });

  return available[0];
}

// Helper function to find suitable subject for a normal time slot
function findSuitableSubject(subjects, subjectHoursScheduled, teacherSchedule, day, slotIndex, timeSlot, configuredSubjectTypes = new Set()) {
  // Filter available subjects
  const availableSubjects = subjects.filter(subject => {
    const subjectId = subject._id.toString();
    const teacherId = subject.assignedTeacher._id.toString();
    const hoursScheduled = subjectHoursScheduled.get(subjectId);

    // Check if subject still needs more hours
    if (hoursScheduled >= subject.hoursPerWeek) {
      return false;
    }

    // Exclude subject types managed by MinorMajor priority slots
    if (configuredSubjectTypes.has(subject.subjectType)) {
      return false;
    }

    // Unconfigured minor/major subjects can ONLY be scheduled in 2nd period (slotIndex === 1)
    if ((subject.subjectType === 'minor' || subject.subjectType === 'major') && slotIndex !== 1) {
      return false;
    }

    // Non-minor/major subjects should NOT be scheduled in 2nd period if there are
    // unconfigured minor/major subjects that still need hours
    if (slotIndex === 1 && subject.subjectType !== 'minor' && subject.subjectType !== 'major') {
      const hasUnscheduledUnconfiguredMinorMajor = subjects.some(s => {
        if (configuredSubjectTypes.has(s.subjectType)) return false;
        const sId = s._id.toString();
        const sScheduled = subjectHoursScheduled.get(sId);
        return (s.subjectType === 'minor' || s.subjectType === 'major') && sScheduled < s.hoursPerWeek;
      });
      if (hasUnscheduledUnconfiguredMinorMajor) {
        return false;
      }
    }

    // Check if teacher is available for this specific time slot
    const slotKey = `${day}-${timeSlot.startTime}-${timeSlot.endTime}`;
    if (teacherSchedule.get(teacherId).has(slotKey)) {
      return false;
    }

    // Lab subjects should be scheduled in consecutive slots when possible
    if (subject.subjectType === 'lab' && slotIndex < TIME_SLOTS.length - 1) {
      const nextTimeSlot = TIME_SLOTS[slotIndex + 1];
      const nextSlotKey = `${day}-${nextTimeSlot.startTime}-${nextTimeSlot.endTime}`;
      if (teacherSchedule.get(teacherId).has(nextSlotKey)) {
        return false;
      }
    }

    return true;
  });

  if (availableSubjects.length === 0) {
    return null;
  }

  // Sort by priority: subjects with fewer scheduled hours first
  availableSubjects.sort((a, b) => {
    const aScheduled = subjectHoursScheduled.get(a._id.toString());
    const bScheduled = subjectHoursScheduled.get(b._id.toString());

    if (aScheduled !== bScheduled) {
      return aScheduled - bScheduled;
    }

    // If same scheduled hours, prioritize subjects with more total hours needed
    return b.hoursPerWeek - a.hoursPerWeek;
  });

  // Get subjects with the same priority (same number of scheduled hours)
  const minScheduled = subjectHoursScheduled.get(availableSubjects[0]._id.toString());
  const samePrioritySubjects = availableSubjects.filter(subject =>
    subjectHoursScheduled.get(subject._id.toString()) === minScheduled
  );

  // Shuffle subjects with same priority to add randomness
  if (samePrioritySubjects.length > 1) {
    const shuffled = shuffleArray(samePrioritySubjects);
    return shuffled[0];
  }

  return availableSubjects[0];
}

// Helper function to generate room numbers
function generateRoomNumber(subjectType) {
  const roomPrefixes = {
    'theory': 'R',
    'lab': 'L',
    'practical': 'P',
    'minor': 'R',
    'major': 'R'
  };

  const prefix = roomPrefixes[subjectType] || 'R';
  const roomNumber = Math.floor(Math.random() * 20) + 101; // Random room between 101-120

  return `${prefix}-${roomNumber}`;
}

// Get timetable by department and semester
const getTimetable = asyncHandler(async (req, res) => {
  const { department, semester } = req.params;

  const timetable = await Timetable.findOne({
    department,
    semester,
    status: { $in: ['active', 'draft'] }
  })
    .populate('timeSlots.subject')
    .populate('timeSlots.teacher', 'fullName email')
    .populate('createdBy', 'fullName email');

  if (!timetable) {
    throw new ApiError(404, 'Timetable not found');
  }

  res.status(200).json(
    new ApiResponse(200, timetable, 'Timetable retrieved successfully')
  );
});

// Get all timetables
const getAllTimetables = asyncHandler(async (req, res) => {
  const { department, status } = req.query;

  const filter = {};

  // HODs can only view timetables for their own department
  if (req.user.role === 'hod') {
    filter.department = req.user.department;
  } else if (department) {
    // Admins can filter by department
    filter.department = department;
  }

  if (status) filter.status = status;

  const timetables = await Timetable.find(filter)
    .populate('timeSlots.subject')
    .populate('timeSlots.teacher', 'fullName email')
    .populate('createdBy', 'fullName email')
    .sort({ department: 1, semester: 1 });

  res.status(200).json(
    new ApiResponse(200, timetables, 'Timetables retrieved successfully')
  );
});

// Update timetable status
const updateTimetableStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'active', 'archived'].includes(status)) {
    throw new ApiError(400, 'Invalid status. Must be draft, active, or archived');
  }

  const timetable = await Timetable.findById(id);
  if (!timetable) {
    throw new ApiError(404, 'Timetable not found');
  }

  // If activating, deactivate other timetables for same department/semester
  if (status === 'active') {
    await Timetable.updateMany(
      {
        department: timetable.department,
        semester: timetable.semester,
        _id: { $ne: id }
      },
      { status: 'archived' }
    );
  }

  timetable.status = status;
  timetable.lastModifiedBy = req.user._id;
  await timetable.save();

  const updatedTimetable = await Timetable.findById(id)
    .populate('timeSlots.subject')
    .populate('timeSlots.teacher', 'fullName email')
    .populate('createdBy', 'fullName email')
    .populate('lastModifiedBy', 'fullName email');

  res.status(200).json(
    new ApiResponse(200, updatedTimetable, 'Timetable status updated successfully')
  );
});

// Delete timetable
const deleteTimetable = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const timetable = await Timetable.findById(id);
  if (!timetable) {
    throw new ApiError(404, 'Timetable not found');
  }

  await Timetable.findByIdAndDelete(id);

  res.status(200).json(
    new ApiResponse(200, null, 'Timetable deleted successfully')
  );
});

// Update timetable
const updateTimetable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { timeSlots } = req.body;

  if (!timeSlots || !Array.isArray(timeSlots)) {
    throw new ApiError(400, 'Time slots array is required');
  }

  const timetable = await Timetable.findById(id);
  if (!timetable) {
    throw new ApiError(404, 'Timetable not found');
  }

  // HODs can only update timetables for their own department
  if (req.user.role === 'hod' && req.user.department !== timetable.department) {
    throw new ApiError(403, 'You can only edit timetables for your own department');
  }

  // Same parity semester check (e.g., odd with odd, even with even)
  const isOddSemester = timetable.semester % 2 === 1;
  const activeSemesters = isOddSemester
    ? [1, 3, 5, 7]
    : [2, 4, 6, 8];

  const existingTimetables = await Timetable.find({
    semester: { $in: activeSemesters, $ne: timetable.semester },
    status: { $in: ['active', 'draft'] },
  }).populate('timeSlots.teacher');

  const teacherSchedule = new Map();
  existingTimetables.forEach(tt => {
    tt.timeSlots.forEach(slot => {
      if (slot.teacher && slot.teacher._id) {
        const teacherId = slot.teacher._id.toString();
        const slotKey = `${slot.day}-${slot.startTime}-${slot.endTime}`;
        if (!teacherSchedule.has(teacherId)) {
          teacherSchedule.set(teacherId, new Set());
        }
        teacherSchedule.get(teacherId).add(slotKey);
      }
    });
  });

  const currentSubmissionSchedule = new Map();
  for (const slot of timeSlots) {
    // Reserved slots have no subject/teacher — skip conflict checks
    if (slot.isReserved) continue;

    if (!slot.subject) {
      throw new ApiError(400, `Subject is missing for a slot on ${slot.day} at ${slot.startTime}.`);
    }
    if (!slot.teacher) {
      throw new ApiError(400, `Teacher is missing for a slot on ${slot.day} at ${slot.startTime}.`);
    }

    const teacherId = slot.teacher._id ? slot.teacher._id.toString() : slot.teacher;
    const slotKey = `${slot.day}-${slot.startTime}-${slot.endTime}`;

    // Conflict with other timetables in the same semester parity
    if (teacherSchedule.has(teacherId) && teacherSchedule.get(teacherId).has(slotKey)) {
      throw new ApiError(400, `Teacher conflict: The selected teacher is already scheduled for ${slot.day} at ${slot.startTime}-${slot.endTime} in another semester.`);
    }

    // Conflict within the current edited timetable
    if (!currentSubmissionSchedule.has(teacherId)) {
      currentSubmissionSchedule.set(teacherId, new Set());
    }
    if (currentSubmissionSchedule.get(teacherId).has(slotKey)) {
      throw new ApiError(400, `Teacher conflict: Teacher is scheduled more than once on ${slot.day} at ${slot.startTime}-${slot.endTime} in this timetable.`);
    }
    currentSubmissionSchedule.get(teacherId).add(slotKey);
  }

  // Process the slots
  const processedSlots = timeSlots.map(slot => {
    if (slot.isReserved) {
      return {
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isReserved: true,
        reservedLabel: slot.reservedLabel || '',
        room: 'TBA',
      };
    }
    return {
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subject: slot.subject._id ? slot.subject._id : slot.subject,
      teacher: slot.teacher._id ? slot.teacher._id : slot.teacher,
      room: slot.room,
      subjectType: slot.subjectType || 'theory',
    };
  });

  timetable.timeSlots = processedSlots;
  timetable.lastModifiedBy = req.user._id;

  await timetable.save();

  const updatedTimetable = await Timetable.findById(id)
    .populate('timeSlots.subject')
    .populate('timeSlots.teacher', 'fullName email')
    .populate('createdBy', 'fullName email')
    .populate('lastModifiedBy', 'fullName email');

  res.status(200).json(
    new ApiResponse(200, updatedTimetable, 'Timetable updated successfully')
  );
});

// Get teacher's timetable
const getTeacherTimetable = asyncHandler(async (req, res) => {
  const teacherId = (req.user.role === 'teacher' || req.user.role === 'hod') ? req.user._id : req.params.teacherId;

  const timetables = await Timetable.find({
    'timeSlots.teacher': teacherId,
    status: 'active'
  })
    .populate('timeSlots.subject')
    .populate('timeSlots.teacher', 'fullName email');

  // Filter and format the response to show only teacher's slots
  const teacherSchedule = [];

  timetables.forEach(timetable => {
    const teacherSlots = timetable.timeSlots.filter(
      slot => slot.teacher && slot.teacher._id && slot.teacher._id.toString() === teacherId.toString()
    );

    if (teacherSlots.length > 0) {
      teacherSchedule.push({
        department: timetable.department,
        semester: timetable.semester,
        timeSlots: teacherSlots
      });
    }
  });

  res.status(200).json(
    new ApiResponse(200, teacherSchedule, 'Teacher timetable retrieved successfully')
  );
});

// Debug endpoint to check subjects
const debugSubjects = asyncHandler(async (req, res) => {
  const { department, semester } = req.query;
  
  const filter = {};
  if (department) filter.department = department;
  if (semester) filter.semester = parseInt(semester);
  
  const subjects = await Subject.find(filter).populate('assignedTeacher', 'fullName email');
  
  const subjectInfo = subjects.map(s => ({
    name: s.name,
    code: s.code,
    department: s.department,
    semester: s.semester,
    hoursPerWeek: s.hoursPerWeek,
    subjectType: s.subjectType,
    hasTeacher: !!s.assignedTeacher,
    teacherName: s.assignedTeacher?.fullName,
    status: s.status
  }));
  
  res.status(200).json(
    new ApiResponse(200, {
      total: subjects.length,
      subjects: subjectInfo
    }, 'Subjects debug info')
  );
});

export {
  generateTimetable,
  getTimetable,
  getAllTimetables,
  updateTimetableStatus,
  deleteTimetable,
  getTeacherTimetable,
  updateTimetable,
  debugSubjects
};