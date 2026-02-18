import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { config } from '../config/env.js';

/**
 * @desc    Admin Login
 * @route   POST /api/auth/admin/login
 * @access  Public
 */
export const adminLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required',
    });
  }

  // Verify admin credentials from .env
  if (username !== config.admin.username || password !== config.admin.password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid admin credentials',
    });
  }

  // Generate token for admin
  const token = generateToken({
    userId: 'admin',
    role: 'admin',
    department: 'all',
    status: 'approved',
  });

  res.status(200).json({
    success: true,
    message: 'Admin login successful',
    token,
    user: {
      fullName: 'Admin',
      email: 'admin@cms.com',
      role: 'admin',
      department: 'all',
      status: 'approved',
    },
  });
});

/**
 * @desc    User Registration
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, department, role, password, confirmPassword } = req.body;

  // Validation
  if (!fullName || !email || !phone || !department || !role || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
  }

  // Create user with pending status
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    phone,
    department,
    role: role.toLowerCase(),
    password,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please wait for admin approval.',
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
 * @desc    User Login
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  // Find user and include password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check if user is approved
  if (user.status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: `Your account is ${user.status}. Please wait for admin approval.`,
      status: user.status,
    });
  }

  // Generate token
  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
    department: user.department,
    status: user.status,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
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
 * @desc    Change Password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'All password fields are required',
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'New passwords do not match',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long',
    });
  }

  // Get user with password
  const user = await User.findById(req.userId).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * @desc    Get Current User
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
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


