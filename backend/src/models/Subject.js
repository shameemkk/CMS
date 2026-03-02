import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      min: 1,
      max: 10,
    },
    hoursPerWeek: {
      type: Number,
      required: [true, 'Hours per week is required'],
      min: 1,
      max: 10,
    },
    subjectType: {
      type: String,
      enum: ['theory', 'practical', 'lab', 'minor1', 'minor2', 'major'],
      default: 'theory',
    },
    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate subjects per department and semester
subjectSchema.index({ code: 1, department: 1 }, { unique: true });

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;