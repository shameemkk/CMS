import mongoose from 'mongoose';

const minorMajorSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    subjectType: {
      type: String,
      enum: ['minor1', 'minor2', 'major'],
      required: [true, 'Subject type is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
      validate: {
        validator: function (value) {
          return Number.isInteger(value);
        },
        message: 'Semester must be an integer between 1 and 8'
      }
    },
    prioritySlot: {
      type: Number,
      required: [true, 'Priority slot is required'],
      min: 1,
      max: 5, // Assuming 5 time slots per day
      validate: {
        validator: function (value) {
          return Number.isInteger(value);
        },
        message: 'Priority slot must be an integer between 1 and 5'
      }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique department + subjectType + semester combination
minorMajorSchema.index({ department: 1, subjectType: 1, semester: 1 }, { unique: true });

// Index for efficient queries
minorMajorSchema.index({ department: 1, semester: 1, isActive: 1 });
minorMajorSchema.index({ prioritySlot: 1 });

const MinorMajor = mongoose.model('MinorMajor', minorMajorSchema);

export default MinorMajor;