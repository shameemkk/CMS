import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Exam from '../models/Exam.js';
import Assignment from '../models/Assignment.js';
import Notification from '../models/Notification.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * @desc    Get Dashboard Statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = {};

  if (req.userRole === 'admin') {
    // Admin stats
    const totalUsers = await User.countDocuments();
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    const students = await User.countDocuments({ role: 'student', status: 'approved' });
    const teachers = await User.countDocuments({ role: 'teacher', status: 'approved' });
    const hods = await User.countDocuments({ role: 'hod', status: 'approved' });
    const totalExams = await Exam.countDocuments();
    const totalAssignments = await Assignment.countDocuments();
    const totalNotifications = await Notification.countDocuments();
    const pendingLeaveRequests = await LeaveRequest.countDocuments({ status: 'pending' });

    stats.totalUsers = totalUsers;
    stats.pendingUsers = pendingUsers;
    stats.approvedUsers = approvedUsers;
    stats.students = students;
    stats.teachers = teachers;
    stats.hods = hods;
    stats.totalExams = totalExams;
    stats.totalAssignments = totalAssignments;
    stats.totalNotifications = totalNotifications;
    stats.pendingLeaveRequests = pendingLeaveRequests;
  } else if (req.userRole === 'hod') {
    // HOD stats
    const department = req.userDepartment;
    const students = await User.countDocuments({ role: 'student', department, status: 'approved' });
    const teachers = await User.countDocuments({ role: 'teacher', department, status: 'approved' });
    const exams = await Exam.countDocuments({ department });
    const assignments = await Assignment.countDocuments({ department });
    const notifications = await Notification.countDocuments({
      $or: [{ department }, { department: 'all' }],
    });
    const pendingLeaveRequests = await LeaveRequest.countDocuments({
      status: 'pending',
      role: 'teacher',
    }).populate('requestedBy', 'department');

    // Filter leave requests by department
    const allPendingLeaves = await LeaveRequest.find({
      status: 'pending',
      role: 'teacher',
    }).populate('requestedBy', 'department');
    const departmentPendingLeaves = allPendingLeaves.filter(
      (leave) => leave.requestedBy.department === department
    ).length;

    stats.students = students;
    stats.teachers = teachers;
    stats.exams = exams;
    stats.assignments = assignments;
    stats.notifications = notifications;
    stats.pendingLeaveRequests = departmentPendingLeaves;
  } else if (req.userRole === 'teacher') {
    // Teacher stats
    const department = req.userDepartment;
    const students = await User.countDocuments({ role: 'student', department, status: 'approved' });
    const exams = await Exam.countDocuments({ department });
    const assignments = await Assignment.countDocuments({ department });
    const notifications = await Notification.countDocuments({
      $or: [
        { targetRole: 'teacher', department },
        { targetRole: 'all', department },
        { targetRole: 'teacher', department: 'all' },
        { targetRole: 'all', department: 'all' },
      ],
    });
    const myLeaveRequests = await LeaveRequest.countDocuments({
      requestedBy: req.userId,
    });

    stats.students = students;
    stats.exams = exams;
    stats.assignments = assignments;
    stats.notifications = notifications;
    stats.myLeaveRequests = myLeaveRequests;
  } else if (req.userRole === 'student') {
    // Student stats
    const department = req.userDepartment;
    const exams = await Exam.countDocuments({ department });
    const assignments = await Assignment.countDocuments({ department });
    const notifications = await Notification.countDocuments({
      $or: [
        { targetRole: 'student', department },
        { targetRole: 'all', department },
        { targetRole: 'student', department: 'all' },
        { targetRole: 'all', department: 'all' },
      ],
    });

    // Get attendance stats
    const attendanceRecords = await Attendance.find({ userId: req.userId });
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a) => a.status === 'present').length;
    const attendancePercentage = totalAttendance > 0
      ? ((presentCount / totalAttendance) * 100).toFixed(2)
      : 0;

    stats.exams = exams;
    stats.assignments = assignments;
    stats.notifications = notifications;
    stats.attendance = {
      total: totalAttendance,
      present: presentCount,
      absent: totalAttendance - presentCount,
      percentage: parseFloat(attendancePercentage),
    };
  }

  res.status(200).json({
    success: true,
    stats,
  });
});


