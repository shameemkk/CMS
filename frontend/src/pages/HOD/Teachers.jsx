import React from 'react';
import UsersByRole from '../shared/UsersByRole';

const HodTeachers = () => (
  <UsersByRole
    role="teacher"
    title="Teachers"
    description="Manage and view all teachers in your department."
  />
);

export default HodTeachers;
