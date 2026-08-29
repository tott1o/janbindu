'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/StatusBadge';
import { CategoryBadge } from '@/components/CategoryBadge';
import {
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Eye,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthorityDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('janbindu_token');
    if (!token) return;

    try {
      setLoading(true);
      const [statsRes, issuesRes] = await Promise.all([
        fetch('/api/authority/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/authority/issues', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [statsData, issuesData] = await Promise.all([statsRes.json(), issuesRes.json()]);

      if (statsRes.ok) setStats(statsData);
      if (issuesRes.ok) setIssues(issuesData.issues || []);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusUpdate = async (postId: string, newStatus: string) => {
    const token = localStorage.getItem('janbindu_token');
    try {
      const res = await fetch(`/api/authority/issues/${postId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success('Status updated successfully');
        fetchDashboardData();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading administrative priorities...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Authority Action Portal</h1>
          <p className="text-sm text-gray-500">
            Escalated public priorities sorted by urgency & community impact.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{stats?.totalPosts || 0}</div>
            <div className="text-xs text-gray-500 font-medium">Total Registered</div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-red-600">{stats?.escalatedCount || 0}</div>
            <div className="text-xs text-gray-500 font-medium">Escalated (Score &ge; 50)</div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {stats?.statusCounts?.in_progress || 0}
            </div>
            <div className="text-xs text-gray-500 font-medium">In Progress</div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">
              {stats?.statusCounts?.resolved || 0}
            </div>
            <div className="text-xs text-gray-500 font-medium">Resolved</div>
          </div>
        </div>
      </div>

      {/* Priority Issues Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-extrabold text-base text-gray-900">Prioritized Action Queue</h2>
          <span className="text-xs font-semibold text-gray-500">{issues.length} Issues Listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-gray-500 text-xs uppercase font-bold tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Issue Details</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Update Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 max-w-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <CategoryBadge category={issue.category} />
                    </div>
                    <div className="font-bold text-gray-900 truncate">{issue.title}</div>
                    <div className="text-xs text-gray-500 truncate">{issue.description}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-black text-xs border border-amber-200">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{Math.round(issue.janbinduScore || 0)}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                    {issue.city || 'Local Area'}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={issue.status} />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusUpdate(issue.id, e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="reported">Reported</option>
                      <option value="under_review">Under Review</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/post/${issue.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
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
