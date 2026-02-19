import { useState, useEffect } from 'react';
import { 
  Calendar, 
  BookOpen, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  Archive
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TimetableManagement = () => {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const { user } = useAuth();
  
  const [generateForm, setGenerateForm] = useState({
    department: user?.department || 'BCA',
    semester: 1
  });

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const TIME_SLOTS = [
    '09:30-10:30',  // 1st period
    '10:30-11:20',  // 2nd period
    '11:30-12:30',  // 3rd period (after break)
    '13:30-14:30',  // 4th period (after lunch)
    '14:30-15:30',  // 5th period
  ];

  // Get available semesters (exclude those with existing active/draft timetables)
  const getAvailableSemesters = () => {
    const allSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
    const department = user?.role === 'hod' ? user.department : generateForm.department;
    
    // Get semesters that already have timetables for the selected department
    const existingSemesters = timetables
      .filter(tt => tt.department === department && ['active', 'draft'].includes(tt.status))
      .map(tt => tt.semester);
    
    // Return semesters that don't have timetables yet
    return allSemesters.filter(sem => !existingSemesters.includes(sem));
  };

  useEffect(() => {
    // Set HOD's department as default
    if (user?.role === 'hod' && user?.department) {
      setGenerateForm(prev => ({ ...prev, department: user.department }));
    }
    fetchTimetables();
  }, [user]);

  // Update available semester when department changes or modal opens
  useEffect(() => {
    if (showGenerateModal) {
      const availableSemesters = getAvailableSemesters();
      if (availableSemesters.length > 0 && !availableSemesters.includes(generateForm.semester)) {
        setGenerateForm(prev => ({ ...prev, semester: availableSemesters[0] }));
      }
    }
  }, [showGenerateModal, generateForm.department, timetables]);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const data = await api.timetable.list();
      setTimetables(data.data);
    } catch (error) {
      toast.error('Failed to fetch timetables');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTimetable = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('/api/timetable/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.token.get()}`
        },
        body: JSON.stringify(generateForm)
      });

      if (response.ok) {
        toast.success('Timetable generated successfully!');
        setShowGenerateModal(false);
        fetchTimetables();
        setGenerateForm({ department: 'BCA', semester: 1 });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to generate timetable');
      }
    } catch (error) {
      toast.error('Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const response = await fetch(`/api/timetable/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.token.get()}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success(`Timetable ${status} successfully!`);
        fetchTimetables();
      } else {
        toast.error('Failed to update timetable status');
      }
    } catch (error) {
      toast.error('Failed to update timetable status');
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable?')) {
      return;
    }

    try {
      const response = await fetch(`/api/timetable/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${api.token.get()}`
        }
      });

      if (response.ok) {
        toast.success('Timetable deleted successfully!');
        fetchTimetables();
      } else {
        toast.error('Failed to delete timetable');
      }
    } catch (error) {
      toast.error('Failed to delete timetable');
    }
  };

  const viewTimetable = async (department, semester) => {
    try {
      const response = await fetch(`/api/timetable/${department}/${semester}`, {
        headers: {
          'Authorization': `Bearer ${api.token.get()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTimetable(data.data);
        setShowViewModal(true);
      } else {
        toast.error('Failed to fetch timetable details');
      }
    } catch (error) {
      toast.error('Failed to fetch timetable details');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-yellow-100 text-yellow-800', icon: Edit },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      archived: { color: 'bg-gray-100 text-gray-800', icon: Archive }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderTimetableGrid = (timetable) => {
    if (!timetable || !timetable.timeSlots) return null;

    // Create a grid structure
    const grid = {};
    DAYS.forEach(day => {
      grid[day] = {};
      TIME_SLOTS.forEach(slot => {
        grid[day][slot] = null;
      });
    });

    // Fill the grid with time slots
    timetable.timeSlots.forEach(slot => {
      const timeKey = `${slot.startTime}-${slot.endTime}`;
      if (grid[slot.day] && grid[slot.day].hasOwnProperty(timeKey)) {
        grid[slot.day][timeKey] = slot;
      }
    });

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">
                Time
              </th>
              {DAYS.map(day => (
                <th key={day} className="border border-gray-300 px-4 py-2 text-center font-medium text-gray-900">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(timeSlot => (
              <tr key={timeSlot}>
                <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700 bg-gray-50">
                  {timeSlot}
                </td>
                {DAYS.map(day => {
                  const slot = grid[day][timeSlot];
                  return (
                    <td key={`${day}-${timeSlot}`} className="border border-gray-300 px-2 py-2">
                      {slot ? (
                        <div className={`p-2 rounded text-xs ${
                          slot.subjectType === 'lab' ? 'bg-blue-100 text-blue-800' :
                          slot.subjectType === 'practical' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          <div className="font-medium">{slot.subject?.name}</div>
                          <div className="text-xs mt-1">{slot.teacher?.fullName}</div>
                          <div className="text-xs">{slot.room}</div>
                        </div>
                      ) : (
                        <div className="h-16 flex items-center justify-center text-gray-400">
                          Free
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
          <p className="text-gray-600">Generate and manage class timetables</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Generate Timetable
        </button>
      </div>

      {/* Timetables List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Timetables</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading timetables...</p>
          </div>
        ) : timetables.length === 0 ? (
          <div className="p-6 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No timetables found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department & Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academic Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timetables.map((timetable) => (
                  <tr key={timetable._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BookOpen className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {timetable.department} - Semester {timetable.semester}
                          </div>
                          <div className="text-sm text-gray-500">
                            {timetable.timeSlots?.length || 0} time slots
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {timetable.academicYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(timetable.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {timetable.createdBy?.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewTimetable(timetable.department, timetable.semester)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Timetable"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {timetable.status === 'draft' && (
                          <button
                            onClick={() => handleStatusUpdate(timetable._id, 'active')}
                            className="text-green-600 hover:text-green-900"
                            title="Activate Timetable"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {timetable.status === 'active' && (
                          <button
                            onClick={() => handleStatusUpdate(timetable._id, 'archived')}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Archive Timetable"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteTimetable(timetable._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Timetable"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Timetable Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New Timetable</h3>
            
            {getAvailableSemesters().length === 0 ? (
              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    All semesters already have timetables for {user?.role === 'hod' ? user.department : generateForm.department} department.
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateTimetable}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  {user?.role === 'hod' ? (
                    <input
                      type="text"
                      value={user.department}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={generateForm.department}
                      onChange={(e) => setGenerateForm({...generateForm, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="BCA">BCA</option>
                      <option value="BCom">BCom</option>
                      <option value="BA">BA</option>
                    </select>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={generateForm.semester}
                    onChange={(e) => setGenerateForm({...generateForm, semester: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {getAvailableSemesters().map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* View Timetable Modal */}
      {showViewModal && selectedTimetable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedTimetable.department} - Semester {selectedTimetable.semester} Timetable
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {renderTimetableGrid(selectedTimetable)}
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;