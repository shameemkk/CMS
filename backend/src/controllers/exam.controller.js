import Exam from '../models/Exam.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * @desc    Create Exam
 * @route   POST /api/exams
 * @access  Private (Teacher, HOD, Admin)
 */
export const createExam = asyncHandler(async (req, res) => {
  const { examName, subjects, examSchedule } = req.body;

  if (!examName || !subjects || !examSchedule) {
    return res.status(400).json({
      success: false,
      message: 'Exam name, subjects, and exam schedule are required',
    });
  }

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Subjects must be a non-empty array',
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

  const exam = await Exam.create({
    department: departmentValue,
    examName,
    subjects,
    examSchedule,
    createdBy: createdByValue,
  });

  // Format createdBy in response
  const examObj = exam.toObject();
  if (examObj.createdBy === 'admin') {
    examObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(examObj.createdBy).select('fullName');
    examObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : examObj.createdBy;
  }

  res.status(201).json({
    success: true,
    message: 'Exam created successfully',
    exam: examObj,
  });
});

/**
 * @desc    Get All Exams
 * @route   GET /api/exams
 * @access  Private
 */
export const getExams = asyncHandler(async (req, res) => {
  const { department } = req.query;

  const query = {};

  // Filter by department
  if (department) {
    query.department = department;
  } else if (req.userRole !== 'admin') {
    query.department = req.userDepartment;
  }

  const exams = await Exam.find(query)
    .sort({ createdAt: -1 });

  // Manually populate createdBy only if it's an ObjectId (not 'admin')
  const examsWithCreatedBy = await Promise.all(
    exams.map(async (record) => {
      const examObj = record.toObject();
      if (examObj.createdBy && examObj.createdBy !== 'admin') {
        const createdByUser = await User.findById(examObj.createdBy).select('fullName');
        examObj.createdBy = createdByUser
          ? { _id: createdByUser._id, fullName: createdByUser.fullName }
          : examObj.createdBy;
      } else if (examObj.createdBy === 'admin') {
        examObj.createdBy = { _id: 'admin', fullName: 'Admin' };
      }
      return examObj;
    })
  );

  res.status(200).json({
    success: true,
    count: examsWithCreatedBy.length,
    exams: examsWithCreatedBy,
  });
});

/**
 * @desc    Get Single Exam
 * @route   GET /api/exams/:id
 * @access  Private
 */
export const getExam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found',
    });
  }

  // Format createdBy in response
  const examObj = exam.toObject();
  if (examObj.createdBy === 'admin') {
    examObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(examObj.createdBy).select('fullName');
    examObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : examObj.createdBy;
  }

  // Check permissions
  if (req.userRole !== 'admin' && examObj.department !== req.userDepartment) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  res.status(200).json({
    success: true,
    exam: examObj,
  });
});

/**
 * @desc    Update Exam
 * @route   PUT /api/exams/:id
 * @access  Private (Teacher, HOD, Admin)
 */
export const updateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { examName, subjects, examSchedule } = req.body;

  const exam = await Exam.findById(id);

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
      message: 'You can only update exams for your department',
    });
  }

  const updateData = {};
  if (examName) updateData.examName = examName;
  if (subjects) updateData.subjects = subjects;
  if (examSchedule) updateData.examSchedule = examSchedule;

  const updatedExam = await Exam.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  // Format createdBy in response
  const examObj = updatedExam.toObject();
  if (examObj.createdBy === 'admin') {
    examObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(examObj.createdBy).select('fullName');
    examObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : examObj.createdBy;
  }

  res.status(200).json({
    success: true,
    message: 'Exam updated successfully',
    exam: examObj,
  });
});

/**
 * @desc    Delete Exam
 * @route   DELETE /api/exams/:id
 * @access  Private (HOD, Admin)
 */
export const deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id);

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
      message: 'You can only delete exams for your department',
    });
  }

  await Exam.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Exam deleted successfully',
  });
});


