import Subject from '../models/Subject.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * @desc    Create Subject
 * @route   POST /api/subjects
 * @access  Private (HOD, Admin)
 */
export const createSubject = asyncHandler(async (req, res) => {
  const { name, code, department, semester, credits, description } = req.body;

  // Check permissions - only HOD and Admin can create subjects
  if (!['hod', 'admin'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Only HOD and Admin can create subjects',
    });
  }

  // HODs can only create subjects for their department
  if (req.userRole === 'hod' && req.userDepartment !== department) {
    return res.status(403).json({
      success: false,
      message: 'You can only create subjects for your department',
    });
  }

  const subject = await Subject.create({
    name,
    code: code.toUpperCase(),
    department,
    semester,
    credits,
    description,
    createdBy: req.userId,
  });

  await subject.populate('createdBy', 'fullName');

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    subject,
  });
});

/**
 * @desc    Get Subjects
 * @route   GET /api/subjects
 * @access  Private
 */
export const getSubjects = asyncHandler(async (req, res) => {
  const { department, semester, status } = req.query;

  const query = {};

  // Filter by department
  if (department) {
    query.department = department;
  } else if (req.userRole !== 'admin') {
    // Non-admin users can only see subjects from their department
    query.department = req.userDepartment;
  }

  // Filter by semester
  if (semester) {
    query.semester = parseInt(semester);
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  const subjects = await Subject.find(query)
    .populate('createdBy', 'fullName')
    .sort({ department: 1, semester: 1, name: 1 });

  res.status(200).json({
    success: true,
    count: subjects.length,
    subjects,
  });
});

/**
 * @desc    Update Subject
 * @route   PUT /api/subjects/:id
 * @access  Private (HOD, Admin)
 */
export const updateSubject = asyncHandler(async (req, res) => {
  const { name, code, department, semester, credits, description, status } = req.body;

  // Check permissions
  if (!['hod', 'admin'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Only HOD and Admin can update subjects',
    });
  }

  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  // HODs can only update subjects from their department
  if (req.userRole === 'hod' && req.userDepartment !== subject.department) {
    return res.status(403).json({
      success: false,
      message: 'You can only update subjects from your department',
    });
  }

  // Update fields
  if (name) subject.name = name;
  if (code) subject.code = code.toUpperCase();
  if (department) subject.department = department;
  if (semester) subject.semester = semester;
  if (credits) subject.credits = credits;
  if (description !== undefined) subject.description = description;
  if (status) subject.status = status;

  await subject.save();
  await subject.populate('createdBy', 'fullName');

  res.status(200).json({
    success: true,
    message: 'Subject updated successfully',
    subject,
  });
});

/**
 * @desc    Delete Subject
 * @route   DELETE /api/subjects/:id
 * @access  Private (HOD, Admin)
 */
export const deleteSubject = asyncHandler(async (req, res) => {
  // Check permissions
  if (!['hod', 'admin'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Only HOD and Admin can delete subjects',
    });
  }

  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  // HODs can only delete subjects from their department
  if (req.userRole === 'hod' && req.userDepartment !== subject.department) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete subjects from your department',
    });
  }

  await Subject.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Subject deleted successfully',
  });
});