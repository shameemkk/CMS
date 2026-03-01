# Minor/Major Configuration Management

## Overview
Created a new MinorMajor model and management system to configure department-specific priority slots for minor and major subjects. This is an admin-only CRUD feature that allows fine-grained control over timetable generation.

## Features

### 1. MinorMajor Model
- **Department**: Which department the configuration applies to
- **Subject Type**: Either 'minor' or 'major'
- **Priority Slot**: Time slot number (1-5) where these subjects should be scheduled
- **Description**: Optional description of the configuration
- **Active Status**: Enable/disable configurations
- **Audit Trail**: Created by and last modified by tracking

### 2. Database Schema
```javascript
{
  department: String (required),
  subjectType: 'minor' | 'major' (required),
  prioritySlot: Number (1-5, required),
  isActive: Boolean (default: true),
  description: String (optional),
  createdBy: ObjectId/String (required),
  lastModifiedBy: ObjectId/String (optional),
  timestamps: true
}
```

### 3. Unique Constraints
- One configuration per department + subjectType combination
- Prevents duplicate configurations for the same department and subject type

## API Endpoints (Admin Only)

### CRUD Operations
- `GET /api/minor-major` - List all configurations with optional filters
- `POST /api/minor-major` - Create new configuration
- `GET /api/minor-major/:id` - Get specific configuration
- `PUT /api/minor-major/:id` - Update configuration
- `DELETE /api/minor-major/:id` - Delete configuration

### Special Operations
- `GET /api/minor-major/department/:department` - Get configs by department
- `PATCH /api/minor-major/:id/toggle` - Toggle active status

### Query Parameters
- `department` - Filter by department
- `subjectType` - Filter by minor/major
- `isActive` - Filter by active status

## Frontend Management Interface

### 1. Admin Dashboard Integration
- Added "Minor/Major Config" menu item in Admin dashboard
- Accessible only to admin users
- Clean, professional interface with table view

### 2. Features
- **Create/Edit Modal**: Form to add or modify configurations
- **Data Table**: View all configurations with sorting and filtering
- **Status Toggle**: Quick activate/deactivate functionality
- **Delete Confirmation**: Safe deletion with confirmation dialog
- **Real-time Updates**: Immediate UI updates after operations

### 3. Visual Elements
- **Color-coded Subject Types**: Blue for minor, purple for major
- **Status Indicators**: Green for active, red for inactive
- **Time Slot Labels**: Human-readable slot descriptions
- **Action Icons**: Edit, delete, and toggle status icons

## Time Slot Mapping
```
Slot 1: 1st Period (09:30-10:30)
Slot 2: 2nd Period (10:30-11:20)
Slot 3: 3rd Period (11:30-12:30)
Slot 4: 4th Period (13:30-14:30)
Slot 5: 5th Period (14:30-15:30)
```

## Sample Configurations
The seeder creates these default configurations:

### BCA Department
- **Minor Subjects**: Priority Slot 2 (10:30-11:20)
- **Major Subjects**: Priority Slot 2 (10:30-11:20)

### BCOM Department
- **Minor Subjects**: Priority Slot 3 (11:30-12:30)
- **Major Subjects**: Priority Slot 3 (11:30-12:30)

## Usage in Timetable Generation

### Integration Points
1. **Timetable Controller**: Can query MinorMajor configs during generation
2. **Subject Scheduling**: Use priority slots to place minor/major subjects
3. **Conflict Resolution**: Respect department-specific slot preferences
4. **Validation**: Ensure configurations are active before use

### Example Usage
```javascript
// Get department's minor/major configurations
const configs = await MinorMajor.find({
  department: 'BCA',
  isActive: true
});

// Use priority slots during timetable generation
const minorSlot = configs.find(c => c.subjectType === 'minor')?.prioritySlot;
const majorSlot = configs.find(c => c.subjectType === 'major')?.prioritySlot;
```

## Security & Access Control

### Admin-Only Access
- All routes protected with `authorizeRoles('admin')`
- Frontend component only accessible in Admin dashboard
- No HOD or teacher access to these configurations

### Validation
- Department must exist in the system
- Subject type must be 'minor' or 'major'
- Priority slot must be between 1 and 5
- Unique constraint prevents duplicates

## Error Handling

### Backend Validation
- Required field validation
- Enum validation for subject types
- Range validation for priority slots
- Duplicate prevention with clear error messages

### Frontend UX
- Form validation before submission
- Loading states during operations
- Success/error toast notifications
- Confirmation dialogs for destructive actions

## Benefits

1. **Flexibility**: Each department can have different minor/major scheduling preferences
2. **Consistency**: Ensures minor/major subjects are always scheduled in preferred slots
3. **Maintainability**: Easy to modify configurations without code changes
4. **Audit Trail**: Track who created and modified configurations
5. **Performance**: Indexed queries for efficient lookups during timetable generation

## Testing

### How to Test
1. Login as admin: `admin` / `admin123`
2. Navigate to Admin Dashboard → Minor/Major Config
3. View existing configurations created by seeder
4. Create new configurations for different departments
5. Edit existing configurations
6. Toggle active/inactive status
7. Delete configurations (with confirmation)

### Test Scenarios
- Create configuration for new department
- Try to create duplicate (should fail)
- Edit priority slots and descriptions
- Toggle status and verify changes
- Delete configuration and verify removal
- Test form validation with invalid data

The MinorMajor configuration system provides a robust foundation for managing department-specific timetable preferences while maintaining data integrity and security.