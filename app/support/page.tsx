'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Instagram } from "lucide-react";

interface SupportFormData {
  name: string;
  email: string;
  phoneNumber: string;
  queryType: 'payment' | 'credentials' | 'signals' | 'account' | 'other';
  description: string;
}

export default function SupportPage() {
  const [formData, setFormData] = useState<SupportFormData>({
    name: '',
    email: '',
    phoneNumber: '',
    queryType: 'other',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const queryTypeOptions = [
    { value: 'payment', label: 'Payment Issue' },
    { value: 'credentials', label: 'Lost Credentials' },
    { value: 'signals', label: 'How to Read Signal' },
    { value: 'account', label: 'Account Management' },
    { value: 'other', label: 'Other' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Invalid email address');
      return;
    }

    // Phone validation (basic check)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.error('Invalid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Support request submitted successfully!');
        setFormData({
          name: '',
          email: '',
          phoneNumber: '',
          queryType: 'other',
          description: '',
        });
      } else {
        toast.error('Failed to submit support request');
      }
    } catch (error) {
      console.error('Error submitting support request:', error);
      toast.error('An error occurred while submitting your request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Support Center
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Need help? We&apos;re here to assist you. Fill out the form below and our support team will get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Quick Contact Info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Get in Touch</h2>
              
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6 flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Email</h3>
                    <p className="text-gray-600 dark:text-gray-400">info@readypips.com</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6 flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Response Time</h3>
                    <p className="text-gray-600 dark:text-gray-400">Usually within 24 hours</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardContent className="pt-6 flex items-start space-x-4">
                  <MessageSquare className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Community</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Join our{' '}
                      <a
                        href="https://t.me/tradecafeafrica"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 dark:text-green-400"
                      >
                        Telegram group
                      </a>
                    </p>
                  </div>
                </CardContent>
                
              </Card>
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
  <CardContent className="pt-6 flex items-start space-x-4">
    <Instagram className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
        Instagram
      </h3>

      <p className="text-gray-600 dark:text-gray-400">
        Follow us on{' '}
        <a
          href="https://instagram.com/readypips"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-500 hover:text-pink-600 dark:text-pink-400 font-medium"
        >
          @readypips
        </a>
      </p>

      {/* Optional Button (high conversion) */}
      <a
        href="https://instagram.com/readypips"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition"
      >
        Visit Instagram
      </a>
    </div>
  </CardContent>
</Card>
            </div>

            {/* Support Form */}
            <div>
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="+1234567890"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>

                    {/* Query Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type of Query *
                      </label>
                      <select
                        name="queryType"
                        value={formData.queryType}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                      >
                        {queryTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Please describe your issue in detail..."
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2"
                    >
                      {loading ? 'Submitting...' : 'Submit Support Request'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
