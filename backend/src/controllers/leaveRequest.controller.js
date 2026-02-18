import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * @desc    Create Leave Request
 * @route   POST /api/leave-requests
 * @access  Private
 */
export const createLeaveRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Reason is required',
    });
  }

  const leaveRequest = await LeaveRequest.create({
    requestedBy: req.userId,
    role: req.userRole,
    reason,
    status: 'pending',
  });

  const populatedRequest = await LeaveRequest.findById(leaveRequest._id)
    .populate('requestedBy', 'fullName email department');

  res.status(201).json({
    success: true,
    message: 'Leave request created successfully',
    leaveRequest: populatedRequest,
  });
});

/**
 * @desc    Get Leave Requests
 * @route   GET /api/leave-requests
 * @access  Private
 */
export const getLeaveRequests = asyncHandler(async (req, res) => {
  const { status, role } = req.query;

  const query = {};

  // Students and Teachers can only see their own requests
  if (req.userRole === 'student' || req.userRole === 'teacher') {
    query.requestedBy = req.userId;
  } else if (req.userRole === 'hod') {
    // HOD can see requests from teachers in their department
    query.role = 'teacher';
    // We'll filter by department in the populate
  }

  if (status) {
    query.status = status;
  }

  if (role) {
    query.role = role;
  }

  let leaveRequests = await LeaveRequest.find(query)
    .populate('requestedBy', 'fullName email department role')
    .sort({ createdAt: -1 });

  // Filter by department for HOD
  if (req.userRole === 'hod') {
    leaveRequests = leaveRequests.filter(
      (request) => request.requestedBy.department === req.userDepartment
    );
  }

  // Manually populate reviewedBy only if it's an ObjectId (not 'admin')
  const leaveRequestsWithReviewedBy = await Promise.all(
    leaveRequests.map(async (record) => {
      const leaveRequestObj = record.toObject();
      if (leaveRequestObj.reviewedBy && leaveRequestObj.reviewedBy !== 'admin') {
        const reviewedByUser = await User.findById(leaveRequestObj.reviewedBy).select('fullName');
        leaveRequestObj.reviewedBy = reviewedByUser
          ? { _id: reviewedByUser._id, fullName: reviewedByUser.fullName }
          : leaveRequestObj.reviewedBy;
      } else if (leaveRequestObj.reviewedBy === 'admin') {
        leaveRequestObj.reviewedBy = { _id: 'admin', fullName: 'Admin' };
      }
      return leaveRequestObj;
    })
  );

  res.status(200).json({
    success: true,
    count: leaveRequestsWithReviewedBy.length,
    leaveRequests: leaveRequestsWithReviewedBy,
  });
});

/**
 * @desc    Get Single Leave Request
 * @route   GET /api/leave-requests/:id
 * @access  Private
 */
export const getLeaveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const leaveRequest = await LeaveRequest.findById(id)
    .populate('requestedBy', 'fullName email department role');

  if (!leaveRequest) {
    return res.status(404).json({
      success: false,
      message: 'Leave request not found',
    });
  }

  // Format reviewedBy in response
  const leaveRequestObj = leaveRequest.toObject();
  if (leaveRequestObj.reviewedBy === 'admin') {
    leaveRequestObj.reviewedBy = { _id: 'admin', fullName: 'Admin' };
  } else if (leaveRequestObj.reviewedBy) {
    const reviewedByUser = await User.findById(leaveRequestObj.reviewedBy).select('fullName');
    leaveRequestObj.reviewedBy = reviewedByUser
      ? { _id: reviewedByUser._id, fullName: reviewedByUser.fullName }
      : leaveRequestObj.reviewedBy;
  }

  // Check permissions
  if (req.userRole === 'student' || req.userRole === 'teacher') {
    if (leaveRequestObj.requestedBy._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
  } else if (req.userRole === 'hod') {
    if (leaveRequestObj.requestedBy.department !== req.userDepartment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
  }

  res.status(200).json({
    success: true,
    leaveRequest: leaveRequestObj,
  });
});

/**
 * @desc    Update Leave Request Status (Approve/Reject)
 * @route   PUT /api/leave-requests/:id/status
 * @access  Private (HOD for teachers, Admin for all)
 */
export const updateLeaveRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status (approved or rejected) is required',
    });
  }

  const leaveRequest = await LeaveRequest.findById(id).populate('requestedBy', 'department role');

  if (!leaveRequest) {
    return res.status(404).json({
      success: false,
      message: 'Leave request not found',
    });
  }

  // Check permissions
  if (req.userRole === 'hod') {
    // HOD can only approve/reject teacher requests in their department
    if (leaveRequest.requestedBy.role !== 'teacher' || leaveRequest.requestedBy.department !== req.userDepartment) {
      return res.status(403).json({
        success: false,
        message: 'You can only review leave requests from teachers in your department',
      });
    }
  } else if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  // Determine reviewedBy value - ObjectId for HOD, string 'admin' for admin
  const reviewedByValue = req.userRole === 'admin' ? 'admin' : req.userId;

  // Update status
  leaveRequest.status = status;
  leaveRequest.reviewedBy = reviewedByValue;
  leaveRequest.reviewedAt = new Date();
  await leaveRequest.save();

  const populatedRequest = await LeaveRequest.findById(id)
    .populate('requestedBy', 'fullName email department role');

  // Format reviewedBy in response
  const leaveRequestObj = populatedRequest.toObject();
  if (leaveRequestObj.reviewedBy === 'admin') {
    leaveRequestObj.reviewedBy = { _id: 'admin', fullName: 'Admin' };
  } else if (leaveRequestObj.reviewedBy) {
    const reviewedByUser = await User.findById(leaveRequestObj.reviewedBy).select('fullName');
    leaveRequestObj.reviewedBy = reviewedByUser
      ? { _id: reviewedByUser._id, fullName: reviewedByUser.fullName }
      : leaveRequestObj.reviewedBy;
  }

  res.status(200).json({
    success: true,
    message: `Leave request ${status} successfully`,
    leaveRequest: leaveRequestObj,
  });
});

/**
 * @desc    Delete Leave Request
 * @route   DELETE /api/leave-requests/:id
 * @access  Private (Only own requests or Admin)
 */
export const deleteLeaveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const leaveRequest = await LeaveRequest.findById(id);

  if (!leaveRequest) {
    return res.status(404).json({
      success: false,
      message: 'Leave request not found',
    });
  }

  // Check permissions
  if (req.userRole !== 'admin' && leaveRequest.requestedBy.toString() !== req.userId) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own leave requests',
    });
  }

  await LeaveRequest.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Leave request deleted successfully',
  });
});


