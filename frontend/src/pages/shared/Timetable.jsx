import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Monday to Friday, 5 slots (9 AM - 4 PM), lunch break 12:00 - 1:30 PM
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TIME_SLOTS = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '1:30 PM - 2:45 PM',
  '2:45 PM - 4:00 PM',
];


const Timetable = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ day: 'Monday', timeSlot: TIME_SLOTS[0], subject: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canManage = useMemo(() => ['teacher', 'hod'].includes(user?.role), [user?.role]);

  const slotOrder = (slot) => TIME_SLOTS.indexOf(slot);
  const dayOrder = (day) => DAYS.indexOf(day);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const response = await api.timetable.list({});
      const list = response.timetable || [];
      list.sort((a, b) => {
        const d = dayOrder(a.day) - dayOrder(b.day);
        return d !== 0 ? d : slotOrder(a.timeSlot) - slotOrder(b.timeSlot);
      });
      setEntries(list);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [user?.role]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.timeSlot || !form.subject) {
      setError('Time slot and subject are required.');
      return;
    }
    try {
      setLoading(true);
      await api.timetable.upsert({
        day: form.day,
        timeSlot: form.timeSlot,
        subject: form.subject,
      });
      setForm((prev) => ({ ...prev, subject: '', timeSlot: TIME_SLOTS[0] }));
      await loadTimetable();
    } catch (err) {
      setError(err.message || 'Failed to save timetable entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      setLoading(true);
      await api.timetable.remove(id);
      await loadTimetable();
    } catch (err) {
      setError(err.message || 'Failed to delete timetable entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Time Table</h1>
        <p className="text-gray-600 mb-2">View and manage class schedules. Monday–Friday, 5 slots (9 AM – 4 PM).</p>
        <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg inline-block">
          <strong>Lunch Break:</strong> 12:00 PM – 1:30 PM
        </p>
      </div>

      {canManage && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">Create / Update Entry</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              name="day"
              value={form.day}
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              {DAYS.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <select
              name="timeSlot"
              value={form.timeSlot}
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Subject"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
            <button
              type="submit"
              disabled={loading}
              className="md:col-span-4 px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold"
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        {!canManage && user?.role === 'student' && (
          <div className="text-sm text-gray-600 mb-4">
            Showing <span className="font-semibold text-[#6e0718]">Teacher</span> timetable
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Day</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time Slot</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                {canManage && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 4 : 3} className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Loading timetable...' : 'No timetable entries found.'}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{entry.day}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.timeSlot}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.subject}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Timetable;

