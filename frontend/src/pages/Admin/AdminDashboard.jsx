import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Subjects from '../shared/Subjects';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('approvals');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const menuItems = [
    { id: 'approvals', label: 'User Approvals', icon: '✅' },
    { id: 'subjects', label: 'Subjects', icon: '📖' },
  ];

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await api.users.pending();
      setPendingUsers(response.users || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'approvals') {
      loadPendingUsers();
    }
  }, [activeMenu]);

  const handleStatus = async (id, status) => {
    try {
      setLoading(true);
      await api.users.updateStatus(id, status);
      await loadPendingUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const renderApprovalsPage = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Pending User Approvals</h1>
        <p className="text-gray-600">Approve or reject new user registrations.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Loading pending users...' : 'No pending users.'}
                  </td>
                </tr>
              ) : (
                pendingUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{userItem.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{userItem.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{userItem.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{userItem.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{userItem.role}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatus(userItem.id, 'approved')}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatus(userItem.id, 'rejected')}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (activeMenu) {
      case 'approvals':
        return renderApprovalsPage();
      case 'subjects':
        return <Subjects />;
      default:
        return (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-6xl mb-4">
              {menuItems.find((item) => item.id === activeMenu)?.icon}
            </div>
            <h2 className="text-2xl font-bold text-[#6e0718] mb-2">
              {menuItems.find((item) => item.id === activeMenu)?.label}
            </h2>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 ease-in-out fixed h-screen overflow-y-auto`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <h2 className="text-xl font-bold text-[#6e0718]">Admin Dashboard</h2>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl">{sidebarOpen ? '◀' : '▶'}</span>
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeMenu === item.id
                    ? 'bg-[#6e0718] text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Header */}
        <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img
                src="/newlogo.webp"
                alt="Safa College Logo"
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#6e0718] text-white flex items-center justify-center font-semibold">
                  {(user?.fullName || 'A').charAt(0)}
                </div>
                <span className="text-gray-700 font-medium">{user?.fullName || 'Admin'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-[#6e0718] text-white px-4 py-2 rounded-lg hover:bg-[#8a0a1f] transition-colors duration-200 font-semibold flex items-center gap-2"
              >
                <span>Logout</span>
                <span>🚪</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
