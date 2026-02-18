import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ResultsManager = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ studentId: '', examId: '', subject: '', marks: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canDelete = useMemo(() => ['hod', 'admin'].includes(user?.role), [user?.role]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resultsResponse, studentsResponse, examsResponse] = await Promise.all([
        api.results.list(),
        api.users.byRole('student'),
        api.exams.list(),
      ]);
      setResults(resultsResponse.results || []);
      setStudents(studentsResponse.users || []);
      setExams(examsResponse.exams || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.examId || !form.subject || form.marks === '') {
      setError('All fields are required.');
      return;
    }
    try {
      setLoading(true);
      await api.results.create({
        studentId: form.studentId,
        examId: form.examId,
        subject: form.subject,
        marks: Number(form.marks),
      });
      setForm({ studentId: '', examId: '', subject: '', marks: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save result');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this result?')) return;
    try {
      setLoading(true);
      await api.results.remove(id);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Results</h1>
        <p className="text-gray-600">Publish and manage exam results.</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">Create / Update Result</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            name="studentId"
            value={form.studentId}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
          >
            <option value="">Select Student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName}
              </option>
            ))}
          </select>
          <select
            name="examId"
            value={form.examId}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
          >
            <option value="">Select Exam</option>
            {exams.map((exam) => (
              <option key={exam._id} value={exam._id}>
                {exam.examName}
              </option>
            ))}
          </select>
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Subject"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
          />
          <input
            name="marks"
            value={form.marks}
            onChange={handleChange}
            type="number"
            placeholder="Marks"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
          />
          <button
            type="submit"
            disabled={loading}
            className="md:col-span-4 px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold"
          >
            {loading ? 'Saving...' : 'Save Result'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">Results</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Exam</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Marks</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                {canDelete && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 6 : 5} className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Loading results...' : 'No results available.'}
                  </td>
                </tr>
              ) : (
                results.map((result) => (
                  <tr key={result._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {result.studentId?.fullName || 'Student'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{result.examId?.examName || 'Exam'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{result.subject}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{result.marks}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        result.status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    {canDelete && (
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleDelete(result._id)}
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

export default ResultsManager;

