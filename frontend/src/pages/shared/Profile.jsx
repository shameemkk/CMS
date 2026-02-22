import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { refreshUser } = useAuth();
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    role: '',
    status: '',
    createdAt: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.users.profile();
      setProfileData(response.user || {});
      
      // Load assigned subjects if user is a teacher or HOD
      if (response.user?.role === 'teacher' || response.user?.role === 'hod') {
        const subjectsResponse = await api.subjects.list();
        const mySubjects = (subjectsResponse.subjects || []).filter(
          (subject) => subject.assignedTeacher?._id === response.user.id || subject.assignedTeacher === response.user.id
        );
        setAssignedSubjects(mySubjects);
      }
      
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.users.updateProfile({
        fullName: profileData.fullName,
        phone: profileData.phone,
      });
      setProfileData(response.user || profileData);
      setIsEditMode(false);
      refreshUser();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    loadProfile();
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordMessage('');
    setPasswordError('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      await api.auth.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordMessage('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#6e0718] mb-2">My Profile</h1>
          <p className="text-gray-600">View and manage your personal information</p>
        </div>
        {!isEditMode && (
          <button
            onClick={() => setIsEditMode(true)}
            className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold flex items-center gap-2"
          >
            <span>✏️</span>
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Profile Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {!isEditMode ? (
          <div className="space-y-6">
            <div className="flex items-start gap-6 pb-6 border-b border-gray-200">
              <div className="w-32 h-32 rounded-full bg-[#6e0718] text-white flex items-center justify-center text-4xl font-bold">
                {(profileData.fullName || 'U').charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#6e0718] mb-2">{profileData.fullName}</h2>
                <p className="text-gray-600">{profileData.department}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-sm text-gray-600">📧 {profileData.email}</span>
                  <span className="text-sm text-gray-600">📱 {profileData.phone}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#6e0718] mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
                  <p className="text-gray-800 font-medium">{profileData.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                  <p className="text-gray-800">{profileData.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                  <p className="text-gray-800">{profileData.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Joined On</label>
                  <p className="text-gray-800">
                    {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Subjects Section - Only for Teachers and HODs */}
            {(profileData.role === 'teacher' || profileData.role === 'hod') && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-bold text-[#6e0718] mb-4">Assigned Subjects</h3>
                {assignedSubjects.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No subjects assigned yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {profileData.role === 'hod' 
                        ? 'You can assign subjects to yourself from the Subjects page' 
                        : 'Contact your HOD to get subjects assigned'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedSubjects.map((subject) => (
                      <div
                        key={subject._id}
                        className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#6e0718] transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-gray-800">{subject.name}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            subject.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {subject.status}
                          </span>
                        </div>
                        <p className="text-sm font-mono text-gray-600 mb-2">{subject.code}</p>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>📚 Semester: {subject.semester}</p>
                          <p>🎓 Credits: {subject.credits}</p>
                          <p>⏰ Hours/Week: {subject.hoursPerWeek}</p>
                          <p>📖 Type: {subject.subjectType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xl font-bold text-[#6e0718] mb-4">Change Password</h3>
              <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Current Password"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                />
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="New Password"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm Password"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="md:col-span-3 px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
              {passwordError && (
                <div className="mt-3 text-sm text-red-600">{passwordError}</div>
              )}
              {passwordMessage && (
                <div className="mt-3 text-sm text-green-600">{passwordMessage}</div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="flex items-start gap-6 pb-6 border-b border-gray-200">
              <div className="w-32 h-32 rounded-full bg-[#6e0718] text-white flex items-center justify-center text-4xl font-bold">
                {(profileData.fullName || 'U').charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#6e0718] mb-4">Edit Profile</h2>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#6e0718] mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName || ''}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone || ''}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={profileData.department || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;

