import Batch from '../models/Batch.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Create batch
const createBatch = asyncHandler(async (req, res) => {
  const { prefix, letter, courseCode, courseName, startYear, endYear } = req.body;

  // Validate required fields
  if (!prefix || !letter || !courseCode || !courseName || !startYear || !endYear) {
    throw new ApiError(400, 'All fields are required');
  }

  // Generate batch code
  const batchCode = `${prefix}${letter}_${courseCode} (${startYear}-${endYear})`;

  // Check if batch already exists
  const existingBatch = await Batch.findOne({ batchCode });
  if (existingBatch) {
    throw new ApiError(400, 'Batch with this code already exists');
  }

  // Create batch
  const batch = await Batch.create({
    prefix: prefix.toUpperCase(),
    letter: letter.toUpperCase(),
    courseCode: courseCode.toUpperCase(),
    courseName,
    startYear: parseInt(startYear),
    endYear: parseInt(endYear),
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
  const { prefix, letter, courseCode, courseName, startYear, endYear, status } = req.body;

  const batch = await Batch.findById(id);
  if (!batch) {
    throw new ApiError(404, 'Batch not found');
  }

  // Update fields if provided
  if (prefix) batch.prefix = prefix.toUpperCase();
  if (letter) batch.letter = letter.toUpperCase();
  if (courseCode) batch.courseCode = courseCode.toUpperCase();
  if (courseName) batch.courseName = courseName;
  if (startYear) batch.startYear = parseInt(startYear);
  if (endYear) batch.endYear = parseInt(endYear);
  if (status) batch.status = status;

  // Regenerate batch code if relevant fields changed
  if (prefix || letter || courseCode || startYear || endYear) {
    batch.batchCode = `${batch.prefix}${batch.letter}_${batch.courseCode} (${batch.startYear}-${batch.endYear})`;
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
