import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';

// Normalize date to UTC midnight for consistent create/find (avoids timezone mismatch)
const toAttendanceDate = (date) => {
  const str = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
  return new Date(str + 'T00:00:00.000Z');
};

/**
 * @desc    Mark Attendance
 * @route   POST /api/attendance
 * @access  Private (Teacher, HOD, Admin)
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const { userId, date, timeSlot, status } = req.body;

  if (!userId || !date || !timeSlot || !status) {
    return res.status(400).json({
      success: false,
      message: 'User ID, date, timeSlot, and status are required',
    });
  }

  if (!['present', 'late', 'absent'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be present, late, or absent',
    });
  }

  // Get user to get their role and department
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Check permissions
  if (req.userRole !== 'admin' && req.userDepartment !== user.department) {
    return res.status(403).json({
      success: false,
      message: 'You can only mark attendance for users in your department',
    });
  }

  // Teachers can only mark attendance for students
  if (req.userRole === 'teacher' && user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Teachers can only mark attendance for students',
    });
  }

  const attendanceDate = toAttendanceDate(date);

  const existingAttendance = await Attendance.findOne({
    userId,
    date: attendanceDate,
    timeSlot,
  });

  // Determine markedBy value - ObjectId for HOD/Teacher, string 'admin' for admin
  const markedByValue = req.userRole === 'admin' ? 'admin' : req.userId;

  if (existingAttendance) {
    // Update existing attendance
    existingAttendance.status = status;
    existingAttendance.markedBy = markedByValue;
    await existingAttendance.save();

    // Format markedBy in response
    const attendanceObj = existingAttendance.toObject();
    if (attendanceObj.markedBy === 'admin') {
      attendanceObj.markedBy = { _id: 'admin', fullName: 'Admin' };
    } else {
      const markedByUser = await User.findById(attendanceObj.markedBy).select('fullName');
      attendanceObj.markedBy = markedByUser
        ? { _id: markedByUser._id, fullName: markedByUser.fullName }
        : attendanceObj.markedBy;
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      attendance: attendanceObj,
    });
  }

  // Create new attendance
  const attendance = await Attendance.create({
    userId,
    role: user.role,
    date: attendanceDate,
    timeSlot,
    status,
    markedBy: markedByValue,
    department: user.department,
  });

  // Format markedBy in response
  const attendanceObj = attendance.toObject();
  if (attendanceObj.markedBy === 'admin') {
    attendanceObj.markedBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const markedByUser = await User.findById(attendanceObj.markedBy).select('fullName');
    attendanceObj.markedBy = markedByUser
      ? { _id: markedByUser._id, fullName: markedByUser.fullName }
      : attendanceObj.markedBy;
  }

  res.status(201).json({
    success: true,
    message: 'Attendance marked successfully',
    attendance: attendanceObj,
  });
});

/**
 * @desc    Mark Attendance in Bulk (all students present by default, mark absent by unchecking)
 * @route   POST /api/attendance/bulk
 * @access  Private (Teacher, HOD, Admin)
 */
export const markAttendanceBulk = asyncHandler(async (req, res) => {
  const { date, timeSlot, records } = req.body;

  if (!date || !timeSlot || !records || !Array.isArray(records)) {
    return res.status(400).json({
      success: false,
      message: 'Date, timeSlot, and records array are required',
    });
  }

  const attendanceDate = toAttendanceDate(date);

  const markedByValue = req.userRole === 'admin' ? 'admin' : req.userId;
  const results = [];

  for (const { userId, status } of records) {
    if (!userId || !['present', 'late', 'absent'].includes(status)) continue;

    const user = await User.findById(userId);
    if (!user) continue;

    // Check permissions - non-admin can only mark users in their department
    if (req.userRole !== 'admin' && req.userDepartment !== user.department) {
      continue;
    }

    // Teachers can only mark attendance for students
    if (req.userRole === 'teacher' && user.role !== 'student') {
      continue;
    }

    const existingAttendance = await Attendance.findOne({
      userId,
      date: attendanceDate,
      timeSlot,
    });

    if (existingAttendance) {
      existingAttendance.status = status;
      existingAttendance.markedBy = markedByValue;
      await existingAttendance.save();
      results.push(existingAttendance);
    } else {
      const attendance = await Attendance.create({
        userId,
        role: user.role,
        date: attendanceDate,
        timeSlot,
        status,
        markedBy: markedByValue,
        department: user.department,
      });
      results.push(attendance);
    }
  }

  // Format markedBy in results
  const formattedResults = await Promise.all(
    results.map(async (record) => {
      const obj = record.toObject();
      if (obj.markedBy === 'admin') {
        obj.markedBy = { _id: 'admin', fullName: 'Admin' };
      } else {
        const markedByUser = await User.findById(obj.markedBy).select('fullName');
        obj.markedBy = markedByUser
          ? { _id: markedByUser._id, fullName: markedByUser.fullName }
          : obj.markedBy;
      }
      return obj;
    })
  );

  res.status(200).json({
    success: true,
    message: `Attendance marked for ${formattedResults.length} user(s)`,
    attendance: formattedResults,
  });
});

/**
 * @desc    Get Attendance
 * @route   GET /api/attendance
 * @access  Private
 */
export const getAttendance = asyncHandler(async (req, res) => {
  const { userId, date, role, department, timeSlot } = req.query;

  const query = {};

  // Students can only see their own attendance
  if (req.userRole === 'student') {
    query.userId = req.userId;
  } else if (userId) {
    query.userId = userId;
  }

  // Filter by role
  if (role) {
    query.role = role;
  }

  // Filter by department
  if (department) {
    query.department = department;
  } else if (req.userRole !== 'admin') {
    query.department = req.userDepartment;
  }

  // Filter by specific date
  if (date) {
    const attendanceDate = toAttendanceDate(date);
    query.date = attendanceDate;
  }

  // Filter by time slot
  if (timeSlot) {
    query.timeSlot = timeSlot;
  }

  const attendance = await Attendance.find(query)
    .populate('userId', 'fullName email')
    .sort({ date: -1, timeSlot: 1 });

  // Manually populate markedBy only if it's an ObjectId (not 'admin')
  const attendanceWithMarkedBy = await Promise.all(
    attendance.map(async (record) => {
      const attendanceObj = record.toObject();
      if (attendanceObj.markedBy && attendanceObj.markedBy !== 'admin') {
        const markedByUser = await User.findById(attendanceObj.markedBy).select('fullName');
        attendanceObj.markedBy = markedByUser
          ? { _id: markedByUser._id, fullName: markedByUser.fullName }
          : attendanceObj.markedBy;
      } else if (attendanceObj.markedBy === 'admin') {
        attendanceObj.markedBy = { _id: 'admin', fullName: 'Admin' };
      }
      return attendanceObj;
    })
  );

  res.status(200).json({
    success: true,
    count: attendanceWithMarkedBy.length,
    attendance: attendanceWithMarkedBy,
  });
});

/**
 * @desc    Get Attendance Statistics
 * @route   GET /api/attendance/stats
 * @access  Private
 */
export const getAttendanceStats = asyncHandler(async (req, res) => {
  const { userId, date } = req.query;

  let targetUserId = userId;
  if (req.userRole === 'student') {
    targetUserId = req.userId;
  }

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
  }

  const query = { userId: targetUserId };
  
  // Filter by specific date if provided
  if (date) {
    const attendanceDate = toAttendanceDate(date);
    query.date = attendanceDate;
  }

  const attendance = await Attendance.find(query);

  const total = attendance.length;
  const present = attendance.filter((a) => a.status === 'present').length;
  const late = attendance.filter((a) => a.status === 'late').length;
  const absent = attendance.filter((a) => a.status === 'absent').length;
  const attended = present + late;
  const percentage = total > 0 ? ((attended / total) * 100).toFixed(2) : 0;

  res.status(200).json({
    success: true,
    stats: {
      total,
      present,
      late,
      absent,
      percentage: parseFloat(percentage),
    },
  });
});


