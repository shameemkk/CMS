import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const studentName = user?.fullName || 'Student';
  const studentDepartment = user?.department || '-';

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const statsResponse = await api.dashboard.stats();
        setStats(statsResponse.stats || {});

        const examsResponse = await api.exams.list();
        const examSubjects = (examsResponse.exams || [])
          .flatMap((exam) =>
            (exam.subjects || []).map((subject) => ({
              id: `${exam._id}-${subject.subjectName}`,
              subject: subject.subjectName,
              date: subject.date,
              time: subject.time,
              venue: subject.venue || 'TBA',
              examName: exam.examName,
            }))
          )
          .filter((exam) => exam.date)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);
        setUpcomingExams(examSubjects);

        const notificationsResponse = await api.notifications.list();
        const activities = (notificationsResponse.notifications || []).slice(0, 4).map((item) => ({
          id: item._id,
          activity: item.title,
          time: new Date(item.createdAt || Date.now()).toLocaleDateString(),
          type: 'notification',
        }));
        setRecentActivities(activities);
      } catch (err) {
        setStats(null);
        setUpcomingExams([]);
        setRecentActivities([]);
      }
    };

    loadDashboard();
  }, []);

  const dashboardStats = [
    { title: 'Exams', value: stats?.exams ?? '0', icon: '📝', color: 'bg-yellow-500', link: 'exam' },
    { title: 'Assignments', value: stats?.assignments ?? '0', icon: '📚', color: 'bg-blue-500', link: 'assignments' },
    { title: 'Notifications', value: stats?.notifications ?? '0', icon: '🔔', color: 'bg-purple-500', link: 'notifications' },
    { title: 'Attendance', value: `${stats?.attendance?.percentage ?? 0}%`, icon: '✅', color: 'bg-green-500', link: 'attendance' },
  ];

  const handleStatClick = (link) => {
    // Navigate to the respective page using the sidebar menu
    console.log(`Navigate to ${link} - Use sidebar menu to navigate`);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back, {studentName}! Here's your academic overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <div
            key={index}
            onClick={() => handleStatClick(stat.link)}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-[#6e0718]">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-2">Click to view details →</p>
          </div>
        ))}
      </div>

      {/* Charts and Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-[#6e0718] mt-2"></div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{activity.activity}</p>
                  <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">Upcoming Exams</h2>
          <div className="space-y-4">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="border-l-4 border-[#6e0718] p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{exam.subject}</h3>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                    {exam.examName || 'Exam'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                  <span>📅 {exam.date}</span>
                  <span>🕐 {exam.time}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span>📍 {exam.venue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Academic Summary */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">Academic Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">Student Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-800">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Department:</span>
                <span className="font-medium text-gray-800">{studentDepartment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium text-gray-800">{user?.role || '-'}</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">Performance Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Attendance:</span>
                <span className="font-medium text-green-600">{stats?.attendance?.percentage ?? 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Assignments:</span>
                <span className="font-medium text-gray-800">{stats?.assignments ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Upcoming Exams:</span>
                <span className="font-medium text-yellow-600">{upcomingExams.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

