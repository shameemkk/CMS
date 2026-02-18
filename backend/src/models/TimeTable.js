import mongoose from 'mongoose';

const timeTableSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['BCA', 'BCom', 'BA', 'all'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['teacher', 'hod'],
    },
    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      trim: true,
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

const TimeTable = mongoose.model('TimeTable', timeTableSchema);

export default TimeTable;


