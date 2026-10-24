import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CountdownBadge from '../components/CountdownBadge';
import { 
  Bike, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle, 
  Truck, 
  PackageCheck, 
  Award, 
  AlertCircle,
  Building2,
  X,
  IndianRupee,
  Navigation,
  ExternalLink,
  Wallet,
  Calendar,
  Check,
  Edit2,
  Save,
  Route,
  Compass,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  User,
  Mail
} from 'lucide-react';

export default function VolunteerDashboard() {
  const { user, updateProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'tasks'); // 'tasks', 'profile', 'history'
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Complete delivery modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Turn-by-Turn GPS Tracking modal
  const [trackingTask, setTrackingTask] = useState(null);

  // Full Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    phone: '',
    city: 'Bengaluru',
    preferred_areas: '',
    upi_id: 'volunteer@upi',
    availability_status: 'available'
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Quick UPI Editing State (inline)
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');
  const [updatingUpi, setUpdatingUpi] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getVolunteerTasks();
      setTasks(res.tasks || []);
      setProfile(res.profile || {});
      setNewUpiId(res.profile?.upi_id || 'volunteer@upi');
    } catch (err) {
      console.error('Error loading volunteer tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleMarkPickedUp = async (donationId) => {
    try {
      await api.updateVolunteerTaskStatus({
        donation_id: donationId,
        status: 'picked_up',
        notes: 'Food collected by volunteer from donor.'
      });
      setMessage('Status updated: Food marked as Picked Up! Delivery in transit.');
      loadTasks();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSubmitting(true);
    try {
      const res = await api.updateVolunteerTaskStatus({
        donation_id: selectedTask.donation_id,
        status: 'delivered',
        beneficiaries_served: parseInt(beneficiaries, 10) || 0,
        notes: notes || 'Delivered to NGO destination.'
      });

      setSelectedTask(null);
      setBeneficiaries('');
      setNotes('');
      setMessage(`🎉 Awesome job! Delivery confirmed. ₹${selectedTask.payout_amount || 250} credited to your UPI ID and +1.5 hours added to profile!`);
      loadTasks();
      setTimeout(() => setMessage(''), 6000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (newStatus) => {
    try {
      await api.updateVolunteerAvailability({ status: newStatus });
      setProfile(prev => ({ ...prev, availability_status: newStatus }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveUpi = async (e) => {
    e.preventDefault();
    if (!newUpiId.trim()) return;

    setUpdatingUpi(true);
    try {
      const res = await api.updateVolunteerProfile({ upi_id: newUpiId.trim() });
      setProfile(prev => ({ ...prev, upi_id: newUpiId.trim() }));
      setIsEditingUpi(false);
      setMessage('UPI Payout ID successfully updated!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update UPI ID');
    } finally {
      setUpdatingUpi(false);
    }
  };

  const handleOpenEditProfile = () => {
    setProfileFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      city: user?.city || 'Bengaluru',
      preferred_areas: profile?.preferred_areas || '',
      upi_id: profile?.upi_id || 'volunteer@upi',
      availability_status: profile?.availability_status || 'available'
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profileFormData);
      setProfile(prev => ({
        ...prev,
        upi_id: profileFormData.upi_id,
        preferred_areas: profileFormData.preferred_areas,
        availability_status: profileFormData.availability_status
      }));
      setNewUpiId(profileFormData.upi_id);
      setIsEditingProfile(false);
      setMessage('Profile information successfully updated!');
      loadTasks();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const activeTasks = tasks.filter(t => ['assigned', 'picked_up'].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === 'delivered');

  // Compute calculated total earnings from all completed tasks
  const calculatedTotalEarnings = completedTasks.reduce((sum, t) => sum + (t.payout_amount || 250.0), 0);
  const totalEarningsDisplay = Math.max(profile?.total_earnings || 0, calculatedTotalEarnings);

  // Generate Google Maps URL
  const getGoogleMapsUrl = (task) => {
    const origin = encodeURIComponent(`${task.pickup_location}, ${task.city}`);
    const destination = encodeURIComponent(`${task.ngo_address}, ${task.ngo_city}`);
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900">Volunteer Dispatch & Earnings Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase">
              Volunteer
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <MapPin className="w-3 h-3 text-rose-500" />
              {user?.city || 'Bengaluru'} Zone
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Logged in as <strong>{user?.name}</strong> • Food pickup, turn-by-turn route tracking, and ₹250/delivery compensation
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <span className="text-slate-500 pl-2">Status:</span>
          <button
            onClick={() => handleToggleAvailability('available')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              profile?.availability_status === 'available'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Available
          </button>
          <button
            onClick={() => handleToggleAvailability('busy')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              profile?.availability_status === 'busy'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Busy
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mt-6 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Active Deliveries ({activeTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Volunteer Profile & Earnings (₹{totalEarningsDisplay.toLocaleString('en-IN')})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Mission Log ({completedTasks.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE DELIVERIES & GPS NAVIGATION */}
      {/* ========================================================================= */}
      {activeTab === 'tasks' && (
        <div className="my-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-600" />
                Active Missions & GPS Navigation
              </h2>
              <p className="text-xs text-slate-500">
                Turn-by-turn route tracking from donor pickup to shelter delivery with ₹250 compensation.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              ₹250 Payout / Completed Delivery
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading assigned tasks...</div>
          ) : activeTasks.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 shadow-xs">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <p className="text-base font-bold text-slate-800">No Pending Deliveries</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                You are currently marked as {profile?.availability_status}. When a verified NGO in {user?.city || 'Bengaluru'} assigns a pickup mission to you, it will appear here with instant GPS navigation.
              </p>
              <button
                onClick={() => setActiveTab('profile')}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Earnings & Past Work</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeTasks.map((task) => (
                <div key={task.assignment_id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    {/* Top status bar */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                            {task.food_type}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase border border-emerald-200">
                            Stipend: ₹{task.payout_amount || 250}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-1.5">{task.food_name}</h3>
                        <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                          Quantity: {task.quantity} {task.quantity_unit}
                        </p>
                      </div>

                      <CountdownBadge 
                        expiryDateTime={task.expiry_datetime} 
                        status={task.status} 
                      />
                    </div>

                    {/* Visual Route Corridor Card */}
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-sky-50/40 border border-slate-200/90 rounded-2xl mb-4 space-y-4">
                      
                      {/* Step 1: Donor Pickup */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                          1
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-900 text-[11px] uppercase tracking-wide">
                              Pickup: Donor Kitchen
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">Point A</span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm mt-0.5">{task.donor_name}</div>
                          <div className="text-slate-600 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span>{task.pickup_location}, {task.city}</span>
                          </div>
                          {task.donor_phone && (
                            <a 
                              href={`tel:${task.donor_phone}`}
                              className="inline-flex items-center gap-1.5 mt-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call Donor: {task.donor_phone}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Route Path Indicator Line */}
                      <div className="ml-4 pl-4 border-l-2 border-dashed border-sky-300 py-1 text-[11px] text-sky-700 font-semibold flex items-center gap-2">
                        <Route className="w-3.5 h-3.5 text-sky-600" />
                        <span>Transit Corridor (~3.8 km • Approx. 14 mins driving)</span>
                      </div>

                      {/* Step 2: NGO Shelter Drop-off */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                          2
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wide">
                              Drop-off: NGO Shelter
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">Point B</span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm mt-0.5">{task.ngo_name}</div>
                          <div className="text-slate-600 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{task.ngo_address}, {task.ngo_city}</span>
                          </div>
                          {task.delivery_notes && (
                            <div className="mt-1 text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                              <em>Handoff Notes:</em> "{task.delivery_notes}"
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Turn-by-Turn GPS Navigation Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
                      <button
                        onClick={() => setTrackingTask(task)}
                        className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Compass className="w-4 h-4 text-sky-400" />
                        <span>View Turn-by-Turn Route</span>
                      </button>

                      <a
                        href={getGoogleMapsUrl(task)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <Navigation className="w-4 h-4 text-sky-600" />
                        <span>Open in Google Maps</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="pt-4 border-t border-slate-100">
                    {task.status === 'assigned' && (
                      <button
                        onClick={() => handleMarkPickedUp(task.donation_id)}
                        className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Step 1: Confirm Food Collected from Donor</span>
                      </button>
                    )}

                    {task.status === 'picked_up' && (
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Step 2: Confirm Delivery & Claim ₹{task.payout_amount || 250} Payout</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VOLUNTEER PROFILE & EARNINGS BREAKDOWN */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="my-6 space-y-6">
          
          {/* Volunteer Profile & Verification Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-black text-xl shadow-inner">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{user?.name}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      Verified Dispatcher
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {user?.email} • {user?.phone || 'No phone recorded'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      Active City Zone: <strong>{user?.city || 'Bengaluru'}</strong>
                    </span>
                    <span className="text-xs text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-700/40">
                      Rate: ₹250 / delivery
                    </span>
                    <button
                      onClick={handleOpenEditProfile}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Profile Info</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Instant Earnings Counter */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-right min-w-[200px]">
                <div className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold">
                  Total Accumulated Earnings
                </div>
                <div className="text-3xl font-black text-white mt-1 flex items-center justify-end gap-1">
                  <IndianRupee className="w-6 h-6 text-emerald-400" />
                  <span>{totalEarningsDisplay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-end gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Settled via UPI ({profile?.upi_id || 'volunteer@upi'})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Volunteer Personal & Contact Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Volunteer Personal & Operational Profile</h3>
                  <p className="text-xs text-slate-500">
                    Your contact information and operating city zone used for local food rescue assignments.
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenEditProfile}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Edit Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volunteer Full Name</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{user?.name}</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Email</div>
                <div className="text-sm font-mono text-slate-700 mt-0.5 truncate">{user?.email}</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone Number</div>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">{user?.phone || 'Not recorded'}</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operating City Zone</div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {user?.city || 'Bengaluru'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preferred Local Neighborhoods</div>
                <div className="text-xs font-medium text-slate-800 mt-0.5">{profile?.preferred_areas || user?.city || 'All metropolitan zones'}</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Availability & Payout ID</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-2">
                  <span className="capitalize px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px]">
                    {profile?.availability_status || 'available'}
                  </span>
                  <span className="font-mono text-slate-600 text-[11px]">
                    UPI: {profile?.upi_id || 'volunteer@upi'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">₹{totalEarningsDisplay.toLocaleString('en-IN')}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Earnings</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{profile?.total_deliveries || completedTasks.length}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deliveries Completed</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{profile?.hours_contributed || 0} hrs</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours Contributed</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">₹250</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fixed Pay Per Mission</div>
              </div>
            </div>
          </div>

          {/* UPI ID & Bank Settlement Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Direct UPI Payout Settings</h3>
                  <p className="text-xs text-slate-500">
                    Stipends are transferred directly to this UPI address after each completed delivery.
                  </p>
                </div>
              </div>

              {!isEditingUpi ? (
                <button
                  onClick={() => setIsEditingUpi(true)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Update UPI ID</span>
                </button>
              ) : null}
            </div>

            {isEditingUpi ? (
              <form onSubmit={handleSaveUpi} className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <IndianRupee className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={newUpiId}
                    onChange={(e) => setNewUpiId(e.target.value)}
                    placeholder="e.g. yourname@okaxis or 9876543210@paytm"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditingUpi(false)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingUpi}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{updatingUpi ? 'Saving...' : 'Save UPI ID'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Registered UPI ID:</span>
                  <span className="text-sm font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {profile?.upi_id || 'volunteer@upi'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Active for Instant Crediting
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Payment SLA: Within 10 mins of delivery verification
                </span>
              </div>
            )}
          </div>

          {/* Detailed Work Done & Earnings Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Completed Delivery Work & Earnings History
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Granular statement of every delivery mission, destination NGO, and payout credited.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {completedTasks.length} missions recorded
              </span>
            </div>

            {completedTasks.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                No completed missions recorded yet. As soon as you confirm your first food delivery, your ₹250 payout receipt and mission details will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Mission / Food Item</th>
                      <th className="px-5 py-3.5">Pickup & Destination</th>
                      <th className="px-5 py-3.5">Completed Date</th>
                      <th className="px-5 py-3.5 text-center">People Fed</th>
                      <th className="px-5 py-3.5 text-right">Payout Earned</th>
                      <th className="px-5 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedTasks.map((t) => (
                      <tr key={t.assignment_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 text-sm">{t.food_name}</div>
                          <div className="text-slate-500 mt-0.5">
                            {t.quantity} {t.quantity_unit} • {t.food_type}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-slate-800 font-semibold">
                            {t.donor_name} → {t.ngo_name}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {t.pickup_location} → {t.ngo_address}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                          {t.delivered_at ? t.delivered_at.slice(0, 16).replace('T', ' ') : 'Recently'}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            {t.beneficiaries_served || 0} fed
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-black text-slate-900 text-sm text-emerald-700">
                            +₹{(t.payout_amount || 250).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Credited via UPI
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MISSION LOG & HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="my-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Completed Delivery Mission Archive
              </h2>
              <p className="text-xs text-slate-500">
                Audited archive of food redistribution operations executed by your profile.
              </p>
            </div>
          </div>

          {completedTasks.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No completed missions logged yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedTasks.map((t) => (
                <div key={t.assignment_id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                        {t.food_type}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{t.food_name}</h4>
                      <div className="text-xs text-emerald-700 font-semibold">
                        {t.quantity} {t.quantity_unit}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      +₹{t.payout_amount || 250} Paid
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span><strong>Donor:</strong> {t.donor_name} ({t.pickup_location})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>Shelter:</strong> {t.ngo_name} ({t.ngo_address})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      <span>Delivered at: {t.delivered_at ? t.delivered_at.slice(0, 16).replace('T', ' ') : '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DELIVERY CONFIRMATION & BENEFICIARIES */}
      {/* ========================================================================= */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Confirm Food Delivery</h3>
                  <p className="text-xs text-slate-500">Record beneficiaries and credit your ₹250 payout</p>
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="py-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">{selectedTask.food_name}</div>
                <div className="text-slate-500 mt-0.5">Destination: {selectedTask.ngo_name}</div>
                <div className="mt-2 text-emerald-700 font-bold flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Stipend of ₹{selectedTask.payout_amount || 250} will be credited to {profile?.upi_id}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Estimated Beneficiaries Fed *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={beneficiaries}
                  onChange={(e) => setBeneficiaries(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Handoff & Condition Notes
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Handed over safely to pantry manager. Containers intact."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-sm cursor-pointer"
                >
                  {submitting ? 'Confirming...' : 'Confirm Delivery & Claim ₹250'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TURN-BY-TURN GPS ROUTE TRACKING & DIRECTIONS */}
      {/* ========================================================================= */}
      {trackingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Live Turn-by-Turn GPS Directions</h3>
                  <p className="text-xs text-slate-500">Route guidance from Donor to NGO Receiving Bay</p>
                </div>
              </div>
              <button onClick={() => setTrackingTask(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              
              {/* Route Summary Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Distance & ETA:</span>
                  <span className="font-black text-sky-700">~3.8 km • 14 minutes</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>City Zone:</span>
                  <span className="font-bold text-slate-900">{trackingTask.city}</span>
                </div>
              </div>

              {/* Step-by-Step Waypoint Guidance */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Waypoint Guidance Steps:
                </h4>

                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    A
                  </div>
                  <div>
                    <div className="font-bold text-amber-950">Pickup Location (Donor)</div>
                    <div className="text-slate-700">{trackingTask.donor_name}</div>
                    <div className="text-slate-500 mt-0.5">{trackingTask.pickup_location}, {trackingTask.city}</div>
                    <div className="text-[11px] text-amber-800 font-semibold mt-1">
                      Action: Collect sealed thermal packages and verify food temperature.
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 bg-sky-50/80 rounded-xl border border-sky-200/80 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    →
                  </div>
                  <div>
                    <div className="font-bold text-sky-950">Transit Corridor (Direct Route)</div>
                    <div className="text-slate-700">Take Main Ring Road / Arterial Avenue towards {trackingTask.ngo_city}</div>
                    <div className="text-[11px] text-sky-800 font-semibold mt-1">
                      Keep food level and covered. Expected transit: 12-15 minutes.
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    B
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950">Drop-off Destination (NGO Shelter)</div>
                    <div className="text-slate-700">{trackingTask.ngo_name}</div>
                    <div className="text-slate-500 mt-0.5">{trackingTask.ngo_address}, {trackingTask.ngo_city}</div>
                    <div className="text-[11px] text-emerald-800 font-semibold mt-1">
                      Action: Handoff to pantry staff, record beneficiary count, and collect ₹250 payout.
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Maps External Navigation Button */}
              <div className="pt-2">
                <a
                  href={getGoogleMapsUrl(trackingTask)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <Navigation className="w-4 h-4 text-white" />
                  <span>Launch Live Google Maps GPS Navigation</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Edit Volunteer Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Volunteer Profile</h3>
                  <p className="text-xs text-slate-500">Update your personal details and location zone</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileFormData.name}
                  onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                  placeholder="e.g. Rohan Iyer"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={profileFormData.phone}
                    onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Operating City Zone *
                  </label>
                  <select
                    required
                    value={profileFormData.city}
                    onChange={(e) => setProfileFormData({ ...profileFormData, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Pune">Pune</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Operating Neighborhoods
                </label>
                <input
                  type="text"
                  value={profileFormData.preferred_areas}
                  onChange={(e) => setProfileFormData({ ...profileFormData, preferred_areas: e.target.value })}
                  placeholder="e.g. Indiranagar, Koramangala, HSR Layout"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Direct Payout UPI ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFormData.upi_id}
                    onChange={(e) => setProfileFormData({ ...profileFormData, upi_id: e.target.value })}
                    placeholder="name@okaxis"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Availability Status
                  </label>
                  <select
                    value={profileFormData.availability_status}
                    onChange={(e) => setProfileFormData({ ...profileFormData, availability_status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="available">Available (Accepting)</option>
                    <option value="busy">Busy (On mission)</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
