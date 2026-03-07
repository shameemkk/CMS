import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  semester: '',
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
  const [subjects, setSubjects] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);

  const canManage = useMemo(() => ['teacher', 'hod', 'admin'].includes(user?.role), [user?.role]);
  const canDelete = useMemo(() => {
    if (['hod', 'admin'].includes(user?.role)) return true;
    return false; // Teachers can delete their own assignments (checked per assignment)
  }, [user?.role]);

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
    if (canManage) {
      loadSubjects();
    }
  }, [canManage]);

  const loadSubjects = async () => {
    try {
      const response = await api.subjects.list();
      const allSubjects = response.subjects || [];
      setSubjects(allSubjects);
      
      // Filter subjects assigned to the current teacher
      if (user?.role === 'teacher' || user?.role === 'hod') {
        const teacherSubjects = allSubjects.filter(
          (subject) => subject.assignedTeacher?._id === user?.id || subject.assignedTeacher === user?.id
        );
        setMySubjects(teacherSubjects);
      } else {
        setMySubjects(allSubjects);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const filteredSubjects = useMemo(() => {
    if (!form.semester) return [];
    return mySubjects.filter(subject => subject.semester === parseInt(form.semester));
  }, [form.semester, mySubjects]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset subject when semester changes
      if (name === 'semester') {
        updated.subject = '';
      }
      return updated;
    });
  };

  const handleEdit = (assignment) => {
    setEditingId(assignment._id);
    // Find the subject to get its semester
    const assignmentSubject = subjects.find(s => s._id === assignment.subject?._id || s.name === assignment.subject);
    setForm({
      semester: assignmentSubject?.semester?.toString() || '',
      subject: assignment.subject?._id || assignment.subject || '',
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
        toast.success('Assignment updated successfully');
      } else {
        await api.assignments.create({
          subject: form.subject,
          questions: form.questions,
          dueDate: form.dueDate,
          marks: Number(form.marks),
        });
        toast.success('Assignment created successfully');
      }
      setForm(emptyForm);
      setEditingId(null);
      loadAssignments();
    } catch (err) {
      toast.error(err.message || 'Failed to save assignment');
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
      toast.success('Assignment deleted successfully');
      loadAssignments();
    } catch (err) {
      toast.error(err.message || 'Failed to delete assignment');
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  name="semester"
                  value={form.semester}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  disabled={!form.semester}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718] disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Subject</option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
                {form.semester && filteredSubjects.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">No subjects assigned to you for this semester</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Date <span className="text-red-500">*</span>
                </label>
                <input
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marks <span className="text-red-500">*</span>
                </label>
                <input
                  name="marks"
                  value={form.marks}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  placeholder="Total marks"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic <span className="text-red-500">*</span>
              </label>
              <textarea
                name="questions"
                value={form.questions}
                onChange={handleChange}
                rows="4"
                placeholder="Enter assignment topic..."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingId ? 'Update Assignment' : 'Create Assignment'}
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Last Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Marks</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Topic</th>
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
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                      {assignment.subject?.name || assignment.subject}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{assignment.marks}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate" title={assignment.questions}>
                      {assignment.questions}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(assignment)}
                            className="text-[#6e0718] hover:text-[#8a0a1f] font-medium"
                          >
                            Edit
                          </button>
                          {(canDelete || assignment.createdBy?._id === user?.id) && (
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

