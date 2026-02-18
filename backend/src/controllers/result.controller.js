import Result from '../models/Result.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * @desc    Create/Update Result
 * @route   POST /api/results
 * @access  Private (Teacher, HOD, Admin)
 */
export const createResult = asyncHandler(async (req, res) => {
  const { studentId, examId, subject, marks } = req.body;

  if (!studentId || !examId || !subject || marks === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Student ID, exam ID, subject, and marks are required',
    });
  }

  // Validate student exists
  const student = await User.findById(studentId);
  if (!student || student.role !== 'student') {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  // Validate exam exists
  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found',
    });
  }

  // Check permissions
  if (req.userRole !== 'admin' && exam.department !== req.userDepartment) {
    return res.status(403).json({
      success: false,
      message: 'You can only add results for exams in your department',
    });
  }

  // Determine pass/fail status (assuming passing marks is 40)
  const passingMarks = 40;
  const status = marks >= passingMarks ? 'pass' : 'fail';

  // Check if result already exists
  const existingResult = await Result.findOne({
    studentId,
    examId,
    subject,
  });

  // Determine createdBy value - ObjectId for Teacher/HOD, string 'admin' for admin
  const createdByValue = req.userRole === 'admin' ? 'admin' : req.userId;

  if (existingResult) {
    // Update existing result
    existingResult.marks = marks;
    existingResult.status = status;
    existingResult.createdBy = createdByValue;
    await existingResult.save();

    // Format createdBy in response
    const resultObj = existingResult.toObject();
    if (resultObj.createdBy === 'admin') {
      resultObj.createdBy = { _id: 'admin', fullName: 'Admin' };
    } else {
      const createdByUser = await User.findById(resultObj.createdBy).select('fullName');
      resultObj.createdBy = createdByUser
        ? { _id: createdByUser._id, fullName: createdByUser.fullName }
        : resultObj.createdBy;
    }

    return res.status(200).json({
      success: true,
      message: 'Result updated successfully',
      result: resultObj,
    });
  }

  // Create new result
  const result = await Result.create({
    studentId,
    examId,
    subject,
    marks,
    status,
    createdBy: createdByValue,
  });

  // Format createdBy in response
  const resultObj = result.toObject();
  if (resultObj.createdBy === 'admin') {
    resultObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(resultObj.createdBy).select('fullName');
    resultObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : resultObj.createdBy;
  }

  res.status(201).json({
    success: true,
    message: 'Result created successfully',
    result: resultObj,
  });
});

/**
 * @desc    Get Results
 * @route   GET /api/results
 * @access  Private
 */
export const getResults = asyncHandler(async (req, res) => {
  const { studentId, examId, subject } = req.query;

  const query = {};

  // Students can only see their own results
  if (req.userRole === 'student') {
    query.studentId = req.userId;
  } else if (studentId) {
    query.studentId = studentId;
  }

  if (examId) query.examId = examId;
  if (subject) query.subject = subject;

  const results = await Result.find(query)
    .populate('studentId', 'fullName email department')
    .populate('examId', 'examName department')
    .sort({ createdAt: -1 });

  // Manually populate createdBy only if it's an ObjectId (not 'admin')
  const resultsWithCreatedBy = await Promise.all(
    results.map(async (record) => {
      const resultObj = record.toObject();
      if (resultObj.createdBy && resultObj.createdBy !== 'admin') {
        const createdByUser = await User.findById(resultObj.createdBy).select('fullName');
        resultObj.createdBy = createdByUser
          ? { _id: createdByUser._id, fullName: createdByUser.fullName }
          : resultObj.createdBy;
      } else if (resultObj.createdBy === 'admin') {
        resultObj.createdBy = { _id: 'admin', fullName: 'Admin' };
      }
      return resultObj;
    })
  );

  res.status(200).json({
    success: true,
    count: resultsWithCreatedBy.length,
    results: resultsWithCreatedBy,
  });
});

/**
 * @desc    Get Single Result
 * @route   GET /api/results/:id
 * @access  Private
 */
export const getResult = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await Result.findById(id)
    .populate('studentId', 'fullName email department')
    .populate('examId', 'examName department');

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Result not found',
    });
  }

  // Format createdBy in response
  const resultObj = result.toObject();
  if (resultObj.createdBy === 'admin') {
    resultObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(resultObj.createdBy).select('fullName');
    resultObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : resultObj.createdBy;
  }

  // Check permissions
  if (req.userRole === 'student' && resultObj.studentId._id.toString() !== req.userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  res.status(200).json({
    success: true,
    result: resultObj,
  });
});

/**
 * @desc    Delete Result
 * @route   DELETE /api/results/:id
 * @access  Private (HOD, Admin)
 */
export const deleteResult = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await Result.findById(id);

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Result not found',
    });
  }

  // Check permissions
  if (req.userRole !== 'admin' && req.userRole !== 'hod') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only HOD and Admin can delete results',
    });
  }

  await Result.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Result deleted successfully',
  });
});


