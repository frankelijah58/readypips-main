'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface Tool {
  _id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  accessLevel: string;
  createdAt: string;
}

export default function ToolsManagement({ admin }: { admin: any }) {
  const { toast } = useToast();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    accessLevel: 'free',
    isActive: true
  });

  useEffect(() => {
    fetchTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTools = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/tools', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const toolsList = data.tools || [];
        setTools(toolsList);
        
        // Calculate stats
        const total = toolsList.length;
        const active = toolsList.filter((t: Tool) => t.isActive).length;
        
        setStats({ total, active });
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tools',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTool = () => {
    setEditingTool(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      accessLevel: 'free',
      isActive: true
    });
    setShowModal(true);
  };

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      accessLevel: tool.accessLevel,
      isActive: tool.isActive
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = editingTool 
        ? `/api/admin/tools/${editingTool._id}`
        : '/api/admin/tools';
      
      const method = editingTool ? 'PUT' : 'POST';

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
          description: `Tool ${editingTool ? 'updated' : 'created'} successfully`,
        });
        setShowModal(false);
        fetchTools();
      } else {
        throw new Error('Failed to save tool');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingTool ? 'update' : 'create'} tool`,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/tools/${toolId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Tool deleted successfully',
        });
        fetchTools();
      } else {
        throw new Error('Failed to delete tool');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete tool',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (toolId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/tools/${toolId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Tool ${!currentStatus ? 'activated' : 'deactivated'}`,
        });
        fetchTools();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tool status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBox title="Total Tools" value={stats.total.toString()} />
        <StatBox title="Active Tools" value={stats.active.toString()} />
        <StatBox title="Categories" value={new Set(tools.map(t => t.category)).size.toString()} />
      </div>

      {/* Tool Library */}
      <div className="bg-[#18181b] rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Tool Library</h3>
          <button 
            onClick={handleAddTool}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Add Tool
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-white font-semibold">Tool Name</th>
                <th className="px-4 py-2 text-left text-white font-semibold">Category</th>
                <th className="px-4 py-2 text-left text-white font-semibold">Access Level</th>
                <th className="px-4 py-2 text-left text-white font-semibold">Status</th>
                <th className="px-4 py-2 text-left text-white font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tools.length > 0 ? (
                tools.map((tool) => (
                  <tr key={tool._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-white">{tool.name}</td>
                    <td className="px-4 py-3 text-white/60">{tool.category}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {tool.accessLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(tool._id, tool.isActive)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tool.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {tool.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button 
                        onClick={() => handleEditTool(tool)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteTool(tool._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                    No tools found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#18181b] rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {editingTool ? 'Edit Tool' : 'Add New Tool'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white/60">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tool Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g., Forex Signals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Brief description of the tool"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <Input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                  placeholder="e.g., Trading, Analysis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Level *
                </label>
                <select
                  value={formData.accessLevel}
                  onChange={(e) => setFormData({...formData, accessLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="pro">Pro</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active (visible to users)
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {editingTool ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

