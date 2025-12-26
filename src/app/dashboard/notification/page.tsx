'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Mail, Phone, MapPin, Book, User, Loader } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  course: string;
  state: string;
  message: string;
  termsAccepted: boolean;
  status: 'new' | 'contacted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: Inquiry[];
}

const NotificationPage = () => {
   const { token } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'contacted' | 'rejected'>('all');

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    setError('');
    try {
      // const token = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2OTJlYzU5NDliZjAyYWIwODJiOGIyODYiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImlhdCI6MTc2NjczNzE2NSwiaXNzIjoiaWlmYiIsImF1ZCI6ImlpZmItYXVkaWVuY2UiLCJleHAiOjE3NjY5OTYzNjV9.tS421n-I4X912B42Jj7zQaLM_UjRU99CVGphy_Arvqc";

      const response = await fetch(
        'https://ifbb-1.onrender.com/api/admin/course-inquiries',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          mode: 'cors',
          credentials: 'include',
        }
      );

      const data: ApiResponse = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setInquiries(data.data);
        setError('');
      } else {
        setError('Failed to load inquiries');
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'contacted':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="w-4 h-4" />;
      case 'contacted':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredInquiries =
    filterStatus === 'all'
      ? inquiries
      : inquiries.filter((inquiry) => inquiry.status === filterStatus);

  const statusCounts = {
    all: inquiries.length,
    new: inquiries.filter((i) => i.status === 'new').length,
    contacted: inquiries.filter((i) => i.status === 'contacted').length,
    rejected: inquiries.filter((i) => i.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-12 h-12 text-[#2424B9] animate-spin" />
          <p className="text-lg font-medium text-slate-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Notifications</h1>
          <p className="text-slate-600">Manage course inquiry submissions and track their status</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={fetchInquiries}
              className="ml-auto text-red-700 font-semibold hover:text-red-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(['all', 'new', 'contacted', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === status
                  ? 'bg-[#2424B9] text-white shadow-lg'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-[#2424B9] hover:text-[#2424B9]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-2 font-bold">({statusCounts[status]})</span>
            </button>
          ))}
        </div>

        {/* No Data Message */}
        {filteredInquiries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No inquiries found</p>
          </div>
        ) : (
          <>
            {/* Desktop View - Grid */}
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {filteredInquiries.map((inquiry) => (
                <div
                  key={inquiry._id}
                  onClick={() => setSelectedInquiry(inquiry)}
                  className="bg-white rounded-lg border border-slate-200 hover:shadow-lg hover:border-[#2424B9] transition-all cursor-pointer overflow-hidden"
                >
                  <div className={`h-2 ${getStatusColor(inquiry.status).split(' ')[0]}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900">{inquiry.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {formatDate(inquiry.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${getStatusColor(
                          inquiry.status
                        )}`}
                      >
                        {getStatusIcon(inquiry.status)}
                        <span>{inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}</span>
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-slate-600">
                        <Mail className="w-4 h-4 text-[#2424B9]" />
                        <span className="text-sm truncate">{inquiry.email}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-slate-600">
                        <Phone className="w-4 h-4 text-[#2424B9]" />
                        <span className="text-sm">{inquiry.phone}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-slate-600">
                        <Book className="w-4 h-4 text-[#2424B9]" />
                        <span className="text-sm truncate">{inquiry.course}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-slate-600">
                        <MapPin className="w-4 h-4 text-[#2424B9]" />
                        <span className="text-sm">{inquiry.state}</span>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-600 line-clamp-2">{inquiry.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View - List */}
            <div className="md:hidden space-y-4 mb-8">
              {filteredInquiries.map((inquiry) => (
                <div
                  key={inquiry._id}
                  onClick={() => setSelectedInquiry(inquiry)}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className={`h-1 ${getStatusColor(inquiry.status).split(' ')[0]}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{inquiry.name}</h3>
                        <p className="text-xs text-slate-500">{formatDate(inquiry.createdAt)}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold border flex items-center space-x-1 ${getStatusColor(
                          inquiry.status
                        )}`}
                      >
                        {getStatusIcon(inquiry.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{inquiry.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Detail Modal */}
        {selectedInquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className={`h-1 ${getStatusColor(selectedInquiry.status).split(' ')[0]}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedInquiry.name}</h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Submitted: {formatDate(selectedInquiry.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedInquiry(null)}
                    className="text-slate-500 hover:text-slate-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div
                  className={`mb-6 px-4 py-2 rounded-lg border font-semibold flex items-center space-x-2 w-fit ${getStatusColor(
                    selectedInquiry.status
                  )}`}
                >
                  {getStatusIcon(selectedInquiry.status)}
                  <span>{selectedInquiry.status.charAt(0).toUpperCase() + selectedInquiry.status.slice(1)}</span>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Mail className="w-4 h-4 text-[#2424B9]" />
                        <p className="text-slate-900 break-all">{selectedInquiry.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Phone</label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Phone className="w-4 h-4 text-[#2424B9]" />
                        <p className="text-slate-900">{selectedInquiry.phone}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Course</label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Book className="w-4 h-4 text-[#2424B9]" />
                        <p className="text-slate-900">{selectedInquiry.course}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">State</label>
                      <div className="flex items-center space-x-2 mt-2">
                        <MapPin className="w-4 h-4 text-[#2424B9]" />
                        <p className="text-slate-900">{selectedInquiry.state}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Date of Birth</label>
                      <p className="text-slate-900 mt-2">
                        {new Date(selectedInquiry.dob).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">ID</label>
                      <p className="text-slate-600 text-sm mt-2 font-mono">{selectedInquiry._id}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Message</label>
                    <p className="text-slate-900 mt-2 bg-slate-50 p-4 rounded-lg">{selectedInquiry.message}</p>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-slate-600">
                      Terms and Conditions {selectedInquiry.termsAccepted ? 'Accepted' : 'Not Accepted'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="mt-6 w-full bg-[#2424B9] hover:bg-blue-800 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;