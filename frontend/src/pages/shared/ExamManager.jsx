import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptySubject = { subjectName: '', date: '', time: '', venue: '' };
const emptyExam = { examName: '', startDate: '', endDate: '', subjects: [emptySubject] };

const ExamManager = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState(emptyExam);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canDelete = useMemo(() => ['hod', 'admin'].includes(user?.role), [user?.role]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await api.exams.list();
      setExams(response.exams || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleExamChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubjectChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.subjects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, subjects: updated };
    });
  };

  const addSubject = () => {
    setForm((prev) => ({ ...prev, subjects: [...prev.subjects, emptySubject] }));
  };

  const removeSubject = (index) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const handleEdit = (exam) => {
    setEditingId(exam._id);
    setForm({
      examName: exam.examName || '',
      startDate: exam.examSchedule?.startDate ? exam.examSchedule.startDate.split('T')[0] : '',
      endDate: exam.examSchedule?.endDate ? exam.examSchedule.endDate.split('T')[0] : '',
      subjects: (exam.subjects || []).map((subject) => ({
        subjectName: subject.subjectName || '',
        date: subject.date ? subject.date.split('T')[0] : '',
        time: subject.time || '',
        venue: subject.venue || '',
      })),
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyExam);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.examName || form.subjects.length === 0) {
      setError('Exam name and at least one subject are required.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        examName: form.examName,
        subjects: form.subjects.map((subject) => ({
          subjectName: subject.subjectName,
          date: subject.date,
          time: subject.time,
          venue: subject.venue,
        })),
        examSchedule: {
          startDate: form.startDate || form.subjects[0]?.date,
          endDate: form.endDate || form.subjects[form.subjects.length - 1]?.date,
        },
      };
      if (editingId) {
        await api.exams.update(editingId, payload);
      } else {
        await api.exams.create(payload);
      }
      handleCancel();
      loadExams();
    } catch (err) {
      setError(err.message || 'Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      setLoading(true);
      await api.exams.remove(id);
      loadExams();
    } catch (err) {
      setError(err.message || 'Failed to delete exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Exam Management</h1>
        <p className="text-gray-600">Create and manage exams for your department.</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">{editingId ? 'Edit Exam' : 'Create Exam'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              name="examName"
              value={form.examName}
              onChange={handleExamChange}
              placeholder="Exam Name"
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleExamChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
            <input
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleExamChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
          </div>

          <div className="space-y-4">
            {form.subjects.map((subject, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <input
                  value={subject.subjectName}
                  onChange={(e) => handleSubjectChange(index, 'subjectName', e.target.value)}
                  placeholder="Subject Name"
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                />
                <input
                  type="date"
                  value={subject.date}
                  onChange={(e) => handleSubjectChange(index, 'date', e.target.value)}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                />
                <input
                  value={subject.time}
                  onChange={(e) => handleSubjectChange(index, 'time', e.target.value)}
                  placeholder="Time (e.g. 09:00 AM - 12:00 PM)"
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                />
                <div className="flex gap-2">
                  <input
                    value={subject.venue}
                    onChange={(e) => handleSubjectChange(index, 'venue', e.target.value)}
                    placeholder="Venue"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718] flex-1"
                  />
                  {form.subjects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubject(index)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addSubject}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              ➕ Add Subject
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold"
            >
              {editingId ? 'Update Exam' : 'Create Exam'}
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">Scheduled Exams</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Exam Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Schedule</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subjects</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Loading exams...' : 'No exams available.'}
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{exam.examName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {exam.examSchedule?.startDate
                        ? new Date(exam.examSchedule.startDate).toLocaleDateString()
                        : '-'}{' '}
                      -{' '}
                      {exam.examSchedule?.endDate
                        ? new Date(exam.examSchedule.endDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(exam.subjects || []).map((subject) => subject.subjectName).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(exam)}
                          className="text-[#6e0718] hover:text-[#8a0a1f] font-medium"
                        >
                          Edit
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(exam._id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
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

export default ExamManager;

