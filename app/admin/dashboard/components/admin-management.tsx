'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Admin {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export default function AdminManagement({ admin: currentAdmin }: { admin: any }) {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'admin',
    password: '',
  });

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admins',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/admin/admins/${editingId}`
        : '/api/admin/admins';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingId
            ? 'Admin updated successfully'
            : 'Admin created successfully',
        });
        setShowForm(false);
        setEditingId(null);
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'admin',
          password: '',
        });
        fetchAdmins();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save admin',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving admin:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while saving',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (adminId: string) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Admin deleted successfully',
        });
        fetchAdmins();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete admin',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
    }
  };

  const canCreateAdmin =
    currentAdmin?.permissions?.includes('create_admin');
  const canEditAdmin = currentAdmin?.permissions?.includes('edit_admin');
  const canDeleteAdmin = currentAdmin?.permissions?.includes('delete_admin');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Admin Button */}
      {canCreateAdmin && (
        <div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                email: '',
                firstName: '',
                lastName: '',
                role: 'admin',
                password: '',
              });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add New Admin'}
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && canCreateAdmin && (
        <div className="bg-[#18181b] rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Admin' : 'Create New Admin'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                {currentAdmin?.role === 'super_admin' && (
                  <option value="super_admin">Super Admin</option>
                )}
              </select>
              {!editingId && (
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!editingId}
                  minLength={8}
                />
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins List */}
      <div className="bg-[#18181b] rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-white">
                    {a.firstName} {a.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60">{a.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {a.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        a.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {a.lastLogin
                      ? new Date(a.lastLogin).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {canEditAdmin && currentAdmin._id !== a._id && (
                      <button
                        onClick={() => {
                          setEditingId(a._id);
                          setShowForm(true);
                          // Load existing data
                          setFormData({
                            email: a.email,
                            firstName: a.firstName,
                            lastName: a.lastName,
                            role: a.role,
                            password: '',
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                    )}
                    {canDeleteAdmin && currentAdmin._id !== a._id && (
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

