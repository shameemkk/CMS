import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    prefix: {
      type: String,
      required: [true, 'Prefix is required'],
      trim: true,
      uppercase: true,
    },
    letter: {
      type: String,
      required: [true, 'Letter is required'],
      trim: true,
      uppercase: true,
      maxlength: 1,
    },
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
    },
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    startYear: {
      type: Number,
      required: [true, 'Start year is required'],
      min: 2000,
      max: 2100,
    },
    endYear: {
      type: Number,
      required: [true, 'End year is required'],
      min: 2000,
      max: 2100,
      validate: {
        validator: function(value) {
          return value > this.startYear;
        },
        message: 'End year must be greater than start year'
      }
    },
    batchCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
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

// Generate batch code before saving
batchSchema.pre('save', function (next) {
  if (!this.batchCode) {
    this.batchCode = `${this.prefix}${this.letter}_${this.courseCode} (${this.startYear}-${this.endYear})`;
  }
  next();
});

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;
