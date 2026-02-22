import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptySubject = { subjectId: '', date: '', time: '', venue: '' };
const emptyExam = { examName: '', semester: '', startDate: '', endDate: '', subjects: [emptySubject] };

const ExamManager = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState(emptyExam);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allSubjects, setAllSubjects] = useState([]);
  const [semesterSubjects, setSemesterSubjects] = useState([]);

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
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const response = await api.subjects.list();
      setAllSubjects(response.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  // Update available subjects when semester changes
  useEffect(() => {
    if (form.semester) {
      const filtered = allSubjects.filter(subject => subject.semester === parseInt(form.semester));
      setSemesterSubjects(filtered);
    } else {
      setSemesterSubjects([]);
    }
  }, [form.semester, allSubjects]);

  const handleExamChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset subjects when semester changes
      if (name === 'semester') {
        updated.subjects = [emptySubject];
      }
      return updated;
    });
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
      semester: exam.semester?.toString() || '',
      startDate: exam.examSchedule?.startDate ? exam.examSchedule.startDate.split('T')[0] : '',
      endDate: exam.examSchedule?.endDate ? exam.examSchedule.endDate.split('T')[0] : '',
      subjects: (exam.subjects || []).map((subject) => ({
        subjectId: subject.subjectId || subject.subjectName || '',
        date: subject.date ? subject.date.split('T')[0] : '',
        time: subject.time || '',
        venue: subject.venue || '',
      })),
    });
    setShowEditModal(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowEditModal(false);
    setForm(emptyExam);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.examName || !form.semester || form.subjects.length === 0) {
      setError('Exam name, semester, and at least one subject are required.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        examName: form.examName,
        semester: parseInt(form.semester),
        subjects: form.subjects.map((subject) => {
          const subjectData = semesterSubjects.find(s => s._id === subject.subjectId);
          return {
            subjectId: subject.subjectId,
            subjectName: subjectData?.name || '',
            date: subject.date,
            time: subject.time,
            venue: subject.venue,
          };
        }),
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
      setError('');
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

      {!editingId && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#6e0718] mb-4">Create Exam</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Name <span className="text-red-500">*</span>
              </label>
              <input
                name="examName"
                value={form.examName}
                onChange={handleExamChange}
                placeholder="e.g. First Semester Exam"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                name="semester"
                value={form.semester}
                onChange={handleExamChange}
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
                Start Date
              </label>
              <input
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleExamChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={handleExamChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Exam Subjects</h3>
            {form.semester && semesterSubjects.length === 0 && (
              <p className="text-sm text-red-600 mb-3">No subjects available for this semester</p>
            )}
            <div className="space-y-4">
              {form.subjects.map((subject, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
                    <select
                      value={subject.subjectId}
                      onChange={(e) => handleSubjectChange(index, 'subjectId', e.target.value)}
                      required
                      disabled={!form.semester}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718] disabled:bg-gray-200"
                    >
                      <option value="">Select Subject</option>
                      {semesterSubjects.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                    <input
                      type="date"
                      value={subject.date}
                      onChange={(e) => handleSubjectChange(index, 'date', e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Time *</label>
                    <input
                      value={subject.time}
                      onChange={(e) => handleSubjectChange(index, 'time', e.target.value)}
                      placeholder="09:00 AM - 12:00 PM"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Venue</label>
                    <input
                      value={subject.venue}
                      onChange={(e) => handleSubjectChange(index, 'venue', e.target.value)}
                      placeholder="Room/Hall"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                    />
                  </div>
                  <div>
                    {form.subjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubject(index)}
                        className="w-full px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addSubject}
                disabled={!form.semester || semesterSubjects.length === 0}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ➕ Add Subject
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#6e0718]">Edit Exam</h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exam Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="examName"
                      value={form.examName}
                      onChange={handleExamChange}
                      placeholder="e.g. First Semester Exam"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="semester"
                      value={`Semester ${form.semester}`}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      name="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={handleExamChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      name="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={handleExamChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Exam Subjects</h3>
                  {semesterSubjects.length === 0 && (
                    <p className="text-sm text-red-600 mb-3">No subjects available for this semester</p>
                  )}
                  <div className="space-y-4">
                    {form.subjects.map((subject, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
                          <select
                            value={subject.subjectId}
                            onChange={(e) => handleSubjectChange(index, 'subjectId', e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                          >
                            <option value="">Select Subject</option>
                            {semesterSubjects.map((sub) => (
                              <option key={sub._id} value={sub._id}>
                                {sub.name} ({sub.code})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                          <input
                            type="date"
                            value={subject.date}
                            onChange={(e) => handleSubjectChange(index, 'date', e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Time *</label>
                          <input
                            value={subject.time}
                            onChange={(e) => handleSubjectChange(index, 'time', e.target.value)}
                            placeholder="09:00 AM - 12:00 PM"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Venue</label>
                          <input
                            value={subject.venue}
                            onChange={(e) => handleSubjectChange(index, 'venue', e.target.value)}
                            placeholder="Room/Hall"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                          />
                        </div>
                        <div>
                          {form.subjects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSubject(index)}
                              className="w-full px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSubject}
                      disabled={semesterSubjects.length === 0}
                      className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ➕ Add Subject
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Exam'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {error && !showEditModal && (
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Semester</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Schedule</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subjects</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Loading exams...' : 'No exams available.'}
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{exam.examName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">Semester {exam.semester || '-'}</td>
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

