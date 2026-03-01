import Batch from '../models/Batch.js';
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

// Create batch
const createBatch = asyncHandler(async (req, res) => {
  const { department, startDate, endDate } = req.body;

  // Validate required fields
  if (!department || !startDate || !endDate) {
    throw new ApiError(400, 'Department, start date, and end date are required');
  }

  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
    throw new ApiError(400, 'Invalid start date or end date');
  }

  if (parsedEndDate <= parsedStartDate) {
    throw new ApiError(400, 'End date must be greater than start date');
  }

  const normalizedDepartment = department.trim().toUpperCase();

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
    createdBy: req.user._id,
  });

  res.status(201).json(
    new ApiResponse(201, batch, 'Batch created successfully')
  );
});

// Get all batches
const getAllBatches = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) {
    filter.status = status;
  }

  const batches = await Batch.find(filter).sort({ createdAt: -1 });

  // Manually populate createdBy for non-admin users
  const populatedBatches = await Promise.all(
    batches.map(async (batch) => {
      const batchObj = batch.toObject();
      if (batchObj.createdBy === 'admin') {
        batchObj.createdBy = {
          _id: 'admin',
          fullName: 'Admin',
          email: 'admin@cms.com',
        };
      } else if (batchObj.createdBy) {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(batchObj.createdBy).select('fullName email');
        batchObj.createdBy = user;
      }
      return batchObj;
    })
  );

  res.status(200).json(
    new ApiResponse(200, populatedBatches, 'Batches retrieved successfully')
  );
});

// Get batch by ID
const getBatchById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const batch = await Batch.findById(id);

  if (!batch) {
    throw new ApiError(404, 'Batch not found');
  }

  const batchObj = batch.toObject();
  
  // Handle admin createdBy
  if (batchObj.createdBy === 'admin') {
    batchObj.createdBy = {
      _id: 'admin',
      fullName: 'Admin',
      email: 'admin@cms.com',
    };
  } else if (batchObj.createdBy) {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(batchObj.createdBy).select('fullName email');
    batchObj.createdBy = user;
  }

  res.status(200).json(
    new ApiResponse(200, batchObj, 'Batch retrieved successfully')
  );
});

// Update batch
const updateBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { department, startDate, endDate, status } = req.body;

  const batch = await Batch.findById(id);
  if (!batch) {
    throw new ApiError(404, 'Batch not found');
  }

  // Update fields if provided
  if (department) batch.department = department.trim().toUpperCase();
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

  // Regenerate batch code if relevant fields changed
  if (department || startDate || endDate) {
    if (batch.endDate <= batch.startDate) {
      throw new ApiError(400, 'End date must be greater than start date');
    }
    batch.batchCode = buildBatchCode(batch.department, batch.startDate, batch.endDate);
  }

  await batch.save();

  const batchObj = batch.toObject();
  
  // Handle admin createdBy
  if (batchObj.createdBy === 'admin') {
    batchObj.createdBy = {
      _id: 'admin',
      fullName: 'Admin',
      email: 'admin@cms.com',
    };
  } else if (batchObj.createdBy) {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(batchObj.createdBy).select('fullName email');
    batchObj.createdBy = user;
  }

  res.status(200).json(
    new ApiResponse(200, batchObj, 'Batch updated successfully')
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
  deleteBatch,
};
