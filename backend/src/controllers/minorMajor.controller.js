import MinorMajor from '../models/MinorMajor.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Get all minor/major configurations
 * @route   GET /api/minor-major
 * @access  Admin only
 */
export const getAllMinorMajor = asyncHandler(async (req, res) => {
  const { department, subjectType, isActive } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (subjectType) filter.subjectType = subjectType;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const minorMajorConfigs = await MinorMajor.find(filter)
    .sort({ department: 1, subjectType: 1, prioritySlot: 1 });

  res.status(200).json(
    new ApiResponse(200, minorMajorConfigs, 'Minor/Major configurations retrieved successfully')
  );
});

/**
 * @desc    Get minor/major configuration by ID
 * @route   GET /api/minor-major/:id
 * @access  Admin only
 */
export const getMinorMajorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const minorMajorConfig = await MinorMajor.findById(id);

  if (!minorMajorConfig) {
    throw new ApiError(404, 'Minor/Major configuration not found');
  }

  res.status(200).json(
    new ApiResponse(200, minorMajorConfig, 'Minor/Major configuration retrieved successfully')
  );
});

/**
 * @desc    Create new minor/major configuration
 * @route   POST /api/minor-major
 * @access  Admin only
 */
export const createMinorMajor = asyncHandler(async (req, res) => {
  const { department, subjectType, prioritySlot, description } = req.body;

  // Validation
  if (!department || !subjectType || !prioritySlot) {
    throw new ApiError(400, 'Department, subject type, and priority slot are required');
  }

  if (!['minor', 'major'].includes(subjectType)) {
    throw new ApiError(400, 'Subject type must be either "minor" or "major"');
  }

  if (prioritySlot < 1 || prioritySlot > 5) {
    throw new ApiError(400, 'Priority slot must be between 1 and 5');
  }

  // Check if configuration already exists for this department and subject type
  const existingConfig = await MinorMajor.findOne({
    department,
    subjectType,
  });

  if (existingConfig) {
    throw new ApiError(400, `${subjectType} configuration already exists for ${department} department`);
  }

  // Create new configuration
  const minorMajorConfig = await MinorMajor.create({
    department,
    subjectType,
    prioritySlot,
    description,
    createdBy: req.user._id || 'admin',
  });

  res.status(201).json(
    new ApiResponse(201, minorMajorConfig, 'Minor/Major configuration created successfully')
  );
});

/**
 * @desc    Update minor/major configuration
 * @route   PUT /api/minor-major/:id
 * @access  Admin only
 */
export const updateMinorMajor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { department, subjectType, prioritySlot, description, isActive } = req.body;

  const minorMajorConfig = await MinorMajor.findById(id);

  if (!minorMajorConfig) {
    throw new ApiError(404, 'Minor/Major configuration not found');
  }

  // Validation for updates
  if (subjectType && !['minor', 'major'].includes(subjectType)) {
    throw new ApiError(400, 'Subject type must be either "minor" or "major"');
  }

  if (prioritySlot && (prioritySlot < 1 || prioritySlot > 5)) {
    throw new ApiError(400, 'Priority slot must be between 1 and 5');
  }

  // Check for duplicate if department or subjectType is being changed
  if ((department && department !== minorMajorConfig.department) || 
      (subjectType && subjectType !== minorMajorConfig.subjectType)) {
    const existingConfig = await MinorMajor.findOne({
      department: department || minorMajorConfig.department,
      subjectType: subjectType || minorMajorConfig.subjectType,
      _id: { $ne: id }
    });

    if (existingConfig) {
      throw new ApiError(400, `${subjectType || minorMajorConfig.subjectType} configuration already exists for ${department || minorMajorConfig.department} department`);
    }
  }

  // Update fields
  if (department) minorMajorConfig.department = department;
  if (subjectType) minorMajorConfig.subjectType = subjectType;
  if (prioritySlot) minorMajorConfig.prioritySlot = prioritySlot;
  if (description !== undefined) minorMajorConfig.description = description;
  if (isActive !== undefined) minorMajorConfig.isActive = isActive;
  minorMajorConfig.lastModifiedBy = req.user._id || 'admin';

  await minorMajorConfig.save();

  res.status(200).json(
    new ApiResponse(200, minorMajorConfig, 'Minor/Major configuration updated successfully')
  );
});

/**
 * @desc    Delete minor/major configuration
 * @route   DELETE /api/minor-major/:id
 * @access  Admin only
 */
export const deleteMinorMajor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const minorMajorConfig = await MinorMajor.findById(id);

  if (!minorMajorConfig) {
    throw new ApiError(404, 'Minor/Major configuration not found');
  }

  await MinorMajor.findByIdAndDelete(id);

  res.status(200).json(
    new ApiResponse(200, null, 'Minor/Major configuration deleted successfully')
  );
});

/**
 * @desc    Get minor/major configurations by department
 * @route   GET /api/minor-major/department/:department
 * @access  Admin only
 */
export const getMinorMajorByDepartment = asyncHandler(async (req, res) => {
  const { department } = req.params;

  const minorMajorConfigs = await MinorMajor.find({
    department,
    isActive: true
  }).sort({ subjectType: 1, prioritySlot: 1 });

  res.status(200).json(
    new ApiResponse(200, minorMajorConfigs, `Minor/Major configurations for ${department} retrieved successfully`)
  );
});

/**
 * @desc    Toggle active status
 * @route   PATCH /api/minor-major/:id/toggle
 * @access  Admin only
 */
export const toggleMinorMajorStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const minorMajorConfig = await MinorMajor.findById(id);

  if (!minorMajorConfig) {
    throw new ApiError(404, 'Minor/Major configuration not found');
  }

  minorMajorConfig.isActive = !minorMajorConfig.isActive;
  minorMajorConfig.lastModifiedBy = req.user._id || 'admin';

  await minorMajorConfig.save();

  res.status(200).json(
    new ApiResponse(200, minorMajorConfig, `Minor/Major configuration ${minorMajorConfig.isActive ? 'activated' : 'deactivated'} successfully`)
  );
});