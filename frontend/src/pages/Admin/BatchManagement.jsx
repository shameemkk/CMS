import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    prefix: 'SFA',
    letter: '',
    courseCode: '',
    courseName: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 3,
  });
  const [batchPreview, setBatchPreview] = useState('');

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    // Update preview whenever form data changes
    if (formData.prefix && formData.letter && formData.courseCode && formData.startYear && formData.endYear) {
      setBatchPreview(`${formData.prefix.toUpperCase()}${formData.letter.toUpperCase()}_${formData.courseCode.toUpperCase()} (${formData.startYear}-${formData.endYear})`);
    } else {
      setBatchPreview('');
    }
  }, [formData]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const response = await api.batches.list();
      setBatches(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.batches.create(formData);
      setShowModal(false);
      setFormData({
        prefix: 'SFA',
        letter: '',
        courseCode: '',
        courseName: '',
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 3,
      });
      await loadBatches();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    
    try {
      setLoading(true);
      await api.batches.remove(id);
      await loadBatches();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Batch Management</h1>
          <p className="text-gray-600">Create and manage student batches.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#6e0718] text-white px-6 py-3 rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold flex items-center gap-2"
        >
          <span>➕</span>
          <span>Create Batch</span>
        </button>
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Batch Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Course Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && batches.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No batches found. Create your first batch!
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium uppercase">{batch.batchCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{batch.courseName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{batch.startYear} - {batch.endYear}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        batch.status === 'active' ? 'bg-green-100 text-green-800' :
                        batch.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDelete(batch._id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Batch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#6e0718]">Create Batch</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prefix
                  </label>
                  <input
                    type="text"
                    name="prefix"
                    value={formData.prefix}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Letter <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="letter"
                    value={formData.letter}
                    onChange={handleInputChange}
                    maxLength="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="courseCode"
                    value={formData.courseCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent uppercase"
                    placeholder="e.g., BCA"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent"
                    placeholder="e.g., Bachelor of Computer Application"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="startYear"
                      value={formData.startYear}
                      onChange={handleInputChange}
                      min="2000"
                      max="2100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="endYear"
                      value={formData.endYear}
                      onChange={handleInputChange}
                      min="2000"
                      max="2100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {batchPreview && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview
                    </label>
                    <div className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                      {batchPreview}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;
