import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['student', 'teacher', 'hod'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      trim: true,
      enum: ['9:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '1:30 PM - 2:45 PM', '2:45 PM - 4:00 PM'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['present', 'late', 'absent'],
      default: 'absent',
    },
    markedBy: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Marked by is required'],
      // Can be ObjectId (for HOD/Teacher) or String 'admin' (for admin)
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['BCA', 'BCom', 'BA'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate attendance entries (per date + slot)
attendanceSchema.index({ userId: 1, date: 1, timeSlot: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;


