import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Exam from './Exam';
import Timetable from './Timetable';
import Teachers from './Teachers';
import Attendance from './Attendance';
import Assignments from './Assignments';
import Notifications from './Notifications';
import LeaveRequests from './LeaveRequests';

const Student = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const username = user?.fullName || 'Student';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'timetable', label: 'Time Table', icon: '📅' },
    { id: 'exam', label: 'Exam', icon: '📝' },
    { id: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
    { id: 'attendance', label: 'Attendance', icon: '✅' },
    { id: 'assignments', label: 'Assignments', icon: '📚' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'leave-requests', label: 'Leave Requests', icon: '📝' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderPage = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <Profile />;
      case 'timetable':
        return <Timetable />;
      case 'exam':
        return <Exam />;
      case 'teachers':
        return <Teachers />;
      case 'attendance':
        return <Attendance />;
      case 'assignments':
        return <Assignments />;
      case 'notifications':
        return <Notifications />;
      case 'leave-requests':
        return <LeaveRequests />;
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
              <h2 className="text-xl font-bold text-[#6e0718]">Student Dashboard</h2>
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
                  {username.charAt(0)}
                </div>
                <span className="text-gray-700 font-medium">{username}</span>
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

export default Student;
