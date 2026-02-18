import React from 'react';
import UsersByRole from '../shared/UsersByRole';

const HodStudents = () => (
  <UsersByRole
    role="student"
    title="Students"
    description="Manage and view all students in your department."
  />
);

export default HodStudents;
