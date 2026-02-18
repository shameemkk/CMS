import User from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * @desc    Get User Profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @desc    Update User Profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;

  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (phone) updateData.phone = phone;

  const user = await User.findByIdAndUpdate(
    req.userId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role,
      status: user.status,
    },
  });
});

/**
 * @desc    Get All Pending Users (Admin Only)
 * @route   GET /api/users/pending
 * @access  Private/Admin
 */
export const getPendingUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ status: 'pending' }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map((user) => ({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    })),
  });
});

/**
 * @desc    Get All Users (Admin Only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { status, role, department, page = 1, limit = 10 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (role) query.role = role;
  if (department) query.department = department;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    users: users.map((user) => ({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    })),
  });
});

/**
 * @desc    Update User Status (Admin Only)
 * @route   PUT /api/users/:id/status
 * @access  Private/Admin
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status (pending, approved, rejected) is required',
    });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    message: `User status updated to ${status}`,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role,
      status: user.status,
    },
  });
});

/**
 * @desc    Get Users by Role and Department
 * @route   GET /api/users/by-role
 * @access  Private
 */
export const getUsersByRole = asyncHandler(async (req, res) => {
  const { role, department } = req.query;

  const query = { status: 'approved' };
  if (role) query.role = role;
  if (department) query.department = department;

  // If user is not admin, filter by their department
  if (req.userRole !== 'admin') {
    query.department = req.userDepartment;
  }

  const users = await User.find(query).sort({ fullName: 1 });

  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map((user) => ({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role,
    })),
  });
});


