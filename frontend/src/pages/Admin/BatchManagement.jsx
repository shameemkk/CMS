import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [formData, setFormData] = useState({
    department: '',
    startDate: '',
    endDate: '',
    semester: '',
  });
  const [batchPreview, setBatchPreview] = useState('');

  useEffect(() => {
    loadBatches();
    loadDepartments();
  }, []);

  useEffect(() => {
    if (formData.department && formData.startDate && formData.endDate) {
      const startYear = new Date(formData.startDate).getUTCFullYear();
      const endYearShort = String(new Date(formData.endDate).getUTCFullYear()).slice(-2);
      setBatchPreview(`${formData.department.toUpperCase().trim()}- ${startYear}-${endYearShort}`);
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

  const loadDepartments = async () => {
    try {
      const response = await api.departments.list({ status: 'active' });
      setDepartments(response.data || []);
    } catch {
      setDepartments([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.batches.create(formData);
      setShowModal(false);
      setFormData({
        department: '',
        startDate: '',
        endDate: '',
        semester: '',
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

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setShowEditModal(true);
  };

  const handleUpdateSemester = async (e) => {
    e.preventDefault();
    if (!editingBatch) return;

    try {
      setLoading(true);
      await api.batches.update(editingBatch._id, { semester: parseInt(editingBatch.semester) });
      setShowEditModal(false);
      setEditingBatch(null);
      await loadBatches();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update batch');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

  const getDuration = (batch) => {
    if (batch.startDate && batch.endDate) {
      return `${formatDate(batch.startDate)} - ${formatDate(batch.endDate)}`;
    }
    if (batch.startYear && batch.endYear) {
      return `${batch.startYear} - ${batch.endYear}`;
    }
    return '-';
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
          <span>+</span>
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Semester</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && batches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No batches found. Create your first batch!
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium uppercase">{batch.batchCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 uppercase">{batch.department || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{batch.semester || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getDuration(batch)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          batch.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : batch.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(batch)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(batch._id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  x
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  {departments.length > 0 ? (
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((department) => (
                        <option key={department._id} value={department.code}>
                          {department.code} - {department.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent uppercase"
                      placeholder="e.g., BCA"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent"
                    required
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {batchPreview && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
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
      {showEditModal && editingBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#6e0718]">Edit Batch Semester</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBatch(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdateSemester} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Code
                  </label>
                  <div className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                    {editingBatch.batchCode}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Semester: <span className="font-bold text-[#6e0718]">Semester {editingBatch.semester}</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingBatch.semester}
                    onChange={(e) => setEditingBatch({ ...editingBatch, semester: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6e0718] focus:border-transparent"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Changing the semester will affect all students in this batch.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingBatch(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update'}
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
