# Exam View Feature

## Overview
Added a "View" button to the Scheduled Exams table that allows users to see detailed information about each exam in a modal popup.

## Features Added

### 1. View Button
- **Location**: Scheduled Exams table, Actions column
- **Icon**: Eye icon from lucide-react
- **Color**: Blue (#2563eb) with hover effects
- **Position**: First button in the actions row (View | Edit | Delete)

### 2. View Modal
The view modal displays comprehensive exam information in an organized layout:

#### Exam Information Section
- **Exam Name**: Full name of the exam
- **Semester**: Which semester the exam is for
- **Start Date**: Formatted as "Monday, January 15, 2024"
- **End Date**: Formatted as "Friday, January 19, 2024"

#### Exam Schedule Table
- **Subject**: Name of each subject
- **Date**: Formatted as "Mon, Jan 15, 2024"
- **Time**: Time slot (e.g., "09:00 AM - 12:00 PM")
- **Venue**: Room or hall information

#### Additional Information
- **Total Subjects**: Count of subjects in the exam
- **Department**: Department conducting the exam
- **Created**: When the exam was created
- **Status**: Dynamic status based on dates:
  - 🟡 **Upcoming**: Before start date
  - 🟢 **Ongoing**: Between start and end dates
  - ⚫ **Completed**: After end date

### 3. Modal Actions
- **Close**: Close the modal
- **Edit Exam**: Close view modal and open edit modal

## User Experience

### Visual Design
- Clean, professional layout with proper spacing
- Color-coded sections (gray for info, blue for additional details)
- Responsive design that works on all screen sizes
- Hover effects and smooth transitions

### Accessibility
- Proper semantic HTML structure
- Clear visual hierarchy
- Keyboard navigation support
- Screen reader friendly

### Data Handling
- Graceful handling of missing data ("Not specified")
- Proper date formatting for readability
- Safe rendering of arrays and objects

## Technical Implementation

### State Management
```javascript
const [showViewModal, setShowViewModal] = useState(false);
const [viewingExam, setViewingExam] = useState(null);
```

### Functions Added
```javascript
const handleView = (exam) => {
  setViewingExam(exam);
  setShowViewModal(true);
};

const handleCloseView = () => {
  setViewingExam(null);
  setShowViewModal(false);
};
```

### Modal Structure
- Fixed overlay with backdrop blur
- Centered modal with max width and height constraints
- Scrollable content for long exam schedules
- Sticky header with close button

## Usage

### For All Users (Students, Teachers, HODs, Admin):
1. Navigate to Exam Management section
2. Look at the "Scheduled Exams" table
3. Click the "👁 View" button for any exam
4. Review the detailed exam information
5. Optionally click "Edit Exam" to modify the exam
6. Click "Close" to return to the table

### Benefits
- **Quick Overview**: See all exam details without editing
- **Better Planning**: Clear schedule view helps with preparation
- **Status Awareness**: Know if exam is upcoming, ongoing, or completed
- **Easy Navigation**: Seamless transition from view to edit mode

## Files Modified
- `frontend/src/pages/shared/ExamManager.jsx`: Added view functionality and modal

## Dependencies
- `lucide-react`: For the Eye icon
- Existing React hooks and state management
- No additional packages required

The feature integrates seamlessly with the existing exam management system and provides a much better user experience for viewing exam details.