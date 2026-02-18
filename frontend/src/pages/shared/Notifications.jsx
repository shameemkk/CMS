import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  title: '',
  description: '',
  media: '',
  targetRole: 'student',
  department: 'all',
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canManage = useMemo(() => ['hod', 'admin'].includes(user?.role), [user?.role]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.notifications.list();
      setNotifications(response.notifications || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (user?.department && canManage) {
      setForm((prev) => ({ ...prev, department: user.department }));
    }
  }, [user, canManage]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEdit = (notification) => {
    setEditingId(notification._id);
    setForm({
      title: notification.title || '',
      description: notification.description || '',
      media: notification.media || '',
      targetRole: notification.targetRole || 'student',
      department: notification.department || user?.department || 'all',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm((prev) => ({ ...emptyForm, department: prev.department }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        title: form.title,
        description: form.description,
        media: form.media || undefined,
        targetRole: form.targetRole,
        department: form.department,
      };
      if (editingId) {
        await api.notifications.update(editingId, payload);
      } else {
        await api.notifications.create(payload);
      }
      handleCancel();
      loadNotifications();
    } catch (err) {
      setError(err.message || 'Failed to save notification');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      setLoading(true);
      await api.notifications.remove(id);
      loadNotifications();
    } catch (err) {
      setError(err.message || 'Failed to delete notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Notifications</h1>
        <p className="text-gray-600">Stay updated with department announcements.</p>
      </div>

      {canManage && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">
            {editingId ? 'Edit Notification' : 'Create Notification'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Title"
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
            <input
              name="media"
              value={form.media}
              onChange={handleChange}
              placeholder="Media URL (optional)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
            <select
              name="targetRole"
              value={form.targetRole}
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="hod">HOD</option>
              <option value="all">All</option>
            </select>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              <option value={user?.department || ''}>{user?.department || 'My Department'}</option>
              <option value="all">All Departments</option>
            </select>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              placeholder="Description"
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718] md:col-span-2"
            />
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-500">
            {loading ? 'Loading notifications...' : 'No notifications available.'}
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification._id} className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-[#6e0718] mb-2">{notification.title}</h3>
              <p className="text-gray-600 mb-4">{notification.description}</p>
              {notification.media && (
                <a
                  href={notification.media}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#6e0718] hover:text-[#8a0a1f] font-medium"
                >
                  View Media
                </a>
              )}
              <div className="mt-4 text-sm text-gray-500">
                Target: {notification.targetRole} | Department: {notification.department}
              </div>
              {canManage && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleEdit(notification)}
                    className="text-[#6e0718] hover:text-[#8a0a1f] font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;

