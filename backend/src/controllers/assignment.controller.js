import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * @desc    Create Assignment
 * @route   POST /api/assignments
 * @access  Private (Teacher, HOD, Admin)
 */
export const createAssignment = asyncHandler(async (req, res) => {
  const { subject, questions, dueDate, marks } = req.body;

  if (!subject || !questions || !dueDate || !marks) {
    return res.status(400).json({
      success: false,
      message: 'Subject, questions, due date, and marks are required',
    });
  }

  // Determine department value - use provided department or user's department
  const departmentValue = req.userRole === 'admin' && req.body.department 
    ? req.body.department 
    : req.userDepartment;

  // Validate department for non-admin users
  if (req.userRole !== 'admin' && departmentValue === 'all') {
    return res.status(400).json({
      success: false,
      message: 'Department must be specified for non-admin users',
    });
  }

  // Determine createdBy value - ObjectId for Teacher/HOD, string 'admin' for admin
  const createdByValue = req.userRole === 'admin' ? 'admin' : req.userId;

  const assignment = await Assignment.create({
    department: departmentValue,
    subject,
    questions,
    dueDate: new Date(dueDate),
    marks,
    createdBy: createdByValue,
  });

  // Format createdBy in response
  const assignmentObj = assignment.toObject();
  if (assignmentObj.createdBy === 'admin') {
    assignmentObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(assignmentObj.createdBy).select('fullName');
    assignmentObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : assignmentObj.createdBy;
  }

  res.status(201).json({
    success: true,
    message: 'Assignment created successfully',
    assignment: assignmentObj,
  });
});

/**
 * @desc    Get All Assignments
 * @route   GET /api/assignments
 * @access  Private
 */
export const getAssignments = asyncHandler(async (req, res) => {
  const { department, subject } = req.query;

  const query = {};

  // Filter by department
  if (department) {
    query.department = department;
  } else if (req.userRole !== 'admin') {
    query.department = req.userDepartment;
  }

  if (subject) {
    query.subject = subject;
  }

  const assignments = await Assignment.find(query)
    .sort({ createdAt: -1 });

  // Manually populate createdBy only if it's an ObjectId (not 'admin')
  const assignmentsWithCreatedBy = await Promise.all(
    assignments.map(async (record) => {
      const assignmentObj = record.toObject();
      if (assignmentObj.createdBy && assignmentObj.createdBy !== 'admin') {
        const createdByUser = await User.findById(assignmentObj.createdBy).select('fullName');
        assignmentObj.createdBy = createdByUser
          ? { _id: createdByUser._id, fullName: createdByUser.fullName }
          : assignmentObj.createdBy;
      } else if (assignmentObj.createdBy === 'admin') {
        assignmentObj.createdBy = { _id: 'admin', fullName: 'Admin' };
      }
      return assignmentObj;
    })
  );

  res.status(200).json({
    success: true,
    count: assignmentsWithCreatedBy.length,
    assignments: assignmentsWithCreatedBy,
  });
});

/**
 * @desc    Get Single Assignment
 * @route   GET /api/assignments/:id
 * @access  Private
 */
export const getAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assignment = await Assignment.findById(id);

  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Assignment not found',
    });
  }

  // Format createdBy in response
  const assignmentObj = assignment.toObject();
  if (assignmentObj.createdBy === 'admin') {
    assignmentObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(assignmentObj.createdBy).select('fullName');
    assignmentObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : assignmentObj.createdBy;
  }

  // Check permissions
  if (req.userRole !== 'admin' && assignmentObj.department !== req.userDepartment) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  res.status(200).json({
    success: true,
    assignment: assignmentObj,
  });
});

/**
 * @desc    Update Assignment
 * @route   PUT /api/assignments/:id
 * @access  Private (Teacher, HOD, Admin)
 */
export const updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subject, questions, dueDate, marks } = req.body;

  const assignment = await Assignment.findById(id);

  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Assignment not found',
    });
  }

  // Check permissions
  if (req.userRole !== 'admin' && assignment.department !== req.userDepartment) {
    return res.status(403).json({
      success: false,
      message: 'You can only update assignments for your department',
    });
  }

  const updateData = {};
  if (subject) updateData.subject = subject;
  if (questions) updateData.questions = questions;
  if (dueDate) updateData.dueDate = new Date(dueDate);
  if (marks !== undefined) updateData.marks = marks;

  const updatedAssignment = await Assignment.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  // Format createdBy in response
  const assignmentObj = updatedAssignment.toObject();
  if (assignmentObj.createdBy === 'admin') {
    assignmentObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(assignmentObj.createdBy).select('fullName');
    assignmentObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : assignmentObj.createdBy;
  }

  res.status(200).json({
    success: true,
    message: 'Assignment updated successfully',
    assignment: assignmentObj,
  });
});

/**
 * @desc    Delete Assignment
 * @route   DELETE /api/assignments/:id
 * @access  Private (HOD, Admin)
 */
export const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assignment = await Assignment.findById(id);

  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Assignment not found',
    });
  }

  // Check permissions
  if (req.userRole !== 'admin' && assignment.department !== req.userDepartment) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete assignments for your department',
    });
  }

  await Assignment.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Assignment deleted successfully',
  });
});


