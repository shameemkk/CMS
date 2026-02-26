import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StudentAttendanceView = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await api.attendance.list({
        role: 'student',
        department: user?.department,
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
    try {
      const response = await api.attendance.stats({});
      setStats(response.stats || null);
    } catch (err) {
      setStats(null);
    }
  };

  useEffect(() => {
    loadRecords();
    loadStats();
  }, []);

  // Filter records by month
  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    const recordMonth = recordDate.toISOString().slice(0, 7);
    
    const matchesMonth = !filters.month || recordMonth === filters.month;
    
    return matchesMonth;
  });

  // Group records by date
  const recordsByDate = {};
  filteredRecords.forEach(record => {
    const dateKey = new Date(record.date).toISOString().slice(0, 10);
    if (!recordsByDate[dateKey]) {
      recordsByDate[dateKey] = {};
    }
    recordsByDate[dateKey][record.timeSlot] = record;
  });

  // Get all unique time slots from records
  const allTimeSlots = [...new Set(filteredRecords.map(r => r.timeSlot))].sort();

  // Sort dates (newest first)
  const sortedDates = Object.keys(recordsByDate).sort((a, b) => new Date(b) - new Date(a));

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClearFilters = () => {
    setFilters({
      month: new Date().toISOString().slice(0, 7),
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">My Attendance</h1>
        <p className="text-gray-600">Track your attendance records.</p>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">Attendance Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Present</p>
              <p className="text-2xl font-bold text-green-700">{stats.present}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600">Late</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.late ?? 0}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600">Absent</p>
              <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Attendance %</p>
              <p className="text-2xl font-bold text-blue-700">{stats.percentage}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">Filter Records</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <input
              type="month"
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">Attendance Records</h2>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-700 border border-gray-200 sticky left-0 bg-gray-50 z-10">
                  Date
                </th>
                {allTimeSlots.map(slot => (
                  <th key={slot} className="px-3 py-3 text-center font-medium text-gray-700 border border-gray-200 min-w-[120px]">
                    <div className="text-xs">{slot}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={allTimeSlots.length + 1} className="px-4 py-8 text-center text-gray-500">
                    Loading attendance records...
                  </td>
                </tr>
              ) : sortedDates.length === 0 ? (
                <tr>
                  <td colSpan={allTimeSlots.length + 1} className="px-4 py-8 text-center text-gray-500">
                    No attendance records found for the selected filters.
                  </td>
                </tr>
              ) : (
                sortedDates.map((dateKey) => {
                  const recordDate = new Date(dateKey);
                  const dayName = recordDate.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateRecords = recordsByDate[dateKey];
                  
                  return (
                    <tr key={dateKey} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border border-gray-200 font-medium text-gray-800 sticky left-0 bg-white z-10">
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {recordDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </span>
                          <span className="text-xs text-gray-500">{dayName}</span>
                        </div>
                      </td>
                      {allTimeSlots.map(slot => {
                        const record = dateRecords[slot];
                        
                        return (
                          <td key={slot} className="px-3 py-3 border border-gray-200 text-center">
                            {record ? (
                              <div className="flex flex-col items-center gap-1">
                                {/* Status Icon */}
                                {record.status === 'present' ? (
                                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : record.status === 'late' ? (
                                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {/* Subject Name */}
                                {record.subject && (
                                  <div className="text-xs text-gray-600 font-medium text-center">
                                    {record.subject.code}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        {!loading && sortedDates.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-6 justify-center items-center text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300 text-lg">—</span>
              <span className="text-gray-700">No Class</span>
            </div>
          </div>
        )}

        {/* Results count */}
        {!loading && sortedDates.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {sortedDates.length} day{sortedDates.length !== 1 ? 's' : ''} with {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendanceView;
