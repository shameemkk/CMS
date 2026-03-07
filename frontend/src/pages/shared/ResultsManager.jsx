import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ResultsManager = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [examSubjects, setExamSubjects] = useState([]);
  const [form, setForm] = useState({ studentId: '', examId: '', subject: '', marks: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canDelete = useMemo(() => ['hod', 'admin'].includes(user?.role), [user?.role]);
  const isHOD = useMemo(() => user?.role === 'hod', [user?.role]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resultsResponse, studentsResponse, examsResponse, subjectsResponse] = await Promise.all([
        api.results.list(),
        api.users.byRole('student'),
        api.exams.list(),
        api.subjects.list(),
      ]);
      setResults(resultsResponse.results || []);
      setStudents(studentsResponse.users || []);
      setExams(examsResponse.exams || []);
      
      const allSubjects = subjectsResponse.subjects || [];
      setSubjects(allSubjects);
      
      // Filter subjects for teachers (only their assigned subjects)
      if (user?.role === 'teacher') {
        const teacherSubjects = allSubjects.filter(
          (subject) => subject.assignedTeacher?._id === user?.id || subject.assignedTeacher === user?.id
        );
        setMySubjects(teacherSubjects);
      } else {
        // HODs and admins can see all subjects
        setMySubjects(allSubjects);
      }
      
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Update available subjects when exam is selected
  useEffect(() => {
    if (form.examId) {
      const selectedExam = exams.find(exam => exam._id === form.examId);
      if (selectedExam && selectedExam.subjects) {
        // Get subject names from the exam
        const examSubjectNames = selectedExam.subjects.map(s => s.subjectName);
        
        // Filter mySubjects to only show subjects that are in this exam
        const availableSubjects = mySubjects.filter(subject => 
          examSubjectNames.includes(subject.name)
        );
        setExamSubjects(availableSubjects);
      } else {
        setExamSubjects([]);
      }
      // Reset subject when exam changes
      setForm(prev => ({ ...prev, subject: '' }));
    } else {
      setExamSubjects([]);
    }
  }, [form.examId, exams, mySubjects]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.examId || !form.subject || form.marks === '') {
      toast.error('All fields are required');
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
      toast.success('Result saved successfully');
      setForm({ studentId: '', examId: '', subject: '', marks: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save result');
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
      toast.success('Result deleted successfully');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete result');
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam <span className="text-red-500">*</span>
              </label>
              <select
                name="examId"
                value={form.examId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
              >
                <option value="">Select Exam</option>
                {exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.examName}
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
                disabled={!form.examId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718] disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Subject</option>
                {examSubjects.map((subject) => (
                  <option key={subject._id} value={subject.name}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
              {form.examId && examSubjects.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  {isHOD ? 'No subjects available for this exam' : 'No subjects assigned to you for this exam'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student <span className="text-red-500">*</span>
              </label>
              <select
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} - Sem {student.semester}
                  </option>
                ))}
              </select>
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
                min="0"
                placeholder="Enter marks"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold disabled:opacity-50"
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

