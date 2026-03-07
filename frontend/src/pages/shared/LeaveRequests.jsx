import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LeaveRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canReview = useMemo(() => ['hod', 'admin'].includes(user?.role), [user?.role]);
  const canDelete = (request) => {
    if (user?.role === 'admin') return true;
    return request.requestedBy?._id === user?.id;
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.leaveRequests.list();
      setRequests(response.leaveRequests || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    if (!startDate) {
      toast.error('Start date is required');
      return;
    }
    if (!endDate) {
      toast.error('End date is required');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date must be after or equal to start date');
      return;
    }
    try {
      setLoading(true);
      await api.leaveRequests.create({ 
        reason: reason.trim(),
        startDate,
        endDate
      });
      toast.success('Leave request submitted successfully');
      setReason('');
      setStartDate('');
      setEndDate('');
      setError('');
      loadRequests();
    } catch (err) {
      toast.error(err.message || 'Failed to submit leave request');
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this leave request?')) return;
    try {
      setLoading(true);
      await api.leaveRequests.remove(id);
      toast.success('Leave request deleted');
      loadRequests();
    } catch (err) {
      toast.error(err.message || 'Failed to delete leave request');
      setError(err.message || 'Failed to delete leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      setLoading(true);
      await api.leaveRequests.updateStatus(id, { status });
      toast.success(`Leave request ${status}`);
      loadRequests();
    } catch (err) {
      toast.error(err.message || 'Failed to update leave request');
      setError(err.message || 'Failed to update leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#6e0718] mb-2">Leave Requests</h1>
        <p className="text-gray-600">Submit and track leave requests.</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">New Leave Request</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="3"
              placeholder="Reason for leave..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e0718]"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#6e0718] text-white rounded-lg hover:bg-[#8a0a1f] transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-[#6e0718] mb-4">Requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Requested By</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Start Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">End Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Days</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Loading requests...' : 'No leave requests found.'}
                  </td>
                </tr>
              ) : (
                requests.map((request) => {
                  const startDate = request.startDate ? new Date(request.startDate) : null;
                  const endDate = request.endDate ? new Date(request.endDate) : null;
                  const days = startDate && endDate 
                    ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 
                    : '-';
                  
                  return (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {request.requestedBy?.fullName || 'Me'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{request.role}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {startDate ? startDate.toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {endDate ? endDate.toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {days} {days === 1 ? 'day' : 'days'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={request.reason}>
                        {request.reason}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          {canReview && request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatus(request._id, 'approved')}
                                className="text-green-600 hover:text-green-800 font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatus(request._id, 'rejected')}
                                className="text-red-500 hover:text-red-700 font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {canDelete(request) && (
                            <button
                              onClick={() => handleDelete(request._id)}
                              className="text-gray-600 hover:text-gray-800 font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequests;

