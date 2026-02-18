import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['BCA', 'BCom', 'BA', 'all'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    questions: {
      type: String,
      required: [true, 'Questions are required'],
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: [0, 'Marks cannot be negative'],
    },
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Created by is required'],
      // Can be ObjectId (for Teacher/HOD) or String 'admin' (for admin)
    },
  },
  {
    timestamps: true,
  }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;


