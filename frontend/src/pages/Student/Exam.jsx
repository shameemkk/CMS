import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';

const gradeFromMarks = (marks) => {
  if (marks >= 90) return 'A+';
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B+';
  if (marks >= 60) return 'B';
  return 'C';
};

const Exam = () => {
  const [examSubMenu, setExamSubMenu] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const examsResponse = await api.exams.list();
        const subjects = (examsResponse.exams || [])
          .flatMap((exam) =>
            (exam.subjects || []).map((subject) => ({
              id: `${exam._id}-${subject.subjectName}`,
              subject: subject.subjectName,
              date: subject.date,
              time: subject.time,
              venue: subject.venue || 'TBA',
              examName: exam.examName,
            }))
          )
          .filter((exam) => exam.date)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingExams(subjects);

        const resultsResponse = await api.results.list();
        setResults(resultsResponse.results || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load exams');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredUpcoming = useMemo(() => {
    return upcomingExams.filter((exam) =>
      exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [upcomingExams, searchTerm]);

  const filteredResults = useMemo(() => {
    return results.filter((result) =>
      result.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [results, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Exam Management</h1>
        <p className="text-gray-600">View your exam schedules and results.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setExamSubMenu('upcoming')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
            examSubMenu === 'upcoming'
              ? 'bg-[#6e0718] text-white shadow-md'
              : 'bg-white text-[#6e0718] border-2 border-[#6e0718] hover:bg-[#6e0718] hover:text-white'
          }`}
        >
        Upcoming Exams
        </button>
        <button
          onClick={() => setExamSubMenu('results')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
            examSubMenu === 'results'
              ? 'bg-[#6e0718] text-white shadow-md'
              : 'bg-white text-[#6e0718] border-2 border-[#6e0718] hover:bg-[#6e0718] hover:text-white'
          }`}
        >
          Exam Results
        </button>
        <button
          onClick={() => setExamSubMenu('timetable')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
            examSubMenu === 'timetable'
              ? 'bg-[#6e0718] text-white shadow-md'
              : 'bg-white text-[#6e0718] border-2 border-[#6e0718] hover:bg-[#6e0718] hover:text-white'
          }`}
        >
          Exam Timetable
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {examSubMenu === 'upcoming' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#6e0718]">Upcoming Exams</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredUpcoming.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                {loading ? 'Loading exams...' : 'No upcoming exams found.'}
              </div>
            ) : (
              filteredUpcoming.map((exam) => (
                <div
                  key={exam.id}
                  className="border-l-4 border-[#6e0718] p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-[#6e0718]">{exam.subject}</h3>
                    <span className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                      {exam.examName || 'Exam'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{new Date(exam.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🕐</span>
                      <span>{exam.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{exam.venue}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {examSubMenu === 'results' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#6e0718] mb-6">Exam Results</h2>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Exam</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Marks</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Percentage</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grade</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      {loading ? 'Loading results...' : 'No exam results found.'}
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((result) => {
                    const percentage = Math.min(100, Math.round((result.marks / 100) * 100));
                    const grade = gradeFromMarks(result.marks);
                    return (
                      <tr key={result._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">{result.subject}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{result.examId?.examName || 'Exam'}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{result.marks}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">{percentage}%</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {grade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            result.status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {examSubMenu === 'timetable' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#6e0718] mb-6">Exam Timetable</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#6e0718] text-white">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Exam</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Venue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {upcomingExams.map((exam) => (
                  <tr key={`tt-${exam.id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                      {new Date(exam.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{exam.time}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{exam.subject}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{exam.examName || 'Exam'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{exam.venue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exam;
