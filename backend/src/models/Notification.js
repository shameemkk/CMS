import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    media: {
      type: String,
      trim: true,
      default: null,
    },
    targetRole: {
      type: String,
      required: [true, 'Target role is required'],
      enum: ['student', 'teacher', 'hod', 'all'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['BCA', 'BCom', 'BA', 'all'],
    },
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Created by is required'],
      // Can be ObjectId (for HOD) or String 'admin' (for admin)
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;


