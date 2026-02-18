import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * @desc    Create Notification
 * @route   POST /api/notifications
 * @access  Private (HOD, Admin)
 */
export const createNotification = asyncHandler(async (req, res) => {
  const { title, description, media, targetRole, department } = req.body;

  if (!title || !description || !targetRole || !department) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, target role, and department are required',
    });
  }

  // Determine createdBy value - ObjectId for HOD, string 'admin' for admin
  const createdByValue = req.userRole === 'admin' ? 'admin' : req.userId;

  const notification = await Notification.create({
    title,
    description,
    media: media || null,
    targetRole,
    department,
    createdBy: createdByValue,
  });

  // Format createdBy in response
  const notificationObj = notification.toObject();
  if (notificationObj.createdBy === 'admin') {
    notificationObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(notificationObj.createdBy).select('fullName');
    notificationObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : notificationObj.createdBy;
  }

  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    notification: notificationObj,
  });
});

/**
 * @desc    Get All Notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { targetRole, department } = req.query;

  const query = {};

  // Build target role filter
  const targetRoleFilter = targetRole
    ? [{ targetRole }, { targetRole: 'all' }]
    : [{ targetRole: req.userRole }, { targetRole: 'all' }];

  // Build department filter
  let departmentFilter;
  if (department) {
    departmentFilter = [{ department }, { department: 'all' }];
  } else if (req.userRole !== 'admin') {
    departmentFilter = [{ department: req.userDepartment }, { department: 'all' }];
  } else {
    departmentFilter = [{ department: { $exists: true } }]; // Match all for admin
  }

  // Combine filters with $and
  query.$and = [
    { $or: targetRoleFilter },
    { $or: departmentFilter },
  ];

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 });

  // Manually populate createdBy only if it's an ObjectId (not 'admin')
  const notificationsWithCreatedBy = await Promise.all(
    notifications.map(async (record) => {
      const notificationObj = record.toObject();
      if (notificationObj.createdBy && notificationObj.createdBy !== 'admin') {
        const createdByUser = await User.findById(notificationObj.createdBy).select('fullName');
        notificationObj.createdBy = createdByUser
          ? { _id: createdByUser._id, fullName: createdByUser.fullName }
          : notificationObj.createdBy;
      } else if (notificationObj.createdBy === 'admin') {
        notificationObj.createdBy = { _id: 'admin', fullName: 'Admin' };
      }
      return notificationObj;
    })
  );

  res.status(200).json({
    success: true,
    count: notificationsWithCreatedBy.length,
    notifications: notificationsWithCreatedBy,
  });
});

/**
 * @desc    Get Single Notification
 * @route   GET /api/notifications/:id
 * @access  Private
 */
export const getNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findById(id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  // Format createdBy in response
  const notificationObj = notification.toObject();
  if (notificationObj.createdBy === 'admin') {
    notificationObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(notificationObj.createdBy).select('fullName');
    notificationObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : notificationObj.createdBy;
  }

  // Check permissions
  const isTargetRole = notificationObj.targetRole === req.userRole || notificationObj.targetRole === 'all';
  const isTargetDepartment = notificationObj.department === req.userDepartment || notificationObj.department === 'all';

  if (req.userRole !== 'admin' && (!isTargetRole || !isTargetDepartment)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  res.status(200).json({
    success: true,
    notification: notificationObj,
  });
});

/**
 * @desc    Update Notification
 * @route   PUT /api/notifications/:id
 * @access  Private (HOD, Admin)
 */
export const updateNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, media, targetRole, department } = req.body;

  const notification = await Notification.findById(id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  // Check permissions
  if (req.userRole !== 'admin' && notification.department !== req.userDepartment) {
    return res.status(403).json({
      success: false,
      message: 'You can only update notifications for your department',
    });
  }

  const updateData = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (media !== undefined) updateData.media = media;
  if (targetRole) updateData.targetRole = targetRole;
  if (department) updateData.department = department;

  const updatedNotification = await Notification.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  // Format createdBy in response
  const notificationObj = updatedNotification.toObject();
  if (notificationObj.createdBy === 'admin') {
    notificationObj.createdBy = { _id: 'admin', fullName: 'Admin' };
  } else {
    const createdByUser = await User.findById(notificationObj.createdBy).select('fullName');
    notificationObj.createdBy = createdByUser
      ? { _id: createdByUser._id, fullName: createdByUser.fullName }
      : notificationObj.createdBy;
  }

  res.status(200).json({
    success: true,
    message: 'Notification updated successfully',
    notification: notificationObj,
  });
});

/**
 * @desc    Delete Notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (HOD, Admin)
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findById(id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  // Check permissions
  if (req.userRole !== 'admin' && notification.department !== req.userDepartment) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete notifications for your department',
    });
  }

  await Notification.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

