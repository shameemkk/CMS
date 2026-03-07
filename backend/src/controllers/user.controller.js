import User from '../models/User.js';
import Batch from '../models/Batch.js';
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

  // Populate batch for students to get semester
  let batchData = null;
  if (user.role === 'student' && user.batch) {
    batchData = await Batch.findOne({ batchCode: user.batch });
  }

  const userResponse = {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    department: user.department,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };

  // Include registrationNumber and batch info for students, phone for others
  if (user.role === 'student') {
    userResponse.registrationNumber = user.registrationNumber;
    userResponse.batch = user.batch;
    userResponse.semester = batchData?.semester || null;
  } else {
    userResponse.phone = user.phone;
  }

  res.status(200).json({
    success: true,
    user: userResponse,
  });
});

/**
 * @desc    Update User Profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, registrationNumber } = req.body;

  const user = await User.findById(req.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  
  // Update registrationNumber for students, phone for others
  if (user.role === 'student' && registrationNumber) {
    updateData.registrationNumber = registrationNumber;
  } else if (user.role !== 'student' && phone) {
    updateData.phone = phone;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.userId,
    updateData,
    { new: true, runValidators: true }
  );

  const userResponse = {
    id: updatedUser._id,
    fullName: updatedUser.fullName,
    email: updatedUser.email,
    department: updatedUser.department,
    role: updatedUser.role,
    status: updatedUser.status,
  };

  // Include registrationNumber for students, phone for others
  if (updatedUser.role === 'student') {
    userResponse.registrationNumber = updatedUser.registrationNumber;
    userResponse.semester = updatedUser.semester;
    userResponse.batch = updatedUser.batch;
  } else {
    userResponse.phone = updatedUser.phone;
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: userResponse,
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
      registrationNumber: user.registrationNumber,
      department: user.department,
      batch: user.batch,
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
      registrationNumber: user.registrationNumber,
      department: user.department,
      batch: user.batch,
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
      registrationNumber: user.registrationNumber,
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

  // Get batch data for students to include semester
  const batchCodes = users
    .filter(u => u.role === 'student' && u.batch)
    .map(u => u.batch);
  
  const batches = await Batch.find({ batchCode: { $in: batchCodes } });
  const batchMap = batches.reduce((acc, batch) => {
    acc[batch.batchCode] = batch;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map((user) => ({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      registrationNumber: user.registrationNumber,
      department: user.department,
      semester: user.role === 'student' && user.batch ? batchMap[user.batch]?.semester : undefined,
      batch: user.batch,
      role: user.role,
    })),
  });
});

/**
 * @desc    Add Teacher (HOD can add teachers to their department)
 * @route   POST /api/users/teacher
 * @access  Private/HOD/Admin
 */
export const addTeacher = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, specialization } = req.body;

  // Validate required fields
  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: fullName, email, phone, password',
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Determine department
  let department;
  if (req.userRole === 'admin') {
    // Admin can specify department
    department = req.body.department || req.userDepartment;
  } else if (req.userRole === 'hod') {
    // HOD can only add to their own department
    department = req.userDepartment;
  } else {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to add teachers',
    });
  }

  // Create new teacher
  const teacher = new User({
    fullName,
    email,
    phone,
    password,
    department,
    role: 'teacher',
    status: 'approved', // Auto-approve teachers added by HOD/Admin
    specialization: specialization || 'General',
  });

  await teacher.save();

  res.status(201).json({
    success: true,
    message: 'Teacher added successfully',
    user: {
      id: teacher._id,
      fullName: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone,
      department: teacher.department,
      role: teacher.role,
      status: teacher.status,
      specialization: teacher.specialization,
    },
  });
});

/**
 * @desc    Update Teacher (HOD can update teachers in their department)
 * @route   PUT /api/users/teacher/:id
 * @access  Private/HOD/Admin
 */
export const updateTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, specialization } = req.body;

  // Find the teacher
  const teacher = await User.findById(id);
  
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  // Check if teacher belongs to HOD's department
  if (req.userRole === 'hod' && teacher.department !== req.userDepartment) {
    return res.status(403).json({
      success: false,
      message: 'You can only update teachers in your own department',
    });
  }

  // Update fields
  if (fullName) teacher.fullName = fullName;
  if (phone) teacher.phone = phone;
  if (specialization) teacher.specialization = specialization;

  await teacher.save();

  res.status(200).json({
    success: true,
    message: 'Teacher updated successfully',
    user: {
      id: teacher._id,
      fullName: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone,
      department: teacher.department,
      role: teacher.role,
      specialization: teacher.specialization,
    },
  });
});

/**
 * @desc    Delete Teacher (HOD can delete teachers from their department)
 * @route   DELETE /api/users/teacher/:id
 * @access  Private/HOD/Admin
 */
export const deleteTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the teacher
  const teacher = await User.findById(id);
  
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  if (teacher.role !== 'teacher') {
    return res.status(400).json({
      success: false,
      message: 'Can only delete users with teacher role',
    });
  }

  // Check if teacher belongs to HOD's department
  if (req.userRole === 'hod' && teacher.department !== req.userDepartment) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete teachers from your own department',
    });
  }

  await User.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Teacher deleted successfully',
  });
});

/**
 * @desc    Promote all students to next semester (HOD/Admin only)
 * @route   POST /api/users/promote-students
 * @access  Private/HOD/Admin
 */
export const promoteStudents = asyncHandler(async (req, res) => {
  // Determine department filter
  const departmentFilter = req.userRole === 'admin' 
    ? {} 
    : { department: req.userDepartment };

  // Find all active batches in the department
  const batches = await Batch.find({
    status: 'active',
    ...departmentFilter,
  });

  if (batches.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No active batches found to promote',
    });
  }

  let promotedCount = 0;
  let completedCount = 0;

  // Promote each batch
  for (const batch of batches) {
    if (batch.semester >= 8) {
      // Mark batch as completed if semester 8 or higher
      batch.status = 'completed';
      completedCount++;
    } else {
      // Promote to next semester
      batch.semester = batch.semester + 1;
      promotedCount++;
    }
    await batch.save();
  }

  res.status(200).json({
    success: true,
    message: `Successfully promoted ${promotedCount} batch(es) and marked ${completedCount} batch(es) as completed`,
    stats: {
      total: batches.length,
      promoted: promotedCount,
      completed: completedCount,
    },
  });
});



/**
 * @desc    Update User (HOD/Admin)
 * @route   PUT /api/users/:id
 * @access  Private/HOD/Admin
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, registrationNumber, batch } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // HODs can only update users in their department
  if (req.userRole === 'hod' && user.department !== req.userDepartment) {
    return res.status(403).json({
      success: false,
      message: 'You can only update users in your department',
    });
  }

  // Update fields
  if (fullName) user.fullName = fullName;
  
  // Update registrationNumber for students, phone for others
  if (user.role === 'student' && registrationNumber) {
    user.registrationNumber = registrationNumber;
  } else if (user.role !== 'student' && phone) {
    user.phone = phone;
  }
  
  if (batch && user.role === 'student') user.batch = batch.toUpperCase().trim();

  await user.save();

  // Get batch data for semester
  let batchData = null;
  if (user.role === 'student' && user.batch) {
    batchData = await Batch.findOne({ batchCode: user.batch });
  }

  const userResponse = {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    department: user.department,
    role: user.role,
    status: user.status,
  };

  // Include registrationNumber and batch info for students, phone for others
  if (user.role === 'student') {
    userResponse.registrationNumber = user.registrationNumber;
    userResponse.batch = user.batch;
    userResponse.semester = batchData?.semester || null;
  } else {
    userResponse.phone = user.phone;
  }

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user: userResponse,
  });
});

/**
 * @desc    Delete User (HOD/Admin)
 * @route   DELETE /api/users/:id
 * @access  Private/HOD/Admin
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // HODs can only delete users in their department
  if (req.userRole === 'hod' && user.department !== req.userDepartment) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete users in your department',
    });
  }

  await User.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});
