import TimeTable from '../models/TimeTable.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';

// 5 slots, 9 AM - 4 PM, with longer lunch break (12:00 - 1:30 PM)
const VALID_TIME_SLOTS = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '1:30 PM - 2:45 PM',
  '2:45 PM - 4:00 PM',
];

const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * @desc    Create/Update Timetable
 * @route   POST /api/timetable
 * @access  Private (Teacher, HOD)
 */
export const createTimetable = asyncHandler(async (req, res) => {
  const { day, subject, timeSlot } = req.body;

  // Auto-detect role from logged-in user (teacher or HOD only)
  const role = req.userRole;

  if (!day || !subject || !timeSlot) {
    return res.status(400).json({
      success: false,
      message: 'Day, subject, and timeSlot are required',
    });
  }

  if (!['teacher', 'hod'].includes(role)) {
    return res.status(403).json({
      success: false,
      message: 'Only teachers and HODs can edit timetable',
    });
  }

  if (!VALID_DAYS.includes(day)) {
    return res.status(400).json({
      success: false,
      message: 'Day must be Monday to Friday',
    });
  }

  if (!VALID_TIME_SLOTS.includes(timeSlot)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid time slot. Must be one of: 9:00 AM - 10:00 AM, 10:00 AM - 11:00 AM, 11:00 AM - 12:00 PM, 1:30 PM - 2:45 PM, 2:45 PM - 4:00 PM',
    });
  }

  // Use user's department (teacher/HOD)
  const departmentValue = req.userDepartment;

  const createdByValue = req.userId;

  // Check if entry already exists
  const existingEntry = await TimeTable.findOne({
    department: departmentValue,
    role,
    day,
    timeSlot,
  });

  if (existingEntry) {
    // Update existing entry
    existingEntry.subject = subject;
    existingEntry.createdBy = createdByValue;
    await existingEntry.save();

    // Format createdBy in response
    const timetableObj = existingEntry.toObject();
    if (timetableObj.createdBy === 'admin') {
      timetableObj.createdBy = { _id: 'admin', fullName: 'Admin' };
    } else {
      const createdByUser = await User.findById(timetableObj.createdBy).select('fullName');
      timetableObj.createdBy = createdByUser
        ? { _id: createdByUser._id, fullName: createdByUser.fullName }
        : timetableObj.createdBy;
    }

    return res.status(200).json({
      success: true,
      message: 'Timetable updated successfully',
      timetable: timetableObj,
    });
  }

  // Create new entry
  const timetable = await TimeTable.create({
    department: departmentValue,
    role,
    day,
    subject,
    timeSlot,
    createdBy: createdByValue,
  });

  // Format createdBy in response
  const timetableObj = timetable.toObject();
  if (timetableObj.createdBy === 'admin') {
    timetableObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(timetableObj.createdBy).select('fullName');
    timetableObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : timetableObj.createdBy;
  }

  res.status(201).json({
    success: true,
    message: 'Timetable created successfully',
    timetable: timetableObj,
  });
});

/**
 * @desc    Get Timetable
 * @route   GET /api/timetable
 * @access  Private
 */
export const getTimetable = asyncHandler(async (req, res) => {
  const { department, day } = req.query;

  const query = {};

  // Filter by department
  if (department) {
    query.department = department;
  } else if (req.userRole !== 'admin') {
    query.department = req.userDepartment;
  }

  // Auto-detect role from logged-in user
  if (['teacher', 'hod'].includes(req.userRole)) {
    query.role = req.userRole;
  } else if (req.userRole === 'admin') {
    // Admin can pass role in query; default to teacher
    query.role = req.query.role || 'teacher';
  } else {
    // Students see teacher timetable
    query.role = 'teacher';
  }

  // Filter by day
  if (day) {
    query.day = day;
  }

  const timetable = await TimeTable.find(query)
    .sort({ day: 1, timeSlot: 1 });

  // Manually populate createdBy only if it's an ObjectId (not 'admin')
  const timetableWithCreatedBy = await Promise.all(
    timetable.map(async (record) => {
      const timetableObj = record.toObject();
      if (timetableObj.createdBy && timetableObj.createdBy !== 'admin') {
        const createdByUser = await User.findById(timetableObj.createdBy).select('fullName');
        timetableObj.createdBy = createdByUser
          ? { _id: createdByUser._id, fullName: createdByUser.fullName }
          : timetableObj.createdBy;
      } else if (timetableObj.createdBy === 'admin') {
        timetableObj.createdBy = { _id: 'admin', fullName: 'Admin' };
      }
      return timetableObj;
    })
  );

  res.status(200).json({
    success: true,
    count: timetableWithCreatedBy.length,
    timetable: timetableWithCreatedBy,
  });
});

/**
 * @desc    Delete Timetable Entry
 * @route   DELETE /api/timetable/:id
 * @access  Private (Teacher, HOD)
 */
export const deleteTimetableEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const timetable = await TimeTable.findById(id);

  if (!timetable) {
    return res.status(404).json({
      success: false,
      message: 'Timetable entry not found',
    });
  }

  // Check permissions - teacher/HOD can only delete their own role's entries in their department
  if (!['teacher', 'hod'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Only teachers and HODs can delete timetable entries',
    });
  }
  if (timetable.department !== req.userDepartment || timetable.role !== req.userRole) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own timetable entries',
    });
  }

  await TimeTable.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Timetable entry deleted successfully',
  });
});


