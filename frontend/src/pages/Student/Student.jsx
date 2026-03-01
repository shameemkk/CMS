import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  NotebookPen,
  SquarePen,
  UserCircle2,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Exam from './Exam';
import Timetable from './Timetable';
import Teachers from './Teachers';
import Attendance from './Attendance';
import Assignments from './Assignments';
import Notifications from './Notifications';

const Student = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const username = user?.fullName || 'Student';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: UserCircle2 },
    { id: 'timetable', label: 'Time Table', icon: CalendarCheck },
    { id: 'exam', label: 'Exam', icon: NotebookPen },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: SquarePen },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'notifications', label: 'Notifications', icon: Bell },
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
      default:
        return (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-4xl mb-4">
              {(() => {
                const Icon = menuItems.find((item) => item.id === activeMenu)?.icon;
                return Icon ? <Icon className="w-10 h-10 mx-auto text-[#6e0718]" /> : null;
              })()}
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
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeMenu === item.id
                      ? 'bg-[#6e0718] text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
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
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default Student;
