import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, MapPin, Users, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', bg: 'bg-[#1a8c4b]', text: 'text-white' },
  { value: 'late', label: 'Late', bg: 'bg-[#f5b00c]', text: 'text-black' },
  { value: 'absent', label: 'Absent', bg: 'bg-[#d62839]', text: 'text-white' },
];

const NEXT_STATUS = {
  present: 'late',
  late: 'absent',
  absent: 'present',
};

const HodMarkAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [allTimetables, setAllTimetables] = useState([]);
  const [daySchedule, setDaySchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentDetailModal, setStudentDetailModal] = useState(null);
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const parseResponseData = async (response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  };

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchAllTimetables();
  }, []);

  useEffect(() => {
    if (allTimetables.length > 0) {
      filterScheduleByDateAndSemester();
    }
  }, [selectedDate, selectedSemester, allTimetables]);

  const fetchAllTimetables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/timetable?department=${user.department}`, {
        headers: {
          'Authorization': `Bearer ${api.token.get()}`
        }
      });
      
      if (response.ok) {
        const data = await parseResponseData(response);
        setAllTimetables(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch timetables');
    } finally {
      setLoading(false);
    }
  };

  const filterScheduleByDateAndSemester = () => {
    const dayOfWeek = DAYS[new Date(selectedDate).getDay()];
    
    // Find timetable for selected semester
    const semesterTimetable = allTimetables.find(
      tt => tt.semester === selectedSemester && tt.department === user.department
    );
    
    if (!semesterTimetable) {
      setDaySchedule([]);
      return;
    }
    
    // Filter slots for the selected day
    const daySlots = semesterTimetable.timeSlots
      .filter(slot => slot.day === dayOfWeek)
      .map(slot => ({
        ...slot,
        department: semesterTimetable.department,
        semester: semesterTimetable.semester
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    setDaySchedule(daySlots);
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

  const handleStatusToggle = (studentId) => {
    setStatusMap(prev => ({
      ...prev,
      [studentId]: NEXT_STATUS[prev[studentId] || 'present']
    }));
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
      
      const records = students
        .map(student => ({
          userId: student.id,
          status: statusMap[student.id],
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mark Attendance (HOD)</h1>
        <p className="text-gray-600">Mark attendance for any semester and subject in your department</p>
      </div>

      {/* Date and Semester Picker */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
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
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 text-right">
            <p className="text-sm text-gray-600 mb-1">Day</p>
            <p className="text-lg font-semibold text-gray-900 px-4 py-2 bg-blue-50 rounded-lg inline-block">
              {getDayName(selectedDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Schedule for Selected Day and Semester */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-lg font-semibold flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Schedule for {new Date(selectedDate).toLocaleDateString(undefined, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} - Semester {selectedSemester}
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
            <p className="text-gray-600">No classes scheduled for this day and semester</p>
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
                      <BookOpen className="w-3 h-3 mr-1" />
                      <span className="capitalize font-medium">{slot.subjectType}</span>
                    </div>
                    <div className="text-xs font-medium text-gray-600 mt-2">
                      Teacher: {slot.teacher?.fullName}
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
                  {new Date(selectedDate).toLocaleDateString()} | {selectedSlot.startTime} - {selectedSlot.endTime} | {selectedSlot.subjectType}
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
                  <div className="flex flex-wrap gap-3 items-center justify-center mb-6">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleMarkAll(opt.value)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-transform hover:scale-105 shadow-sm ${opt.bg} ${opt.text} text-sm`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 justify-center max-w-full">
                      {students.length === 0 ? (
                        <p className="text-center text-gray-500 py-8 col-span-7">No students found for this class</p>
                      ) : (
                        students
                          .sort((a, b) => a.fullName.localeCompare(b.fullName))
                          .map((student, index) => {
                            const status = statusMap[student.id] || 'present';
                            const opt = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
                            return (
                              <div key={student.id} className="flex flex-col items-center gap-1">
                                <button
                                  title={student.fullName}
                                  onClick={() => handleStatusToggle(student.id)}
                                  className={`flex items-center justify-center rounded-lg w-12 h-12 sm:w-14 sm:h-14 font-bold text-base sm:text-lg transition-transform hover:scale-105 active:scale-95 shadow-sm ${opt.bg} ${opt.text}`}
                                >
                                  {index + 1}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setStudentDetailModal({ siNumber: index + 1, ...student }); }}
                                  className="text-gray-400 hover:text-blue-600 transition-colors p-0.5"
                                  title="View student details"
                                >
                                  <User className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })
                      )}
                    </div>
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

          {/* Student Detail Popup */}
          {studentDetailModal && (
            <div
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]"
              onClick={() => setStudentDetailModal(null)}
            >
              <div
                className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    {studentDetailModal.fullName?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-400">SI No. {studentDetailModal.siNumber}</h4>
                    <p className="text-lg font-bold text-gray-900">{studentDetailModal.fullName}</p>
                  </div>
                </div>
                <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                  {studentDetailModal.email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Email</span>
                      <span className="text-gray-800 font-medium">{studentDetailModal.email}</span>
                    </div>
                  )}
                  {studentDetailModal.department && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Department</span>
                      <span className="text-gray-800 font-medium">{studentDetailModal.department}</span>
                    </div>
                  )}
                  {studentDetailModal.semester && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Semester</span>
                      <span className="text-gray-800 font-medium">{studentDetailModal.semester}</span>
                    </div>
                  )}
                  {studentDetailModal.phone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Phone</span>
                      <span className="text-gray-800 font-medium">{studentDetailModal.phone}</span>
                    </div>
                  )}
                  {studentDetailModal.rollNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Roll No</span>
                      <span className="text-gray-800 font-medium">{studentDetailModal.rollNumber}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setStudentDetailModal(null)}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HodMarkAttendance;
