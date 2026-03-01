import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const formatTime = (timeValue) => {
  if (!timeValue || typeof timeValue !== 'string') return '';
  const match = timeValue.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return timeValue;
  const hours = parseInt(match[1], 10);
  const minutes = match[2];
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${minutes} ${suffix}`;
};

const formatSubjectTimeRange = (subject) => {
  if (subject?.startTime && subject?.endTime) {
    return `${formatTime(subject.startTime)} - ${formatTime(subject.endTime)}`;
  }
  return subject?.time || 'Not specified';
};

const Dashboard = () => {
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  const parseResponseData = async (response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  };

  const teacherName = user?.fullName || 'Teacher';
  const teacherDepartment = user?.department || '-';

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const TIME_SLOTS = [
    '09:30-10:30',
    '10:30-11:20',
    '11:30-12:30',
    '13:30-14:30',
    '14:30-15:30',
  ];

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const statsResponse = await api.dashboard.stats();
        setStats(statsResponse.stats || {});

        const notificationsResponse = await api.notifications.list();
        setRecentActivities(
          (notificationsResponse.notifications || []).slice(0, 4).map((item) => ({
            id: item._id,
            activity: item.title,
            time: new Date(item.createdAt || Date.now()).toLocaleDateString(),
          }))
        );

        const examsResponse = await api.exams.list();
        const examSubjects = (examsResponse.exams || [])
          .flatMap((exam) =>
            (exam.subjects || []).map((subject) => ({
              id: `${exam._id}-${subject.subjectName}`,
              subject: subject.subjectName,
              date: subject.date,
              time: formatSubjectTimeRange(subject),
              examName: exam.examName,
            }))
          )
          .filter((exam) => exam.date)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);
        setUpcomingExams(examSubjects);

        // Load assigned subjects
        const subjectsResponse = await api.subjects.list();
        const mySubjects = (subjectsResponse.subjects || []).filter(
          (subject) => subject.assignedTeacher?._id === user?.id || subject.assignedTeacher === user?.id
        );
        setAssignedSubjects(mySubjects);

        // Load teacher timetable
        loadTeacherTimetable();
      } catch (err) {
        setStats(null);
        setRecentActivities([]);
        setUpcomingExams([]);
        setAssignedSubjects([]);
      }
    };

    loadDashboard();
  }, [user?.id]);

  const loadTeacherTimetable = async () => {
    try {
      setLoadingTimetable(true);
      const response = await fetch(`${API_BASE_URL}/api/timetable/teacher/my-schedule`, {
        headers: {
          'Authorization': `Bearer ${api.token.get()}`
        }
      });
      
      if (response.ok) {
        const data = await parseResponseData(response);
        setTimetable(data.data || []);
      }
    } catch (err) {
      setTimetable([]);
    } finally {
      setLoadingTimetable(false);
    }
  };

  const getTodaySchedule = () => {
    const today = DAYS[new Date().getDay() - 1]; // Monday = 0, Sunday returns undefined
    if (!today || timetable.length === 0) return [];

    const todaySlots = [];
    timetable.forEach(schedule => {
      schedule.timeSlots.forEach(slot => {
        if (slot.day === today) {
          todaySlots.push({
            ...slot,
            department: schedule.department,
            semester: schedule.semester
          });
        }
      });
    });

    return todaySlots.sort((a, b) => {
      const aTime = a.startTime.replace(':', '');
      const bTime = b.startTime.replace(':', '');
      return aTime - bTime;
    });
  };

  const convertTo12Hour = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const dashboardStats = [
    { title: 'Students', value: stats?.students ?? 0, icon: '👨‍🎓', color: 'bg-green-500', link: 'students' },
    { title: 'Exams', value: stats?.exams ?? 0, icon: '📝', color: 'bg-yellow-500', link: 'exam' },
    { title: 'Assignments', value: stats?.assignments ?? 0, icon: '📚', color: 'bg-blue-500', link: 'assignments' },
    { title: 'Notifications', value: stats?.notifications ?? 0, icon: '🔔', color: 'bg-purple-500', link: 'notifications' },
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
        <p className="text-gray-600">Welcome back, {teacherName}! Here's your teaching overview.</p>
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

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">Today's Schedule</h2>
        {loadingTimetable ? (
          <div className="text-center py-8 text-gray-500">Loading schedule...</div>
        ) : getTodaySchedule().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No classes scheduled for today</p>
            <p className="text-sm mt-2">Enjoy your day!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {getTodaySchedule().map((slot, index) => (
              <div
                key={index}
                className={`border-l-4 p-4 rounded-lg ${
                  slot.subjectType === 'lab' ? 'border-blue-500 bg-blue-50' :
                  slot.subjectType === 'practical' ? 'border-green-500 bg-green-50' :
                  'border-purple-500 bg-purple-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{slot.subject?.name}</h3>
                  <span className="text-xs px-2 py-1 bg-white rounded-full font-medium text-gray-700">
                    {slot.department} - Sem {slot.semester}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>🕐 {convertTo12Hour(slot.startTime)} - {convertTo12Hour(slot.endTime)}</span>
                  <span className="capitalize">📖 {slot.subjectType}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts and Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No recent activities</div>
            ) : (
              recentActivities.map((activity) => (
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
              ))
            )}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">Upcoming Exams</h2>
          <div className="space-y-4">
            {upcomingExams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No upcoming exams</div>
            ) : (
              upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="border-l-4 border-[#6e0718] p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{exam.subject}</h3>
                    <span className="text-sm text-gray-600">{exam.examName || 'Exam'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                    <span>📅 {exam.date}</span>
                    <span>🕐 {exam.time}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>📚 {teacherDepartment}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assigned Subjects */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">My Assigned Subjects</h2>
        {assignedSubjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No subjects assigned yet</p>
            <p className="text-sm mt-2">Contact your HOD to get subjects assigned</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedSubjects.map((subject) => (
              <div
                key={subject._id}
                className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-[#6e0718] transition-all duration-200"
              >
                {/* Subject Header - Always Visible */}
                <div
                  onClick={() => setExpandedSubject(expandedSubject === subject._id ? null : subject._id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-[#6e0718] rounded-lg flex items-center justify-center text-white font-bold">
                      {subject.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{subject.name}</h3>
                      <p className="text-sm font-mono text-gray-600">{subject.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      subject.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {subject.status}
                    </span>
                    <span className="text-gray-400 text-xl">
                      {expandedSubject === subject._id ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {/* Subject Details - Expandable */}
                {expandedSubject === subject._id && (
                  <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Semester</p>
                        <p className="text-sm font-semibold text-gray-800">📚 Semester {subject.semester}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Credits</p>
                        <p className="text-sm font-semibold text-gray-800">🎓 {subject.credits} Credits</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Hours/Week</p>
                        <p className="text-sm font-semibold text-gray-800">⏰ {subject.hoursPerWeek} Hours</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <p className="text-sm font-semibold text-gray-800 capitalize">📖 {subject.subjectType}</p>
                      </div>
                    </div>
                    {subject.description && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Description</p>
                        <p className="text-sm text-gray-700">{subject.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teaching Summary */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">Teaching Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Department</h3>
            <p className="text-lg font-bold text-[#6e0718]">{teacherDepartment}</p>
            <p className="text-sm text-gray-600 mt-2">Students: {stats?.students ?? 0}</p>
            <p className="text-sm text-gray-600">Assignments: {stats?.assignments ?? 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Assigned Subjects</h3>
            <p className="text-3xl font-bold text-[#6e0718]">{assignedSubjects.length}</p>
            <p className="text-sm text-gray-600 mt-2">Currently teaching</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">My Leave Requests</h3>
            <p className="text-3xl font-bold text-[#6e0718]">{stats?.myLeaveRequests ?? 0}</p>
            <p className="text-sm text-gray-600 mt-2">Submitted by you</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

