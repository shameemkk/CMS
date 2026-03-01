import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BatchTutors = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTutors, setSelectedTutors] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingBatchId, setSavingBatchId] = useState('');
  const [error, setError] = useState('');

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchesResponse, teachersResponse] = await Promise.all([
        api.batches.list({ department: user?.department }),
        api.users.byRole('teacher'),
      ]);

      const batchList = batchesResponse.data || [];
      const teacherList = teachersResponse.users || [];

      setBatches(batchList);
      setTeachers(teacherList);
      setSelectedTutors(
        batchList.reduce((acc, batch) => {
          acc[batch._id] = batch.tutor?._id || '';
          return acc;
        }, {})
      );
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load batch tutor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.department) {
      loadData();
    }
  }, [user?.department]);

  const handleSelectTutor = (batchId, tutorId) => {
    setSelectedTutors((prev) => ({
      ...prev,
      [batchId]: tutorId,
    }));
  };

  const handleSaveTutor = async (batchId) => {
    try {
      setSavingBatchId(batchId);
      await api.batches.assignTutor(batchId, selectedTutors[batchId] || null);
      toast.success('Batch tutor updated');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update batch tutor');
    } finally {
      setSavingBatchId('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Batch Tutor Management</h1>
        <p className="text-gray-600">Assign a tutor (teacher) to batches in your department.</p>
      </div>

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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Batch</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Current Tutor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Assign Tutor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No batches found for {user?.department}.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{batch.batchCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{batch.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {batch.tutor ? batch.tutor.fullName : 'Not assigned'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={selectedTutors[batch._id] || ''}
                        onChange={(e) => handleSelectTutor(batch._id, e.target.value)}
                        className="w-full min-w-[220px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent"
                      >
                        <option value="">No Tutor</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.fullName} ({teacher.email})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleSaveTutor(batch._id)}
                        disabled={savingBatchId === batch._id}
                        className="bg-[#6e0718] text-white px-4 py-2 rounded-lg hover:bg-[#8a0a1f] transition-colors disabled:opacity-50"
                      >
                        {savingBatchId === batch._id ? 'Saving...' : 'Save'}
                      </button>
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

export default BatchTutors;
