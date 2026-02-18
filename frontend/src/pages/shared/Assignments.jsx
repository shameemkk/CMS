import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  subject: '',
  questions: '',
  dueDate: '',
  marks: '',
};

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canManage = useMemo(() => ['teacher', 'hod', 'admin'].includes(user?.role), [user?.role]);
  const canDelete = useMemo(() => ['hod', 'admin'].includes(user?.role), [user?.role]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.assignments.list();
      setAssignments(response.assignments || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEdit = (assignment) => {
    setEditingId(assignment._id);
    setForm({
      subject: assignment.subject || '',
      questions: assignment.questions || '',
      dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : '',
      marks: assignment.marks ?? '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingId) {
        await api.assignments.update(editingId, {
          subject: form.subject,
          questions: form.questions,
          dueDate: form.dueDate,
          marks: Number(form.marks),
        });
      } else {
        await api.assignments.create({
          subject: form.subject,
          questions: form.questions,
          dueDate: form.dueDate,
          marks: Number(form.marks),
        });
      }
      setForm(emptyForm);
      setEditingId(null);
      loadAssignments();
    } catch (err) {
      setError(err.message || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      setLoading(true);
      await api.assignments.remove(id);
      loadAssignments();
    } catch (err) {
      setError(err.message || 'Failed to delete assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Assignments</h1>
        <p className="text-gray-600">View and manage assignments for your department.</p>
      </div>

      {canManage && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">
            {editingId ? 'Edit Assignment' : 'Create Assignment'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Subject"
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
            <input
              name="marks"
              value={form.marks}
              onChange={handleChange}
              type="number"
              placeholder="Marks"
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
            <input
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              type="date"
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
            <textarea
              name="questions"
              value={form.questions}
              onChange={handleChange}
              rows="3"
              placeholder="Assignment questions"
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

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Marks</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Questions</th>
                {canManage && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Loading assignments...' : 'No assignments available.'}
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{assignment.subject}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{assignment.marks}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{assignment.questions}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(assignment)}
                            className="text-[#6e0718] hover:text-[#8a0a1f] font-medium"
                          >
                            Edit
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(assignment._id)}
                              className="text-red-500 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
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

export default Assignments;

