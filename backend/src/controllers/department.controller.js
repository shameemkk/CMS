import Department from '../models/Department.js';
import { asyncHandler } from '../utils/errorHandler.js';

export const createDepartment = asyncHandler(async (req, res) => {
    const { name, code, description, status } = req.body;

    if (!['admin'].includes(req.userRole)) {
        return res.status(403).json({
            success: false,
            message: 'Only Admin can create departments',
        });
    }

    const existingDepartment = await Department.findOne({
        $or: [{ name: new RegExp(`^${name}$`, 'i') }, { code: new RegExp(`^${code}$`, 'i') }]
    });

    if (existingDepartment) {
        return res.status(400).json({
            success: false,
            message: 'Department with this name or code already exists',
        });
    }

    const department = await Department.create({
        name,
        code,
        description,
        status,
        createdBy: req.userId
    });

    res.status(201).json({
        success: true,
        data: department
    });
});

export const getDepartments = asyncHandler(async (req, res) => {
    const query = {};

    // Optional active only filter
    if (req.query.status) {
        query.status = req.query.status;
    }

    const departments = await Department.find(query).sort({ name: 1 });

    res.status(200).json({
        success: true,
        results: departments.length,
        data: departments
    });
});

export const getDepartment = asyncHandler(async (req, res) => {
    const department = await Department.findById(req.params.id);

    if (!department) {
        return res.status(404).json({
            success: false,
            message: 'Department not found'
        });
    }

    res.status(200).json({
        success: true,
        data: department
    });
});

export const updateDepartment = asyncHandler(async (req, res) => {
    const { name, code, description, status } = req.body;

    if (!['admin'].includes(req.userRole)) {
        return res.status(403).json({
            success: false,
            message: 'Only Admin can update departments',
        });
    }

    const department = await Department.findById(req.params.id);

    if (!department) {
        return res.status(404).json({
            success: false,
            message: 'Department not found'
        });
    }

    // Check if updating name/code to existing ones
    if (name || code) {
        const existing = await Department.findOne({
            _id: { $ne: req.params.id },
            $or: [
                name ? { name: new RegExp(`^${name}$`, 'i') } : null,
                code ? { code: new RegExp(`^${code}$`, 'i') } : null
            ].filter(Boolean)
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Department with this name or code already exists'
            });
        }
    }

    if (name) department.name = name;
    if (code) department.code = code;
    if (description !== undefined) department.description = description;
    if (status) department.status = status;

    await department.save();

    res.status(200).json({
        success: true,
        data: department
    });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
    if (!['admin'].includes(req.userRole)) {
        return res.status(403).json({
            success: false,
            message: 'Only Admin can delete departments',
        });
    }

    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
        return res.status(404).json({
            success: false,
            message: 'Department not found'
        });
    }

    res.status(204).json({
        success: true,
        data: null
    });
});
