import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

const DepartmentManagement = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        status: 'active'
    });

    const [editId, setEditId] = useState(null);

    const loadDepartments = async () => {
        try {
            setLoading(true);
            const res = await api.departments.list();
            setDepartments(res.data || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDepartments();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.departments.update(editId, formData);
                toast.success('Department updated successfully');
            } else {
                await api.departments.create(formData);
                toast.success('Department created successfully');
            }
            setShowForm(false);
            setFormData({ name: '', code: '', description: '', status: 'active' });
            setEditId(null);
            loadDepartments();
        } catch (err) {
            toast.error(err.message || 'Failed to save department');
            setError(err.message || 'Failed to save department');
        }
    };

    const handleEdit = (dept) => {
        setFormData({
            name: dept.name,
            code: dept.code,
            description: dept.description || '',
            status: dept.status
        });
        setEditId(dept._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            try {
                await api.departments.remove(id);
                toast.success('Department deleted successfully');
                loadDepartments();
            } catch (err) {
                toast.error(err.message || 'Failed to delete department');
                setError(err.message || 'Failed to delete department');
            }
        }
    };

    if (loading && departments.length === 0) {
        return <div className="p-4">Loading departments...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[#6e0718]">Departments</h2>
                    <p className="text-gray-600">Manage college departments</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ name: '', code: '', description: '', status: 'active' });
                        setEditId(null);
                        setShowForm(!showForm);
                    }}
                    className="bg-[#6e0718] text-white px-4 py-2 rounded-lg hover:bg-[#8a0a1f]"
                >
                    {showForm ? 'Cancel' : 'Add Department'}
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4">{editId ? 'Edit Department' : 'New Department'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full border p-2 rounded"
                                    placeholder="e.g. Computer Application"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    required
                                    className="w-full border p-2 rounded"
                                    placeholder="e.g. BCA"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full border p-2 rounded h-24"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full border p-2 rounded"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                className="bg-[#6e0718] text-white px-6 py-2 rounded-lg hover:bg-[#8a0a1f]"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {departments.map((dept) => (
                            <tr key={dept._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{dept.code}</td>
                                <td className="px-6 py-4">{dept.name}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${dept.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {dept.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleEdit(dept)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(dept._id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DepartmentManagement;
