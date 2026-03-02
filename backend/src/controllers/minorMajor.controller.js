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
  const { department, subjectType, isActive, semester } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (subjectType) filter.subjectType = subjectType;
  if (semester) filter.semester = Number(semester);
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
  const { department, subjectType, prioritySlot, description, semester } = req.body;

  // Validation
  if (!department || !subjectType || !prioritySlot || !semester) {
    throw new ApiError(400, 'Department, subject type, priority slot, and semester are required');
  }

  if (!['minor1', 'minor2', 'major'].includes(subjectType)) {
    throw new ApiError(400, 'Subject type must be "minor1", "minor2", or "major"');
  }

  if (prioritySlot < 1 || prioritySlot > 5) {
    throw new ApiError(400, 'Priority slot must be between 1 and 5');
  }

  if (semester < 1 || semester > 8) {
    throw new ApiError(400, 'Semester must be between 1 and 8');
  }

  // Check if configuration already exists for this department, subjectType, and semester
  const existingConfig = await MinorMajor.findOne({
    department,
    subjectType,
    semester,
  });

  if (existingConfig) {
    throw new ApiError(400, `${subjectType} configuration already exists for ${department} department in semester ${semester}`);
  }

  // Create new configuration
  const minorMajorConfig = await MinorMajor.create({
    department,
    subjectType,
    semester,
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
  const { department, subjectType, prioritySlot, description, isActive, semester } = req.body;

  const minorMajorConfig = await MinorMajor.findById(id);

  if (!minorMajorConfig) {
    throw new ApiError(404, 'Minor/Major configuration not found');
  }

  // Validation for updates
  if (subjectType && !['minor1', 'minor2', 'major'].includes(subjectType)) {
    throw new ApiError(400, 'Subject type must be "minor1", "minor2", or "major"');
  }

  if (prioritySlot && (prioritySlot < 1 || prioritySlot > 5)) {
    throw new ApiError(400, 'Priority slot must be between 1 and 5');
  }

  if (semester && (semester < 1 || semester > 8)) {
    throw new ApiError(400, 'Semester must be between 1 and 8');
  }

  // Check for duplicate if department, subjectType, or semester is being changed
  if ((department && department !== minorMajorConfig.department) ||
    (subjectType && subjectType !== minorMajorConfig.subjectType) ||
    (semester && semester !== minorMajorConfig.semester)) {
    const existingConfig = await MinorMajor.findOne({
      department: department || minorMajorConfig.department,
      subjectType: subjectType || minorMajorConfig.subjectType,
      semester: semester || minorMajorConfig.semester,
      _id: { $ne: id }
    });

    if (existingConfig) {
      throw new ApiError(400, `${subjectType || minorMajorConfig.subjectType} configuration already exists for ${department || minorMajorConfig.department} department in semester ${semester || minorMajorConfig.semester}`);
    }
  }

  // Update fields
  if (department) minorMajorConfig.department = department;
  if (subjectType) minorMajorConfig.subjectType = subjectType;
  if (semester) minorMajorConfig.semester = semester;
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
  const { semester } = req.query;

  const filter = {
    department,
    isActive: true
  };

  if (semester) {
    filter.semester = Number(semester);
  }

  const minorMajorConfigs = await MinorMajor.find(filter).sort({ subjectType: 1, prioritySlot: 1 });

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