import Batch from '../models/Batch.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const buildBatchCode = (department, startDate, endDate) => {
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);
  const startYear = parsedStartDate.getUTCFullYear();
  const endYearShort = String(parsedEndDate.getUTCFullYear()).slice(-2);

  return `${department}- ${startYear}-${endYearShort}`;
};

const normalizeDepartment = (department = '') => department.trim().toUpperCase();

const serializeCreatedBy = async (createdBy) => {
  if (!createdBy) return null;

  if (createdBy === 'admin') {
    return {
      _id: 'admin',
      fullName: 'Admin',
      email: 'admin@cms.com',
    };
  }

  return User.findById(createdBy).select('fullName email');
};

const serializeBatch = async (batchDoc) => {
  const batch = batchDoc.toObject();
  batch.createdBy = await serializeCreatedBy(batch.createdBy);
  return batch;
};

// Create batch
const createBatch = asyncHandler(async (req, res) => {
  const { department, startDate, endDate, semester } = req.body;
  const requesterRole = req.user?.role || req.userRole;
  const requesterDepartment = normalizeDepartment(req.user?.department || req.userDepartment || '');

  // Validate required fields
  if (!startDate || !endDate || !semester) {
    throw new ApiError(400, 'Department, start date, end date, and semester are required');
  }

  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
    throw new ApiError(400, 'Invalid start date or end date');
  }

  if (parsedEndDate <= parsedStartDate) {
    throw new ApiError(400, 'End date must be greater than start date');
  }

  let normalizedDepartment = normalizeDepartment(department || '');

  if (requesterRole === 'hod') {
    if (normalizedDepartment && normalizedDepartment !== requesterDepartment) {
      throw new ApiError(403, 'You can only create batches for your own department');
    }
    normalizedDepartment = requesterDepartment;
  }

  if (!normalizedDepartment) {
    throw new ApiError(400, 'Department, start date, and end date are required');
  }

  // Generate batch code
  const batchCode = buildBatchCode(normalizedDepartment, parsedStartDate, parsedEndDate);

  // Check if batch already exists
  const existingBatch = await Batch.findOne({ batchCode });
  if (existingBatch) {
    throw new ApiError(400, 'Batch with this code already exists');
  }

  // Create batch
  const batch = await Batch.create({
    department: normalizedDepartment,
    startDate: parsedStartDate,
    endDate: parsedEndDate,
    batchCode,
    semester: parseInt(semester),
    createdBy: req.user._id,
  });

  const serializedBatch = await serializeBatch(batch);

  res.status(201).json(
    new ApiResponse(201, serializedBatch, 'Batch created successfully')
  );
});

// Get all batches
const getAllBatches = asyncHandler(async (req, res) => {
  const { status, department } = req.query;

  const filter = {};
  if (status) {
    filter.status = status;
  }
  if (department) {
    filter.department = department.toUpperCase();
  }

  const batches = await Batch.find(filter)
    .populate('tutor', 'fullName department specialization')
    .sort({ createdAt: -1 });

  const populatedBatches = await Promise.all(batches.map(serializeBatch));

  res.status(200).json(
    new ApiResponse(200, populatedBatches, 'Batches retrieved successfully')
  );
});

// Get batch by ID
const getBatchById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const batch = await Batch.findById(id).populate('tutor', 'fullName department specialization');

  if (!batch) {
    throw new ApiError(404, 'Batch not found');
  }

  const batchObj = await serializeBatch(batch);

  res.status(200).json(
    new ApiResponse(200, batchObj, 'Batch retrieved successfully')
  );
});

// Update batch
const updateBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { department, startDate, endDate, status, semester } = req.body;
  const requesterRole = req.user?.role || req.userRole;
  const requesterDepartment = normalizeDepartment(req.user?.department || req.userDepartment || '');

  const batch = await Batch.findById(id);
  if (!batch) {
    throw new ApiError(404, 'Batch not found');
  }

  if (requesterRole === 'hod' && batch.department !== requesterDepartment) {
    throw new ApiError(403, 'You can only update batches in your own department');
  }

  // Update fields if provided
  if (department) {
    const normalizedDepartment = normalizeDepartment(department);
    if (requesterRole === 'hod' && normalizedDepartment !== requesterDepartment) {
      throw new ApiError(403, 'You can only set your own department for batches');
    }
    batch.department = normalizedDepartment;
  }
  if (startDate) {
    const parsedStartDate = new Date(startDate);
    if (Number.isNaN(parsedStartDate.getTime())) {
      throw new ApiError(400, 'Invalid start date');
    }
    batch.startDate = parsedStartDate;
  }
  if (endDate) {
    const parsedEndDate = new Date(endDate);
    if (Number.isNaN(parsedEndDate.getTime())) {
      throw new ApiError(400, 'Invalid end date');
    }
    batch.endDate = parsedEndDate;
  }
  if (status) batch.status = status;
  if (semester) batch.semester = parseInt(semester);

  // Regenerate batch code if relevant fields changed
  if (department || startDate || endDate) {
    if (batch.endDate <= batch.startDate) {
      throw new ApiError(400, 'End date must be greater than start date');
    }
    batch.batchCode = buildBatchCode(batch.department, batch.startDate, batch.endDate);
  }

  await batch.save();

  const updatedBatch = await Batch.findById(batch._id).populate(
    'tutor',
    'fullName department specialization'
  );
  const batchObj = await serializeBatch(updatedBatch);

  res.status(200).json(new ApiResponse(200, batchObj, 'Batch updated successfully'));
});

// Assign or clear batch tutor
const assignBatchTutor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tutorId } = req.body;
  const requesterRole = req.user?.role || req.userRole;
  const requesterDepartment = normalizeDepartment(req.user?.department || req.userDepartment || '');

  const batch = await Batch.findById(id);
  if (!batch) {
    throw new ApiError(404, 'Batch not found');
  }

  if (requesterRole === 'hod' && batch.department !== requesterDepartment) {
    throw new ApiError(403, 'You can only assign tutors to batches in your own department');
  }

  if (!tutorId) {
    batch.tutor = null;
  } else {
    const tutor = await User.findById(tutorId).select('role department status');
    if (!tutor || tutor.role !== 'teacher') {
      throw new ApiError(400, 'Selected user is not a valid teacher');
    }

    if (tutor.status !== 'approved') {
      throw new ApiError(400, 'Only approved teachers can be assigned as tutors');
    }

    if (normalizeDepartment(tutor.department) !== batch.department) {
      throw new ApiError(400, 'Teacher must belong to the same department as the batch');
    }

    batch.tutor = tutor._id;
  }

  await batch.save();

  const updatedBatch = await Batch.findById(batch._id).populate(
    'tutor',
    'fullName department specialization'
  );
  const batchObj = await serializeBatch(updatedBatch);

  res.status(200).json(
    new ApiResponse(200, batchObj, 'Batch tutor updated successfully')
  );
});

// Delete batch
const deleteBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const batch = await Batch.findById(id);
  if (!batch) {
    throw new ApiError(404, 'Batch not found');
  }

  await Batch.findByIdAndDelete(id);

  res.status(200).json(
    new ApiResponse(200, null, 'Batch deleted successfully')
  );
});

export {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  assignBatchTutor,
  deleteBatch,
};
