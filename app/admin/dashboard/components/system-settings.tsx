'use client';

import { useState } from 'react';

export default function SystemSettings({ admin }: { admin: any }) {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-[#18181b] rounded-lg shadow border-b border-white/10">
        <div className="flex">
          {[
            { id: 'general', label: 'General Settings' },
            { id: 'payment', label: 'Payment Gateway' },
            { id: 'email', label: 'Email Templates' },
            { id: 'security', label: 'Security & Logs' },
            { id: 'api', label: 'API Keys' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'payment' && <PaymentSettings />}
        {activeTab === 'email' && <EmailSettings />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'api' && <APISettings />}
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="bg-[#18181b] rounded-lg shadow p-6 space-y-6">
      <h3 className="text-lg font-semibold text-white">Platform Settings</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Platform Name</label>
          <input
            type="text"
            defaultValue="ReadyPips"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Support Email</label>
          <input
            type="email"
            defaultValue="support@readypips.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Primary Color</label>
          <input
            type="color"
            defaultValue="#2563eb"
            className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Secondary Color</label>
          <input
            type="color"
            defaultValue="#3b82f6"
            className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Platform Logo</label>
        <div className="border border-gray-300 border-dashed rounded-lg p-6 text-center">
          <p className="text-white/60">Drag and drop logo here or click to browse</p>
          <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
            Choose File
          </button>
        </div>
      </div>

      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
        Save Changes
      </button>
    </div>
  );
}

function PaymentSettings() {
  return (
    <div className="bg-[#18181b] rounded-lg shadow p-6 space-y-6">
      <h3 className="text-lg font-semibold text-white">Payment Gateway Configuration</h3>

      <div className="space-y-6">
        {/* M-Pesa */}
        <div className="border border-white/10 rounded-lg p-4">
          <h4 className="font-medium text-white mb-4">M-Pesa</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Consumer Key"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="Consumer Secret"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stripe */}
        <div className="border border-white/10 rounded-lg p-4">
          <h4 className="font-medium text-white mb-4">Stripe</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="password"
              placeholder="Public Key"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="Secret Key"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* PayPal */}
        <div className="border border-white/10 rounded-lg p-4">
          <h4 className="font-medium text-white mb-4">PayPal</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="password"
              placeholder="Client ID"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="Client Secret"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
        Save Payment Settings
      </button>
    </div>
  );
}

function EmailSettings() {
  return (
    <div className="bg-[#18181b] rounded-lg shadow p-6 space-y-6">
      <h3 className="text-lg font-semibold text-white">Email Templates & Configuration</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">SMTP Server</label>
          <input
            type="text"
            placeholder="smtp.gmail.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">SMTP Port</label>
          <input
            type="text"
            placeholder="587"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">From Email</label>
          <input
            type="email"
            placeholder="noreply@readypips.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <h4 className="font-medium text-white mb-3">Email Templates</h4>
        <div className="space-y-2">
          {['Welcome Email', 'Password Reset', 'Subscription Confirmation', 'Renewal Reminder'].map(
            (template) => (
              <div key={template} className="flex items-center justify-between p-3 border border-white/10 rounded-lg">
                <span className="text-sm text-white">{template}</span>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Edit
                </button>
              </div>
            )
          )}
        </div>
      </div>

      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
        Save Email Settings
      </button>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="bg-[#18181b] rounded-lg shadow p-6 space-y-6">
      <h3 className="text-lg font-semibold text-white">Security & Audit Logs</h3>

      <div className="space-y-4">
        <div className="border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-white">Two-Factor Authentication</span>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </label>
          </div>
          <p className="text-sm text-white/60">Enable 2FA for all admin accounts</p>
        </div>

        <div className="border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-white">Session Timeout</span>
            <select className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>1 hour</option>
            </select>
          </div>
          <p className="text-sm text-white/60">Automatically logout after inactivity</p>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-white mb-3">Admin Activity Logs</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-white">Admin</th>
                <th className="px-4 py-2 text-left font-semibold text-white">Action</th>
                <th className="px-4 py-2 text-left font-semibold text-white">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { admin: 'Admin User', action: 'User created', time: '2 hours ago' },
                { admin: 'Super Admin', action: 'Settings updated', time: '4 hours ago' },
                { admin: 'Moderator', action: 'Subscription ended', time: '6 hours ago' },
              ].map((log, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-white">{log.admin}</td>
                  <td className="px-4 py-2 text-white/60">{log.action}</td>
                  <td className="px-4 py-2 text-gray-500">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function APISettings() {
  return (
    <div className="bg-[#18181b] rounded-lg shadow p-6 space-y-6">
      <h3 className="text-lg font-semibold text-white">API Keys & Integrations</h3>

      <div className="space-y-6">
        {/* TradingView */}
        <div className="border border-white/10 rounded-lg p-4">
          <h4 className="font-medium text-white mb-4">TradingView Integration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="password"
              placeholder="API Key"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="API Secret"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Alpha Vantage */}
        <div className="border border-white/10 rounded-lg p-4">
          <h4 className="font-medium text-white mb-4">Alpha Vantage (Market Data)</h4>
          <input
            type="password"
            placeholder="API Key"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Mailchimp */}
        <div className="border border-white/10 rounded-lg p-4">
          <h4 className="font-medium text-white mb-4">Mailchimp (Email Marketing)</h4>
          <input
            type="password"
            placeholder="API Key"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
        Save API Settings
      </button>
    </div>
  );
}

