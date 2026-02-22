import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
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
    examName: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
    },
    subjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        subjectName: {
          type: String,
          required: true,
          trim: true,
        },
        date: {
          type: Date,
          required: true,
        },
        time: {
          type: String,
          required: true,
          trim: true,
        },
        venue: {
          type: String,
          trim: true,
        },
      },
    ],
    examSchedule: {
      startDate: {
        type: Date,
        required: [true, 'Start date is required'],
      },
      endDate: {
        type: Date,
        required: [true, 'End date is required'],
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      // Can be ObjectId (for Teacher/HOD) or String 'admin' (for admin)
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model('Exam', examSchema);

export default Exam;


