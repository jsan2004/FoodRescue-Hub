import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CountdownBadge from '../components/CountdownBadge';
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  Package, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  Flame, 
  BarChart3,
  Calendar,
  Filter,
  Check,
  X
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'ngos', 'donations', 'users'
  const [analytics, setAnalytics] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [donations, setDonations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Donation filter
  const [statusFilter, setStatusFilter] = useState('');

  const loadAll = async () => {
    try {
      setLoading(true);
      const [analyticsRes, ngosRes, donRes, usersRes] = await Promise.all([
        api.getAnalyticsAdmin(),
        api.getNgosAdmin(),
        api.getAllDonationsAdmin({ status: statusFilter }),
        api.getUsersAdmin()
      ]);

      setAnalytics(analyticsRes);
      setNgos(ngosRes.ngos || []);
      setDonations(donRes.donations || []);
      setUsersList(usersRes.users || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [statusFilter]);

  const handleVerifyNgo = async (ngoId, status) => {
    try {
      await api.verifyNgo(ngoId, status);
      setMessage(`NGO status updated to ${status === 1 ? 'Approved' : 'Rejected'}!`);
      loadAll();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const pendingNgos = ngos.filter(n => n.verified === 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Administrator Control Center</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase">
              Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global governance, NGO identity verification, donation audit, and sustainability impact reports
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Impact Analytics
          </button>
          <button
            onClick={() => setActiveTab('ngos')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap relative ${
              activeTab === 'ngos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            NGO Verifications
            {pendingNgos.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('donations')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'donations' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            All Donations ({donations.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Users Directory
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* KPI STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 my-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl font-black text-slate-900">{analytics?.summary?.totalDonations || 0}</div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Total Listed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl font-black text-emerald-600">{analytics?.summary?.deliveredCount || 0}</div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Delivered Successfully</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl font-black text-teal-600">{analytics?.summary?.beneficiariesTotal || 0}</div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Beneficiaries Fed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl font-black text-rose-600">{analytics?.summary?.expiredCount || 0}</div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Expired Unclaimed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-2xl font-black text-purple-600">{analytics?.summary?.wasteDiversionRate || 0}%</div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Waste Diversion Rate</div>
        </div>
      </div>

      {/* TAB 1: ANALYTICS & REPORTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Category Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Donations by Food Category
              </h3>

              <div className="space-y-3">
                {analytics?.foodTypeBreakdown?.map((cat) => {
                  const pct = Math.round((cat.count / (analytics.summary.totalDonations || 1)) * 100);
                  return (
                    <div key={cat.food_type} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{cat.food_type}</span>
                        <span>{cat.count} listings ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NGO Performance Leaderboard */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Partner NGO Distribution Leaderboard
              </h3>

              <div className="space-y-3">
                {analytics?.ngoStats?.map((n) => (
                  <div key={n.ngo_name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{n.ngo_name}</div>
                      <div className="text-slate-400 text-[10px]">{n.city} • {n.total_claimed} total claims</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700">{n.total_beneficiaries || 0} fed</div>
                      <div className="text-slate-500 text-[10px]">{n.delivered_count || 0} completed</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Audit Trail Activity Log */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Live System Activity & Audit Trail
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {analytics?.recentActivity?.map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold uppercase">
                        {log.action}
                      </span>
                      {log.user_name && (
                        <span className="font-semibold text-slate-800">{log.user_name} ({log.user_role})</span>
                      )}
                    </div>
                    <p className="text-slate-600">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {log.timestamp?.slice(11, 19)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NGO VERIFICATIONS */}
      {activeTab === 'ngos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Registered NGO Verification Requests ({ngos.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ngos.map((ngo) => (
              <div key={ngo.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{ngo.ngo_name}</h3>
                      <p className="text-xs text-slate-500">Contact: {ngo.contact_person} ({ngo.email})</p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      ngo.verified === 1 ? 'bg-emerald-100 text-emerald-800' :
                      ngo.verified === -1 ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {ngo.verified === 1 ? 'Approved' : ngo.verified === -1 ? 'Rejected' : 'Pending Verification'}
                    </span>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                    <div>Registration / Charity #: <strong>{ngo.registration_number || 'N/A'}</strong></div>
                    <div>HQ Address: {ngo.address}, {ngo.city}</div>
                    <div>Phone: {ngo.phone || 'N/A'}</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  {ngo.verified !== 1 && (
                    <button
                      onClick={() => handleVerifyNgo(ngo.id, 1)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve NGO</span>
                    </button>
                  )}

                  {ngo.verified !== -1 && (
                    <button
                      onClick={() => handleVerifyNgo(ngo.id, -1)}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ALL DONATIONS AUDIT */}
      {activeTab === 'donations' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700 uppercase">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium bg-slate-50"
              >
                <option value="">All Statuses</option>
                <option value="posted">Posted (Unclaimed)</option>
                <option value="accepted">Accepted</option>
                <option value="assigned">Volunteer Assigned</option>
                <option value="picked_up">Picked Up</option>
                <option value="delivered">Delivered</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <span className="text-xs text-slate-400">Total matching: <strong>{donations.length}</strong></span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Food Item</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Donor</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Claimed By</th>
                    <th className="px-4 py-3">Urgency / Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-slate-400">#{d.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{d.food_name}</div>
                        <div className="text-[10px] text-slate-500">{d.food_type}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{d.quantity} {d.quantity_unit}</td>
                      <td className="px-4 py-3 text-slate-700">{d.donor_name}</td>
                      <td className="px-4 py-3 text-slate-600">{d.city}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          d.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          d.status === 'expired' ? 'bg-slate-100 text-slate-600' :
                          d.status === 'posted' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{d.ngo_name || '—'}</td>
                      <td className="px-4 py-3">
                        <CountdownBadge expiryDateTime={d.expiry_datetime} status={d.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-slate-400">USR-{u.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'ngo' ? 'bg-emerald-100 text-emerald-800' :
                        u.role === 'donor' ? 'bg-amber-100 text-amber-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{u.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
