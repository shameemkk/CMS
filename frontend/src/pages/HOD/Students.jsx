import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

const HodStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await api.users.byRole('student');
      setStudents(response.users || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleEdit = (student) => {
    setEditingStudent(student);
    setEditForm({
      fullName: student.fullName,
      email: student.email,
      registrationNumber: student.registrationNumber,
    });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.users.update(editingStudent.id, editForm);
      toast.success('Student updated successfully');
      setEditingStudent(null);
      await loadStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Are you sure you want to delete ${student.fullName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.users.remove(student.id);
      toast.success('Student deleted successfully');
      await loadStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to delete student');
    }
  };

  const filteredStudents = students.filter((student) => {
    const query = searchTerm.toLowerCase();
    return (
      student.fullName.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      (student.registrationNumber || '').toLowerCase().includes(query) ||
      (student.semester?.toString() || '').includes(query)
    );
  });

  // Group students by semester
  const studentsBySemester = filteredStudents.reduce((acc, student) => {
    const sem = student.semester || 'Unknown';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(student);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Students</h1>
          <p className="text-gray-600">Manage and view all students in your department.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, email, registration number, or semester..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
          />
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mb-4 flex gap-2 flex-wrap">
          {Object.keys(studentsBySemester).sort((a, b) => {
            if (a === 'Unknown') return 1;
            if (b === 'Unknown') return -1;
            return Number(a) - Number(b);
          }).map((sem) => (
            <div key={sem} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Semester {sem}: {studentsBySemester[sem].length} student(s)
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reg. Number</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Semester</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Loading students...' : 'No students found.'}
                  </td>
                </tr>
              ) : (
                filteredStudents
                  .sort((a, b) => (a.semester || 0) - (b.semester || 0) || a.fullName.localeCompare(b.fullName))
                  .map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">{student.fullName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 uppercase">{student.registrationNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.department}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Semester {student.semester || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-[#6e0718] hover:text-[#8a0a1f] font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="text-red-600 hover:text-red-800 font-medium"
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

      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#6e0718]">Student Details</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                <p className="text-gray-800 font-medium">{selectedStudent.fullName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <p className="text-gray-800">{selectedStudent.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Registration Number</label>
                <p className="text-gray-800 uppercase">{selectedStudent.registrationNumber || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                <p className="text-gray-800">{selectedStudent.department}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Semester</label>
                <p className="text-gray-800">Semester {selectedStudent.semester || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#6e0718]">Edit Student</h2>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={editForm.fullName || ''}
                    onChange={handleEditChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={editForm.registrationNumber || ''}
                    onChange={handleEditChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718] uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch
                  </label>
                  <input
                    type="text"
                    value={editingStudent.batch || '-'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">Semester is managed at batch level</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodStudents;
