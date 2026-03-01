import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

const MinorMajorManagement = () => {
  const [configs, setConfigs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    department: '',
    subjectType: 'minor',
    prioritySlot: 1,
    description: '',
    isActive: true
  });

  const timeSlots = [
    { value: 1, label: '1st Period (09:30-10:30)' },
    { value: 2, label: '2nd Period (10:30-11:20)' },
    { value: 3, label: '3rd Period (11:30-12:30)' },
    { value: 4, label: '4th Period (13:30-14:30)' },
    { value: 5, label: '5th Period (14:30-15:30)' }
  ];

  useEffect(() => {
    fetchConfigs();
    fetchDepartments();
  }, []);

  useEffect(() => {
    console.log('Departments loaded:', departments);
  }, [departments]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.minorMajor.list();
      setConfigs(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch configurations');
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const response = await api.departments.list();
      console.log('Departments response:', response);
      
      // Department controller returns { success: true, data: [...] }
      const depts = response.data || [];
      setDepartments(depts);
      
      if (depts.length === 0) {
        console.warn('No departments returned from API');
        // Fallback to known departments if API returns empty
        setDepartments([
          { code: 'BCA', name: 'Computer Application' },
          { code: 'BCOM', name: 'Commerce' },
          { code: 'BA', name: 'Arts' },
          { code: 'BSC', name: 'Science' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
      
      // Fallback to known departments on error
      setDepartments([
        { code: 'BCA', name: 'Computer Application' },
        { code: 'BCOM', name: 'Commerce' },
        { code: 'BA', name: 'Arts' },
        { code: 'BSC', name: 'Science' }
      ]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingConfig) {
        await api.minorMajor.update(editingConfig._id, formData);
        toast.success('Configuration updated successfully');
      } else {
        await api.minorMajor.create(formData);
        toast.success('Configuration created successfully');
      }
      
      handleCloseModal();
      fetchConfigs();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      department: config.department,
      subjectType: config.subjectType,
      prioritySlot: config.prioritySlot,
      description: config.description || '',
      isActive: config.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      await api.minorMajor.remove(id);
      toast.success('Configuration deleted successfully');
      fetchConfigs();
    } catch (error) {
      toast.error(error.message || 'Failed to delete configuration');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.minorMajor.toggle(id);
      toast.success('Status updated successfully');
      fetchConfigs();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConfig(null);
    setFormData({
      department: '',
      subjectType: 'minor',
      prioritySlot: 1,
      description: '',
      isActive: true
    });
  };

  const getSlotLabel = (slotNumber) => {
    const slot = timeSlots.find(s => s.value === slotNumber);
    return slot ? slot.label : `Slot ${slotNumber}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Minor/Major Configuration</h1>
          <p className="text-gray-600">Manage department-specific minor and major subject priority slots</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#6e0718] text-white px-4 py-2 rounded-lg hover:bg-[#8a0a1f] transition-colors"
        >
          <Plus size={20} />
          Add Configuration
        </button>
      </div>

      {/* Configurations Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority Slot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Loading configurations...
                  </td>
                </tr>
              ) : configs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No configurations found
                  </td>
                </tr>
              ) : (
                configs.map((config) => (
                  <tr key={config._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {config.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        config.subjectType === 'minor' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {config.subjectType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getSlotLabel(config.prioritySlot)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {config.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        config.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {config.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(config._id)}
                          className={`p-1 rounded ${
                            config.isActive 
                              ? 'text-red-600 hover:text-red-800' 
                              : 'text-green-600 hover:text-green-800'
                          }`}
                          title={config.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {config.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleEdit(config)}
                          className="text-[#6e0718] hover:text-[#8a0a1f] p-1 rounded"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(config._id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#6e0718]">
                {editingConfig ? 'Edit Configuration' : 'Add Configuration'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  disabled={departmentsLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718] disabled:bg-gray-100"
                >
                  <option value="">
                    {departmentsLoading ? 'Loading departments...' : 'Select Department'}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.code || dept._id} value={dept.code}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {departments.length === 0 && !departmentsLoading && (
                  <p className="text-sm text-red-600 mt-1">No departments found. Please add departments first.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Type *
                </label>
                <select
                  value={formData.subjectType}
                  onChange={(e) => setFormData({ ...formData, subjectType: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                >
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Slot *
                </label>
                <select
                  value={formData.prioritySlot}
                  onChange={(e) => setFormData({ ...formData, prioritySlot: parseInt(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-[#6e0718] focus:ring-[#6e0718] border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinorMajorManagement;