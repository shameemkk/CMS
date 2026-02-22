import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [hoursBySemester, setHoursBySemester] = useState({});
  const [teacherLeaveRequests, setTeacherLeaveRequests] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  const hodDepartment = user?.department || '-';

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
              time: subject.time,
              examName: exam.examName,
            }))
          )
          .filter((exam) => exam.date)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);
        setUpcomingExams(examSubjects);

        // Load assigned subjects for HOD
        const subjectsResponse = await api.subjects.list();
        const mySubjects = (subjectsResponse.subjects || []).filter(
          (subject) => subject.assignedTeacher?._id === user?.id || subject.assignedTeacher === user?.id
        );
        setAssignedSubjects(mySubjects);
        
        // Calculate hours per week by semester
        const hoursBySemester = {};
        (subjectsResponse.subjects || []).forEach(subject => {
          if (subject.status === 'active') {
            if (!hoursBySemester[subject.semester]) {
              hoursBySemester[subject.semester] = 0;
            }
            hoursBySemester[subject.semester] += subject.hoursPerWeek || 0;
          }
        });
        setHoursBySemester(hoursBySemester);

        // Load teacher leave requests
        loadTeacherLeaveRequests();
      } catch (err) {
        setStats(null);
        setRecentActivities([]);
        setUpcomingExams([]);
        setAssignedSubjects([]);
        setHoursBySemester({});
      }
    };

    loadDashboard();
  }, [user?.id]);

  const loadTeacherLeaveRequests = async () => {
    try {
      setLoadingLeaves(true);
      const response = await api.leaveRequests.list();
      // Backend already filters for teacher requests in HOD's department
      const teacherRequests = (response.leaveRequests || []).slice(0, 5); // Show only the 5 most recent
      setTeacherLeaveRequests(teacherRequests);
    } catch (err) {
      setTeacherLeaveRequests([]);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const handleLeaveStatus = async (id, status) => {
    try {
      await api.leaveRequests.updateStatus(id, { status });
      loadTeacherLeaveRequests();
      // Reload stats to update pending count
      const statsResponse = await api.dashboard.stats();
      setStats(statsResponse.stats || {});
    } catch (err) {
      console.error('Failed to update leave request:', err);
    }
  };

  const dashboardStats = [
    { title: 'Total Students', value: stats?.students ?? 0, icon: '👨‍🎓', color: 'bg-blue-500', link: 'students' },
    { title: 'Total Teachers', value: stats?.teachers ?? 0, icon: '👨‍🏫', color: 'bg-green-500', link: 'teachers' },
    { title: 'Active Exams', value: stats?.exams ?? 0, icon: '📝', color: 'bg-yellow-500', link: 'exam' },
    { title: 'Assignments', value: stats?.assignments ?? 0, icon: '📚', color: 'bg-purple-500', link: 'assignments' },
  ];

  const handleStatClick = (link) => {
    // Navigate to the respective page using the sidebar menu
    // The parent component (Hod.jsx) handles navigation via activeMenu state
    // Users can click on the sidebar menu items to navigate
    console.log(`Navigate to ${link} - Use sidebar menu to navigate`);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening in your {hodDepartment} department.</p>
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
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>📅 {exam.date}</span>
                    <span>🕐 {exam.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Teacher Leave Requests */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">Teacher Leave Requests</h2>
        {loadingLeaves ? (
          <div className="text-center py-8 text-gray-500">Loading leave requests...</div>
        ) : teacherLeaveRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No pending teacher leave requests</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Teacher</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Start Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">End Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Days</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reason</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teacherLeaveRequests.map((request) => {
                  const startDate = request.startDate ? new Date(request.startDate) : null;
                  const endDate = request.endDate ? new Date(request.endDate) : null;
                  const days = startDate && endDate 
                    ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 
                    : '-';
                  
                  return (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {request.requestedBy?.fullName || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {startDate ? startDate.toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {endDate ? endDate.toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {days} {days === 1 ? 'day' : 'days'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={request.reason}>
                        {request.reason}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {request.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLeaveStatus(request._id, 'approved')}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleLeaveStatus(request._id, 'rejected')}
                              className="text-red-500 hover:text-red-700 font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assigned Subjects - HOD can also teach */}
      {assignedSubjects.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">My Assigned Subjects</h2>
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
        </div>
      )}

      {/* Hours Per Week by Semester */}
      {Object.keys(hoursBySemester).length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#6e0718]">Total Hours Per Week by Semester</h2>
            <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <span className="font-semibold">Available:</span> 25 periods/week (5 days × 5 periods)
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
              const used = hoursBySemester[sem] || 0;
              const available = 25;
              const percentage = (used / available) * 100;
              const isOverloaded = used > available;
              
              return (
                <div key={sem} className={`text-center p-4 rounded-lg border-2 ${
                  isOverloaded 
                    ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300' 
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                }`}>
                  <p className="text-xs text-gray-600 mb-1">Semester {sem}</p>
                  <p className={`text-2xl font-bold ${isOverloaded ? 'text-red-700' : 'text-[#6e0718]'}`}>
                    {used}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">/ {available} hrs</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${isOverloaded ? 'bg-red-600' : 'bg-blue-600'}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  {isOverloaded && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold">Overloaded!</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-gray-500 text-center">
            Note: Each semester has 25 available periods per week (Monday-Friday, 5 periods/day)
          </div>
        </div>
      )}

      {/* Department Summary */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">{hodDepartment} Department Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-[#6e0718] mb-1">{stats?.students ?? 0}</p>
            <p className="text-sm text-gray-600 mb-2">Students</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-[#6e0718] mb-1">{stats?.teachers ?? 0}</p>
            <p className="text-sm text-gray-600 mb-2">Teachers</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-[#6e0718] mb-1">{assignedSubjects.length}</p>
            <p className="text-sm text-gray-600 mb-2">My Subjects</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-[#6e0718] mb-1">{stats?.pendingLeaveRequests ?? 0}</p>
            <p className="text-sm text-gray-600 mb-2">Pending Leaves</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

