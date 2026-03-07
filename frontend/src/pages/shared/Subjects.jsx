import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Subjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    department: user?.role === 'hod' ? user?.department : '',
    semester: '',
    status: 'active',
  });
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [assigningSubject, setAssigningSubject] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: user?.department || 'BCA',
    semester: 1,
    credits: 1,
    hoursPerWeek: 3,
    subjectType: 'theory',
    description: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalHoursPerWeek, setTotalHoursPerWeek] = useState(0);

  const canManage = ['hod', 'admin'].includes(user?.role);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.subjects.list({
        department: filters.department || undefined,
        semester: filters.semester || undefined,
        status: filters.status || undefined,
      });
      setSubjects(response.subjects || []);
      
      // Calculate total hours per week for filtered subjects
      const totalHours = (response.subjects || [])
        .filter(s => s.status === 'active')
        .reduce((sum, subject) => sum + (subject.hoursPerWeek || 0), 0);
      setTotalHoursPerWeek(totalHours);
      
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      // Load both teachers and HODs for assignment
      const [teachersResponse, hodsResponse] = await Promise.all([
        api.users.byRole('teacher'),
        api.users.byRole('hod')
      ]);
      
      // Combine teachers and HODs
      const allTeachers = [
        ...(teachersResponse.users || []),
        ...(hodsResponse.users || []).map(hod => ({
          ...hod,
          fullName: `${hod.fullName} (HOD)` // Add HOD label
        }))
      ];
      
      setTeachers(allTeachers);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.departments.list({ status: 'active' });
      const allDepartments = response.data || [];
      
      // If user is HOD, only show their department
      if (user?.role === 'hod' && user?.department) {
        setDepartments(allDepartments.filter(d => d.code === user.department));
      } else {
        setDepartments(allDepartments);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  useEffect(() => {
    loadSubjects();
    loadTeachers();
    loadDepartments();
  }, [filters.department, filters.semester, filters.status]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      if (editingSubject) {
        await api.subjects.update(editingSubject._id, formData);
        toast.success('Subject updated successfully');
      } else {
        await api.subjects.create(formData);
        toast.success('Subject created successfully');
      }

      await loadSubjects();
      setShowModal(false);
      setEditingSubject(null);
      setFormData({
        name: '',
        code: '',
        department: user?.department || 'BCA',
        semester: 1,
        credits: 1,
        description: '',
        status: 'active',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to save subject');
      setError(err.message || 'Failed to save subject');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      department: subject.department,
      semester: subject.semester,
      credits: subject.credits,
      hoursPerWeek: subject.hoursPerWeek || 3,
      subjectType: subject.subjectType || 'theory',
      description: subject.description || '',
      status: subject.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      setLoading(true);
      await api.subjects.remove(id);
      toast.success('Subject deleted successfully');
      await loadSubjects();
    } catch (err) {
      toast.error(err.message || 'Failed to delete subject');
      setError(err.message || 'Failed to delete subject');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      department: user?.department || 'BCA',
      semester: 1,
      credits: 1,
      hoursPerWeek: 3,
      subjectType: 'theory',
      description: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleAssignTeacher = (subject) => {
    setAssigningSubject(subject);
    setSelectedTeacher(subject.assignedTeacher?._id || subject.assignedTeacher || '');
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async () => {
    try {
      setLoading(true);
      await api.subjects.update(assigningSubject._id, {
        assignedTeacher: selectedTeacher || null
      });
      toast.success('Teacher assigned successfully');
      await loadSubjects();
      setShowAssignModal(false);
      setAssigningSubject(null);
      setSelectedTeacher('');
    } catch (err) {
      toast.error(err.message || 'Failed to assign teacher');
      setError(err.message || 'Failed to assign teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Subjects</h1>
        <p className="text-gray-600">Manage academic subjects and courses.</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
              disabled={user?.role === 'hod'}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d._id} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>
            <select
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            {subjects.length > 0 && filters.semester && (
              <div className="px-4 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-xs text-gray-600">Semester {filters.semester} Hours/Week</p>
                <p className="text-2xl font-bold text-[#6e0718]">{totalHoursPerWeek} / 25</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {((totalHoursPerWeek / 25) * 100).toFixed(0)}% utilized
                </p>
              </div>
            )}
            {canManage && (
              <button
                onClick={handleAddNew}
                className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold"
              >
                Add Subject
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Department</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Semester</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Credits</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Hrs/Week</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Assigned Teacher</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                {canManage && <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 9 : 8} className="px-4 py-8 text-center text-gray-500">
                    Loading subjects...
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 9 : 8} className="px-4 py-8 text-center text-gray-500">
                    No subjects found.
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-800">{subject.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{subject.name}</td>
                    <td className="px-4 py-3 text-gray-600">{subject.department}</td>
                    <td className="px-4 py-3 text-gray-600">{subject.semester}</td>
                    <td className="px-4 py-3 text-gray-600">{subject.credits}</td>
                    <td className="px-4 py-3 text-gray-600 font-semibold">{subject.hoursPerWeek}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {subject.assignedTeacher?.fullName || (
                        <span className="text-gray-400 italic">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${subject.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {subject.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAssignTeacher(subject)}
                            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => handleEdit(subject)}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(subject._id)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
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

      {/* Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-[#6e0718]">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                    placeholder="Enter subject name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                    placeholder="Enter subject code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleFormChange}
                    required
                    disabled={user?.role === 'hod'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {departments.map(d => (
                      <option key={d._id} value={d.code}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester *
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits *
                  </label>
                  <input
                    type="number"
                    name="credits"
                    value={formData.credits}
                    onChange={handleFormChange}
                    required
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hours Per Week *
                  </label>
                  <input
                    type="number"
                    name="hoursPerWeek"
                    value={formData.hoursPerWeek}
                    onChange={handleFormChange}
                    required
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Type *
                  </label>
                  <select
                    name="subjectType"
                    value={formData.subjectType}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  >
                    <option value="theory">Theory</option>
                    <option value="lab">Lab</option>
                    <option value="practical">Practical</option>
                    <option value="minor1">Minor 1</option>
                    <option value="minor2">Minor 2</option>
                    <option value="major">Major</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  placeholder="Enter subject description (optional)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-[#6e0718]">
                Assign Teacher
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-800">{assigningSubject?.name}</p>
                  <p className="text-sm text-gray-600">{assigningSubject?.code}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Teacher
                </label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                >
                  <option value="">-- No Teacher --</option>
                  {teachers
                    .filter(teacher => teacher.department === assigningSubject?.department)
                    .map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName} {teacher.specialization ? `(${teacher.specialization})` : ''}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Showing teachers from {assigningSubject?.department} department. Select a teacher to assign, or choose "No Teacher" to unassign.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignment}
                  disabled={loading}
                  className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Assign Teacher'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;