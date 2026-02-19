import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TIME_SLOTS = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '1:30 PM - 2:45 PM',
  '2:45 PM - 4:00 PM',
];

const slotOrder = (slot) => TIME_SLOTS.indexOf(slot);

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', bg: 'bg-green-50', border: 'border-green-600', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
  { value: 'late', label: 'Late', bg: 'bg-yellow-50', border: 'border-yellow-600', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
  { value: 'absent', label: 'Absent', bg: 'bg-red-50', border: 'border-red-600', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
];
const getStatusStyle = (status) => STATUS_OPTIONS.find((s) => s.value === status)?.badge || 'bg-gray-100 text-gray-800';

const Attendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    role: 'student',
    date: '',
    department: 'BCA',
  });
  const [markDate, setMarkDate] = useState(new Date().toISOString().slice(0, 10));
  const [markSlot, setMarkSlot] = useState(TIME_SLOTS[0]);
  const [markDepartment, setMarkDepartment] = useState('BCA');
  const [statusMap, setStatusMap] = useState({}); // userId -> 'present' | 'late' | 'absent'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedDate, setExpandedDate] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [selectedSlotRecords, setSelectedSlotRecords] = useState([]);
  const [selectedSlotInfo, setSelectedSlotInfo] = useState({ date: '', slot: '' });
  const [nameModalStudent, setNameModalStudent] = useState(null); // { siNumber, fullName } | null

  const canMark = useMemo(() => ['teacher', 'hod', 'admin'].includes(user?.role), [user?.role]);

  // Group records by date, then by slot (one student per slot per day)
  const groupedByDate = useMemo(() => {
    const byDate = {};
    records.forEach((r) => {
      const d = new Date(r.date).toISOString().slice(0, 10);
      if (!byDate[d]) byDate[d] = {};
      const slot = r.timeSlot || '—';
      if (!byDate[d][slot]) byDate[d][slot] = [];
      byDate[d][slot].push(r);
    });
    return byDate;
  }, [records]);

  const sortedDates = useMemo(
    () => Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a)),
    [groupedByDate]
  );

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await api.attendance.list({
        role: filters.role,
        date: filters.date || undefined,
        department: filters.department || undefined,
      });
      setRecords(response.attendance || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    if (user.role !== 'student') return;
    try {
      const response = await api.attendance.stats({});
      setStats(response.stats || null);
    } catch (err) {
      setStats(null);
    }
  };

  const loadUsers = async (role) => {
    if (!canMark || !role) return;
    try {
      const response = await api.users.byRole(role);
      // Filter users by selected department
      const filteredUsers = response.users?.filter(user => user.department === markDepartment) || [];
      setUsers(filteredUsers);
    } catch (err) {
      setUsers([]);
    }
  };

  useEffect(() => {
    loadRecords();
    loadStats();
  }, [filters.role, filters.date, filters.department]);

  useEffect(() => {
    if (canMark) {
      loadUsers('student');
    }
  }, [canMark, markDepartment]);

  // Pre-load existing attendance when date/slot changes for marking
  useEffect(() => {
    if (!canMark || users.length === 0 || !markDate || !markSlot) {
      if (users.length > 0) {
        const initial = {};
        users.forEach((u) => {
          initial[u.id] = 'present';
        });
        setStatusMap(initial);
      } else {
        setStatusMap({});
      }
      return;
    }
    const loadExisting = async () => {
      try {
        const response = await api.attendance.list({
          date: markDate,
          timeSlot: markSlot,
        });
        const existing = response.attendance || [];
        const map = {};
        users.forEach((u) => {
          const rec = existing.find((r) => (r.userId?._id || r.userId)?.toString() === u.id?.toString());
          map[u.id] = rec && ['present', 'late', 'absent'].includes(rec.status) ? rec.status : 'present';
        });
        setStatusMap(map);
      } catch {
        const initial = {};
        users.forEach((u) => {
          initial[u.id] = 'present';
        });
        setStatusMap(initial);
      }
    };
    loadExisting();
  }, [canMark, users, markDate, markSlot]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStatusChange = (userId, status) => {
    setStatusMap((prev) => ({ ...prev, [userId]: status }));
  };

  const handleSlotClick = (dateStr, slot, records) => {
    setSelectedSlotRecords(records.sort((a, b) => (a.userId?.fullName || '').localeCompare(b.userId?.fullName || '')));
    setSelectedSlotInfo({ 
      date: new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }), 
      slot 
    });
    setShowRecordsModal(true);
  };

  const handleMarkAll = (status) => {
    const next = {};
    users.forEach((u) => {
      next[u.id] = status;
    });
    setStatusMap(next);
  };

  const handleMarkAttendanceBulk = async (e) => {
    e.preventDefault();
    if (!markDate || users.length === 0) {
      setError('Please select a date and ensure students are loaded.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const records = users.map((u) => ({
        userId: u.id,
        status: statusMap[u.id] || 'present',
      }));
      await api.attendance.markBulk({
        date: markDate,
        timeSlot: markSlot,
        records,
      });
      await loadRecords();
      setShowStudentModal(false);
      setNameModalStudent(null);
    } catch (err) {
      setError(err.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Attendance</h1>
        <p className="text-gray-600">Track and manage attendance records.</p>
      </div>

      {stats && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">My Attendance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Slots</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.late ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Attendance %</p>
              <p className="text-2xl font-bold text-[#6e0718]">{stats.percentage}%</p>
            </div>
          </div>
        </div>
      )}

      {canMark && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">Mark Attendance</h2>
          <p className="text-gray-600 mb-4">
            Select date and time slot, then click "Student List" to mark attendance.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="date"
              value={markDate}
              onChange={(e) => setMarkDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
            <select
              value={markSlot}
              onChange={(e) => setMarkSlot(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
            <select
              value={markDepartment}
              onChange={(e) => setMarkDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              <option value="BCA">BCA</option>
              <option value="BCom">BCom</option>
              <option value="BA">BA</option>
            </select>
            <button
              type="button"
              onClick={() => setShowStudentModal(true)}
              disabled={!markDate || users.length === 0}
              className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold disabled:opacity-50"
            >
              Student List ({users.length})
            </button>
          </div>
        </div>
      )}

      {/* Student List Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-[#6e0718]">Mark Attendance</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {new Date(markDate).toLocaleDateString()} - {markSlot} - {markDepartment}
                </p>
              </div>
              <button
                onClick={() => { setShowStudentModal(false); setNameModalStudent(null); }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 p-6">
              <p className="text-gray-600 mb-4">
                Set status per student: <span className="text-green-600 font-semibold">Present</span>, <span className="text-yellow-600 font-semibold">Late</span>, or <span className="text-red-600 font-semibold">Absent</span>.
              </p>
              
              <form id="mark-attendance-form" onSubmit={handleMarkAttendanceBulk} className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center mb-4">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleMarkAll(opt.value)}
                      className={`px-4 py-2 border-2 ${opt.border} ${opt.text} rounded-lg hover:opacity-90 transition-colors font-medium text-sm`}
                    >
                      Mark All {opt.label}
                    </button>
                  ))}
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {users
                      .sort((a, b) => a.fullName.localeCompare(b.fullName))
                      .map((u, index) => {
                        const current = statusMap[u.id] || 'present';
                        const opt = STATUS_OPTIONS.find((o) => o.value === current);
                        return (
                          <div
                            key={u.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${opt?.bg || 'bg-green-50'} border border-transparent`}
                          >
                            <button
                              type="button"
                              onClick={() => setNameModalStudent({ siNumber: index + 1, fullName: u.fullName })}
                              className="text-sm font-medium text-[#6e0718] w-6 shrink-0 hover:underline focus:outline-none focus:ring-2 focus:ring-[#6e0718] focus:ring-offset-1 rounded"
                              title="Click to show name"
                            >
                              {index + 1}
                            </button>
                            <div className="flex gap-1 flex-shrink-0 flex-1 justify-end">
                              {STATUS_OPTIONS.map((s) => (
                                <button
                                  key={s.value}
                                  type="button"
                                  onClick={() => handleStatusChange(u.id, s.value)}
                                  className={`px-2 py-1 text-xs font-semibold rounded ${current === s.value ? s.badge : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {users.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No students to mark.</p>
                  )}
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0 bg-white">
              <button
                type="button"
                onClick={() => { setShowStudentModal(false); setNameModalStudent(null); }}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="mark-attendance-form"
                disabled={loading || users.length === 0}
                className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>

            {/* Name modal - show student name when SI number is clicked */}
            {nameModalStudent && (
              <div
                className="absolute inset-0 bg-black/40 flex items-center justify-center z-[60] rounded-xl"
                onClick={() => setNameModalStudent(null)}
              >
                <div
                  className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 className="text-sm font-medium text-gray-500 mb-1">SI No. {nameModalStudent.siNumber}</h4>
                  <p className="text-lg font-semibold text-[#6e0718]">{nameModalStudent.fullName}</p>
                  <button
                    type="button"
                    onClick={() => setNameModalStudent(null)}
                    className="mt-4 w-full px-4 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">Attendance Records</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Click a date to expand and see slot-based attendance. One student has one record per slot per day.
        </p>
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            placeholder="Select date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
          />
          <select
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
          >
            <option value="">All Departments</option>
            <option value="BCA">BCA</option>
            <option value="BCom">BCom</option>
            <option value="BA">BA</option>
          </select>
          <button
            onClick={() => setFilters((prev) => ({ ...prev, date: '', department: 'BCA' }))}
            className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Clear Filters
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {loading ? (
            <p className="py-8 text-center text-gray-500">Loading attendance...</p>
          ) : sortedDates.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No attendance records found.</p>
          ) : (
            sortedDates.map((dateStr) => {
              const slots = groupedByDate[dateStr] || {};
              const slotKeys = Object.keys(slots).sort((a, b) => slotOrder(a) - slotOrder(b));
              const isExpanded = expandedDate === dateStr;
              return (
                <div key={dateStr} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedDate(isExpanded ? null : dateStr)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left font-semibold text-[#6e0718]"
                  >
                    <span>{new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span className="text-gray-500 text-sm font-normal">
                      {slotKeys.length} slot{slotKeys.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {slotKeys.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleSlotClick(dateStr, slot, slots[slot])}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-[#6e0718] transition-colors text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-gray-700 mb-1">{slot}</div>
                                <div className="text-xs text-gray-500">
                                  {slots[slot].length} student{slots[slot].length !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <span className="text-[#6e0718] text-lg">▶</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Attendance Records Modal */}
      {showRecordsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-[#6e0718]">Attendance Records</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {selectedSlotInfo.date} - {selectedSlotInfo.slot}
                </p>
              </div>
              <button
                onClick={() => setShowRecordsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                      {canMark && <th className="px-4 py-3 text-left font-medium text-gray-600">Marked By</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSlotRecords.map((record) => (
                      <tr key={record._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800 font-medium">{record.userId?.fullName || 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusStyle(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                        {canMark && (
                          <td className="px-4 py-3 text-gray-600 text-sm">{record.markedBy?.fullName || 'Unknown'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedSlotRecords.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No attendance records found.</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowRecordsModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;

