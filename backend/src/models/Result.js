import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: [0, 'Marks cannot be negative'],
      max: [100, 'Marks cannot exceed 100'],
    },
    status: {
      type: String,
      enum: ['pass', 'fail'],
      required: [true, 'Status is required'],
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

// Compound index to prevent duplicate results
resultSchema.index({ studentId: 1, examId: 1, subject: 1 }, { unique: true });

const Result = mongoose.model('Result', resultSchema);

export default Result;


