import Timetable from '../models/Timetable.js';
import Subject from '../models/Subject.js';
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

    if (existingTimetable) {
      throw new ApiError(400, 'Timetable already exists for this department and semester');
    }

    // Get all subjects for the department and semester
    const subjects = await Subject.find({
      department,
      semester,
      status: 'active'
    }).populate('assignedTeacher');

    if (subjects.length === 0) {
      throw new ApiError(404, 'No subjects found for the specified department and semester');
    }

    // Validate that all subjects have assigned teachers
    const subjectsWithoutTeachers = subjects.filter(subject => !subject.assignedTeacher);
    if (subjectsWithoutTeachers.length > 0) {
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
      status: 'active'
    }).populate('timeSlots.teacher');

    // Generate timetable slots with conflict checking
    const timeSlots = generateTimeSlots(subjects, existingTimetables);

    // Create new timetable
    const timetable = new Timetable({
      department,
      semester,
      timeSlots,
      createdBy: req.user._id,
      status: 'draft'
    });

    await timetable.save();

    // Populate the created timetable
    const populatedTimetable = await Timetable.findById(timetable._id)
      .populate('timeSlots.subject')
      .populate('timeSlots.teacher')
      .populate('createdBy', 'fullName email');

    res.status(201).json(
      new ApiResponse(201, populatedTimetable, 'Timetable generated successfully')
    );

  } catch (error) {
    throw new ApiError(500, `Failed to generate timetable: ${error.message}`);
  }
});

// Helper function to generate time slots
function generateTimeSlots(subjects, existingTimetables = []) {
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

          // Initialize teacher schedule if not exists
          if (!teacherSchedule.has(teacherId)) {
            teacherSchedule.set(teacherId, new Set());
          }

          // Mark this slot as occupied for this teacher
          teacherSchedule.get(teacherId).add(slotKey);
        }
      });
    }
  });

  // Generate slots for each day
  for (const day of DAYS) {
    for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
      const timeSlot = TIME_SLOTS[slotIndex];

      // Find a suitable subject for this slot
      const suitableSubject = findSuitableSubject(
        subjects,
        subjectHoursScheduled,
        teacherSchedule,
        day,
        slotIndex,
        timeSlot
      );

      if (suitableSubject) {
        const slot = {
          day,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          subject: suitableSubject._id,
          teacher: suitableSubject.assignedTeacher._id,
          subjectType: suitableSubject.subjectType,
          room: generateRoomNumber(suitableSubject.subjectType)
        };

        timeSlots.push(slot);

        // Update tracking
        const subjectId = suitableSubject._id.toString();
        const teacherId = suitableSubject.assignedTeacher._id.toString();

        subjectHoursScheduled.set(subjectId, subjectHoursScheduled.get(subjectId) + 1);

        // Mark this specific time slot as occupied
        const slotKey = `${day}-${timeSlot.startTime}-${timeSlot.endTime}`;
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

// Helper function to find suitable subject for a time slot
function findSuitableSubject(subjects, subjectHoursScheduled, teacherSchedule, day, slotIndex, timeSlot) {
  // Filter available subjects
  const availableSubjects = subjects.filter(subject => {
    const subjectId = subject._id.toString();
    const teacherId = subject.assignedTeacher._id.toString();
    const hoursScheduled = subjectHoursScheduled.get(subjectId);

    // Check if subject still needs more hours
    if (hoursScheduled >= subject.hoursPerWeek) {
      return false;
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
    'practical': 'P'
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
  const processedSlots = timeSlots.map(slot => ({
    day: slot.day,
    startTime: slot.startTime,
    endTime: slot.endTime,
    subject: slot.subject._id ? slot.subject._id : slot.subject,
    teacher: slot.teacher._id ? slot.teacher._id : slot.teacher,
    room: slot.room,
    subjectType: slot.subjectType || 'theory'
  }));

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
      slot => slot.teacher._id.toString() === teacherId.toString()
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

export {
  generateTimetable,
  getTimetable,
  getAllTimetables,
  updateTimetableStatus,
  deleteTimetable,
  getTeacherTimetable,
  updateTimetable
};