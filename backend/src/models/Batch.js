import mongoose from 'mongoose';

const formatDateForCode = (date) => {
  const parsedDate = new Date(date);
  return parsedDate.getUTCFullYear();
};

const batchSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      uppercase: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function(value) {
          return value > this.startDate;
        },
        message: 'End date must be greater than start date'
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
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Generate batch code before saving
batchSchema.pre('save', function (next) {
  if (!this.batchCode) {
    const startYear = formatDateForCode(this.startDate);
    const endYearShort = String(formatDateForCode(this.endDate)).slice(-2);
    this.batchCode = `${this.department}- ${startYear}-${endYearShort}`;
  }
  next();
});

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;
