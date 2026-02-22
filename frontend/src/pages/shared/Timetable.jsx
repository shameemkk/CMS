import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, User, MapPin, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Timetable = () => {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [semesterFilter, setSemesterFilter] = useState('odd'); // 'odd', 'even'
  const { user } = useAuth();

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const TIME_SLOTS = [
    '09:30-10:30',  // 1st period
    '10:30-11:20',  // 2nd period
    '11:30-12:30',  // 3rd period (after break)
    '13:30-14:30',  // 4th period (after lunch)
    '14:30-15:30',  // 5th period
  ];

  // Convert 24-hour time to 12-hour AM/PM format
  const convertTo12Hour = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatTimeSlot = (timeSlot) => {
    const [start, end] = timeSlot.split('-');
    return `${convertTo12Hour(start)} - ${convertTo12Hour(end)}`;
  };

  // Initialize selected semester based on user's semester
  useEffect(() => {
    if (user?.role === 'student' && user?.semester && selectedSemester === null) {
      setSelectedSemester(user.semester);
    } else if (user?.role === 'student' && selectedSemester === null) {
      setSelectedSemester(1);
    }
  }, [user, selectedSemester]);

  useEffect(() => {
    if (user?.role === 'teacher' || user?.role === 'hod') {
      fetchTeacherTimetable();
    } else if (user?.role === 'student' && user?.department) {
      if (selectedSemester === null) return; // Wait for semester to be initialized for students
      fetchStudentTimetable(user.department, selectedSemester);
    }
  }, [selectedSemester, user]);

  const fetchStudentTimetable = async (department, semester) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/timetable/${department}/${semester}`, {
        headers: {
          'Authorization': `Bearer ${api.token.get()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimetable(data.data);
      } else if (response.status === 404) {
        setTimetable(null);
        toast.error('No timetable found for this semester');
      }
    } catch (error) {
      toast.error('Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherTimetable = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/timetable/teacher/my-schedule`, {
        headers: {
          'Authorization': `Bearer ${api.token.get()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Convert teacher schedule to timetable format
        if (data.data && data.data.length > 0) {
          // Keep the original structure with department and semester info
          const allSlots = data.data.flatMap(schedule => 
            schedule.timeSlots.map(slot => ({
              ...slot,
              department: schedule.department,
              semester: schedule.semester
            }))
          );
          setTimetable({ timeSlots: allSlots });
        } else {
          setTimetable(null);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch teacher schedule');
    } finally {
      setLoading(false);
    }
  };

  const renderTimetableGrid = () => {
    if (!timetable || !timetable.timeSlots) {
      return (
        <div className="text-center py-8">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No timetable available</p>
        </div>
      );
    }

    // Filter time slots based on semester filter for teachers
    let filteredSlots = timetable.timeSlots;
    if (user?.role === 'teacher' || user?.role === 'hod') {
      filteredSlots = timetable.timeSlots.filter(slot => {
        if (semesterFilter === 'odd') {
          return slot.semester % 2 !== 0; // 1, 3, 5
        } else if (semesterFilter === 'even') {
          return slot.semester % 2 === 0; // 2, 4, 6
        }
        return true;
      });
    }

    // Create a grid structure
    const grid = {};
    DAYS.forEach(day => {
      grid[day] = {};
      TIME_SLOTS.forEach(slot => {
        grid[day][slot] = null;
      });
    });

    // Fill the grid with time slots
    filteredSlots.forEach(slot => {
      const timeKey = `${slot.startTime}-${slot.endTime}`;
      if (grid[slot.day] && grid[slot.day].hasOwnProperty(timeKey)) {
        grid[slot.day][timeKey] = slot;
      }
    });

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Time
                </div>
              </th>
              {DAYS.map(day => (
                <th key={day} className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((timeSlot, index) => (
              <tr key={timeSlot} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700 bg-gray-100">
                  <div className="text-sm">{formatTimeSlot(timeSlot)}</div>
                </td>
                {DAYS.map(day => {
                  const slot = grid[day][timeSlot];
                  return (
                    <td key={`${day}-${timeSlot}`} className="border border-gray-300 px-2 py-2">
                      {slot ? (
                        <div className={`p-3 rounded-lg text-sm shadow-sm ${
                          slot.subjectType === 'lab' ? 'bg-blue-100 text-blue-900 border-l-4 border-blue-500' :
                          slot.subjectType === 'practical' ? 'bg-green-100 text-green-900 border-l-4 border-green-500' :
                          'bg-purple-100 text-purple-900 border-l-4 border-purple-500'
                        }`}>
                          <div className="font-semibold mb-1 flex items-center">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {slot.subject?.name}
                          </div>
                          {(user?.role === 'teacher' || user?.role === 'hod') && slot.department && slot.semester && (
                            <div className="text-xs mb-1 font-medium text-gray-700">
                              {slot.department} - Sem {slot.semester}
                            </div>
                          )}
                          {user?.role !== 'teacher' && user?.role !== 'hod' && (
                            <div className="text-xs mb-1 flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {slot.teacher?.fullName}
                            </div>
                          )}
                          <div className="text-xs flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {slot.room}
                          </div>
                          <div className="text-xs mt-1 opacity-75">
                            {slot.subjectType.charAt(0).toUpperCase() + slot.subjectType.slice(1)}
                          </div>
                        </div>
                      ) : (
                        <div className="h-20 flex items-center justify-center text-gray-400 text-sm">
                          <div className="text-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-1">
                              <Clock className="w-4 h-4" />
                            </div>
                            Free
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getTimetableStats = () => {
    if (!timetable || !timetable.timeSlots) return null;

    // For teachers, use filtered slots based on semester filter
    let slotsForStats = timetable.timeSlots;
    if (user?.role === 'teacher' || user?.role === 'hod') {
      slotsForStats = timetable.timeSlots.filter(slot => {
        if (semesterFilter === 'odd') {
          return slot.semester % 2 !== 0; // 1, 3, 5
        } else if (semesterFilter === 'even') {
          return slot.semester % 2 === 0; // 2, 4, 6
        }
        return true;
      });
    }

    const totalSlots = slotsForStats.length;
    const subjects = [...new Set(slotsForStats.map(slot => slot.subject?.name))].filter(Boolean);
    const teachers = [...new Set(slotsForStats.map(slot => slot.teacher?.fullName))].filter(Boolean);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Classes</p>
              <p className="text-2xl font-bold text-blue-900">{totalSlots}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600 font-medium">Subjects</p>
              <p className="text-2xl font-bold text-green-900">{subjects.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <User className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Teachers</p>
              <p className="text-2xl font-bold text-purple-900">{teachers.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {(user?.role === 'teacher' || user?.role === 'hod') ? 'My Teaching Schedule' : 'Class Timetable'}
          </h1>
          <p className="text-gray-600">
            {(user?.role === 'teacher' || user?.role === 'hod')
              ? 'Your weekly teaching schedule' 
              : `${user?.department} Department - Semester ${selectedSemester || user?.semester || 1}`
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {(user?.role === 'teacher' || user?.role === 'hod') && (
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="odd">Odd Semester (1, 3, 5)</option>
              <option value="even">Even Semester (2, 4, 6)</option>
            </select>
          )}
          
          {user?.role === 'student' && (
            <select
              value={selectedSemester || user?.semester || 1}
              onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>
                  Semester {sem} {user?.semester === sem ? '(Your Semester)' : ''}
                </option>
              ))}
            </select>
          )}
          
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {getTimetableStats()}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-lg font-semibold flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Weekly Schedule
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading timetable...</p>
          </div>
        ) : (
          <div className="p-6">
            {renderTimetableGrid()}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-100 border-l-4 border-purple-500 rounded mr-2"></div>
            <span className="text-sm text-gray-700">Theory Classes</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-500 rounded mr-2"></div>
            <span className="text-sm text-gray-700">Lab Sessions</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border-l-4 border-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-700">Practical Classes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timetable;