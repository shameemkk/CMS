import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, MapPin, Users, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MarkAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [daySchedule, setDaySchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const { user } = useAuth();

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (selectedDate) {
      fetchDaySchedule();
    }
  }, [selectedDate]);

  const fetchDaySchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/timetable/teacher/my-schedule', {
        headers: {
          'Authorization': `Bearer ${api.token.get()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Get day of week for selected date
        const dayOfWeek = DAYS[new Date(selectedDate).getDay()];
        
        // Filter slots for the selected day
        const daySlots = [];
        if (data.data && data.data.length > 0) {
          data.data.forEach(schedule => {
            schedule.timeSlots.forEach(slot => {
              if (slot.day === dayOfWeek) {
                daySlots.push({
                  ...slot,
                  department: schedule.department,
                  semester: schedule.semester
                });
              }
            });
          });
        }
        
        // Sort by start time
        daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setDaySchedule(daySlots);
      }
    } catch (error) {
      toast.error('Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = async (slot) => {
    setSelectedSlot(slot);
    setShowAttendanceModal(true);
    setLoadingStudents(true);
    setStudents([]);
    setStatusMap({});
    
    try {
      // Fetch students for this department and semester
      const response = await api.users.byRole('student');
      const filteredStudents = response.users?.filter(
        student => student.department === slot.department && student.semester === slot.semester
      ) || [];
      
      setStudents(filteredStudents);
      
      // Load existing attendance for this slot
      const timeSlot = `${convertTo12Hour(slot.startTime)} - ${convertTo12Hour(slot.endTime)}`;
      const attendanceResponse = await api.attendance.list({
        date: selectedDate,
        timeSlot: timeSlot,
      });
      
      const existing = attendanceResponse.attendance || [];
      const map = {};
      
      // Initialize status map with existing attendance or default to 'present'
      filteredStudents.forEach((student) => {
        const existingRecord = existing.find((r) => {
          const recordUserId = r.userId?._id || r.userId;
          return recordUserId?.toString() === student.id?.toString();
        });
        
        if (existingRecord && ['present', 'late', 'absent'].includes(existingRecord.status)) {
          map[student.id] = existingRecord.status;
        } else {
          map[student.id] = 'present';
        }
      });
      
      setStatusMap(map);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const convertTo12Hour = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleStatusChange = (studentId, status) => {
    setStatusMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const newMap = {};
    students.forEach(student => {
      newMap[student.id] = status;
    });
    setStatusMap(newMap);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSlot) return;
    
    try {
      setSaving(true);
      const timeSlot = `${convertTo12Hour(selectedSlot.startTime)} - ${convertTo12Hour(selectedSlot.endTime)}`;
      
      const records = students.map(student => ({
        userId: student.id,
        status: statusMap[student.id] || 'present',
      }));
      
      await api.attendance.markBulk({
        date: selectedDate,
        timeSlot: timeSlot,
        records,
      });
      
      toast.success('Attendance marked successfully');
      setShowAttendanceModal(false);
      setSelectedSlot(null);
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return DAYS[date.getDay()];
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mark Attendance</h1>
        <p className="text-gray-600">Select a date to view your schedule and mark attendance</p>
      </div>

      {/* Date Picker */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-blue-600" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Day</p>
            <p className="text-lg font-semibold text-gray-900">{getDayName(selectedDate)}</p>
          </div>
        </div>
      </div>

      {/* Schedule for Selected Day */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-lg font-semibold flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Schedule for {new Date(selectedDate).toLocaleDateString(undefined, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading schedule...</p>
          </div>
        ) : daySchedule.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No classes scheduled for this day</p>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Click on a class to mark attendance for students
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {daySchedule.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleSlotClick(slot)}
                  className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-lg ${
                    slot.subjectType === 'lab' 
                      ? 'bg-blue-50 border-blue-300 hover:border-blue-500' 
                      : slot.subjectType === 'practical'
                      ? 'bg-green-50 border-green-300 hover:border-green-500'
                      : 'bg-purple-50 border-purple-300 hover:border-purple-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      <span className="font-semibold text-gray-900">{slot.subject?.name}</span>
                    </div>
                    <Users className="w-4 h-4 text-gray-500" />
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{slot.room}</span>
                    </div>
                    <div className="text-xs font-medium text-gray-600 mt-2">
                      {slot.department} - Semester {slot.semester}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {slot.subjectType}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance Modal */}
      {showAttendanceModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mark Attendance</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedSlot.subject?.name} - {selectedSlot.department} Sem {selectedSlot.semester}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(selectedDate).toLocaleDateString()} | {selectedSlot.startTime} - {selectedSlot.endTime} | {selectedSlot.room}
                </p>
              </div>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingStudents ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading students and attendance data...</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => handleMarkAll('present')}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium text-sm flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Mark All Present
                    </button>
                    <button
                      onClick={() => handleMarkAll('absent')}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Mark All Absent
                    </button>
                  </div>

                  <div className="space-y-2">
                    {students.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No students found for this class</p>
                    ) : (
                      students
                        .sort((a, b) => a.fullName.localeCompare(b.fullName))
                        .map((student, index) => {
                          const status = statusMap[student.id] || 'present';
                          return (
                            <div
                              key={student.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                status === 'present' 
                                  ? 'bg-green-50 border-green-200' 
                                  : status === 'late'
                                  ? 'bg-yellow-50 border-yellow-200'
                                  : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-600 w-8">{index + 1}</span>
                                <span className="font-medium text-gray-900">{student.fullName}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleStatusChange(student.id, 'present')}
                                  className={`px-3 py-1 text-xs font-semibold rounded ${
                                    status === 'present'
                                      ? 'bg-green-600 text-white'
                                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  onClick={() => handleStatusChange(student.id, 'late')}
                                  className={`px-3 py-1 text-xs font-semibold rounded ${
                                    status === 'late'
                                      ? 'bg-yellow-600 text-white'
                                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  Late
                                </button>
                                <button
                                  onClick={() => handleStatusChange(student.id, 'absent')}
                                  className={`px-3 py-1 text-xs font-semibold rounded ${
                                    status === 'absent'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  Absent
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAttendanceModal(false)}
                disabled={loadingStudents || saving}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAttendance}
                disabled={saving || students.length === 0 || loadingStudents}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;
