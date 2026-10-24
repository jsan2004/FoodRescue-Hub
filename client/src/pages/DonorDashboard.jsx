import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CountdownBadge from '../components/CountdownBadge';
import StatusStepper from '../components/StatusStepper';
import FoodSafetyModal from '../components/FoodSafetyModal';
import { 
  Plus, 
  Clock, 
  MapPin, 
  Calendar, 
  Utensils, 
  CheckCircle, 
  AlertCircle, 
  X, 
  ShieldCheck,
  Package,
  Phone,
  Camera,
  UploadCloud,
  Building2,
  User,
  Mail,
  Edit2,
  Save
} from 'lucide-react';

export default function DonorDashboard() {
  const { user, updateProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'donations'); // 'donations' or 'profile'
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    phone: '',
    city: 'Bengaluru',
    address: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    food_name: '',
    food_type: 'Cooked Food',
    quantity: '',
    quantity_unit: 'servings',
    preparation_datetime: '',
    expiry_datetime: '',
    pickup_location: user?.address || '14, 100 Feet Road, Indiranagar',
    city: user?.city || 'Bengaluru',
    image_url: '',
    notes: ''
  });

  const handleImageChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB.');
      return;
    }

    try {
      setUploadingImage(true);
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);

      const res = await api.uploadImage(file);
      setFormData(prev => ({ ...prev, image_url: res.imageUrl }));
    } catch (err) {
      alert(err.message || 'Image upload failed');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const loadDonations = async () => {
    try {
      const res = await api.getMyDonations();
      setDonations(res.donations);
    } catch (err) {
      console.error('Failed to load donations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const handlePresetExpiry = (hours) => {
    const now = new Date();
    const expiry = new Date(now.getTime() + hours * 60 * 60 * 1000);
    // Format to YYYY-MM-DDTHH:MM
    const localIso = new Date(expiry.getTime() - expiry.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, expiry_datetime: localIso }));
  };

  const handleOpenSafetyModal = (e) => {
    e.preventDefault();
    if (!formData.food_name || !formData.quantity || !formData.expiry_datetime) {
      alert('Please fill out all required fields (food name, quantity, expiry time)');
      return;
    }
    setShowSafetyModal(true);
  };

  const handleConfirmPost = async (safetyChecklist) => {
    setSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      await api.createDonation({
        ...formData,
        preparation_datetime: formData.preparation_datetime || nowIso,
        safety_checklist: safetyChecklist
      });

      setShowSafetyModal(false);
      setShowPostModal(false);
      setMessage('Donation successfully published and visible to nearby NGOs!');
      setFormData({
        food_name: '',
        food_type: 'Cooked Food',
        quantity: '',
        quantity_unit: 'servings',
        preparation_datetime: '',
        expiry_datetime: '',
        pickup_location: '14, 100 Feet Road, Indiranagar',
        city: 'Bengaluru',
        image_url: '',
        notes: ''
      });
      setImagePreview(null);
      loadDonations();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to post donation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (donationId) => {
    if (!confirm('Are you sure you want to cancel this donation?')) return;
    try {
      await api.cancelDonation(donationId);
      loadDonations();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEditProfile = () => {
    setProfileFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      city: user?.city || 'Bengaluru',
      address: user?.address || formData.pickup_location || '14, 100 Feet Road, Indiranagar'
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profileFormData);
      setFormData(prev => ({
        ...prev,
        pickup_location: profileFormData.address,
        city: profileFormData.city
      }));
      setIsEditingProfile(false);
      setMessage('Donor profile information successfully updated!');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to update donor profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const activeDonations = donations.filter(d => ['posted', 'accepted', 'assigned', 'picked_up'].includes(d.status));
  const pastDonations = donations.filter(d => ['delivered', 'expired', 'cancelled'].includes(d.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header & Post CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Food Donor Portal</h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase">
              Donor
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Logged in as <strong>{user?.name}</strong> • Post surplus food & monitor delivery pipelines
          </p>
        </div>

        <button
          onClick={() => {
            // Pre-fill preparation time to now
            const now = new Date();
            const nowIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            setFormData(prev => ({ ...prev, preparation_datetime: nowIso }));
            handlePresetExpiry(3); // default 3 hours
            setShowPostModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm hover:shadow-emerald-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Post New Donation</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mt-6 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('donations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'donations'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Donations & Food Dispatch ({donations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Donor Profile & Kitchen Info</span>
        </button>
      </div>

      {message && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* TAB 1: DONATIONS & FOOD DISPATCH */}
      {activeTab === 'donations' && (
        <div>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-2xl font-bold text-slate-900">{donations.length}</div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Total Donations</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-2xl font-bold text-emerald-600">{activeDonations.length}</div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">In Progress / Active</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-2xl font-bold text-teal-600">
            {donations.filter(d => d.status === 'delivered').length}
          </div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Delivered Successfully</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-2xl font-bold text-slate-600">
            {donations.reduce((sum, d) => sum + (d.beneficiaries_served || 0), 0)}
          </div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Beneficiaries Fed</div>
        </div>
      </div>

      {/* Active Donations Section */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-600" />
          Active Surplus Pipeline ({activeDonations.length})
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading donations...</div>
        ) : activeDonations.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No active donations currently in transit</p>
            <p className="text-xs text-slate-400 mt-1">Click "Post New Donation" to list available food surplus.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeDonations.map((donation) => (
              <div key={donation.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase mb-1">
                        {donation.food_type}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{donation.food_name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Quantity: <strong>{donation.quantity} {donation.quantity_unit}</strong>
                      </p>
                    </div>

                    <CountdownBadge 
                      expiryDateTime={donation.expiry_datetime} 
                      status={donation.status} 
                    />
                  </div>

                  {/* Status Pipeline Stepper */}
                  <div className="my-2">
                    <StatusStepper currentStatus={donation.status} />
                  </div>

                  {donation.image_url && (
                    <div className="my-2.5 rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-44 bg-slate-100">
                      <img 
                        src={donation.image_url} 
                        alt={donation.food_name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Location & NGO assignment details */}
                  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 mt-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{donation.pickup_location}, {donation.city}</span>
                    </div>

                    {donation.ngo_name && (
                      <div className="flex items-center gap-2 text-emerald-800 font-semibold pt-1 border-t border-slate-200/60">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Claimed by: {donation.ngo_name} ({donation.collection_type === 'volunteer' ? 'Volunteer assigned' : 'NGO team'})</span>
                      </div>
                    )}

                    {donation.volunteer_name && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Assigned Volunteer: <strong>{donation.volunteer_name}</strong> ({donation.volunteer_phone})</span>
                      </div>
                    )}
                  </div>
                </div>

                {donation.status === 'posted' && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleCancel(donation.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      Cancel Donation
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Donations History */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-slate-500" />
          Past Distribution History ({pastDonations.length})
        </h2>

        {pastDonations.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            No completed or expired donations yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Food Item</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Claimed NGO</th>
                    <th className="px-4 py-3">Beneficiaries</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastDonations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{d.food_name}</td>
                      <td className="px-4 py-3 text-slate-600">{d.food_type}</td>
                      <td className="px-4 py-3 text-slate-600">{d.quantity} {d.quantity_unit}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          d.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          d.status === 'expired' ? 'bg-slate-100 text-slate-600' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{d.ngo_name || '—'}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">{d.beneficiaries_served || 0}</td>
                      <td className="px-4 py-3 text-slate-400">{d.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )}

  {/* TAB 2: DONOR PROFILE & KITCHEN INFO */}
  {activeTab === 'profile' && (
    <div className="my-6 space-y-6">
      {/* Donor Profile Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black text-xl shadow-inner flex-shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Food Donor
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {user?.email} • {user?.phone || 'No phone recorded'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-md">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  Operating City Zone: <strong>{user?.city || 'Bengaluru'}</strong>
                </span>
                <button
                  onClick={handleOpenEditProfile}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold border border-amber-400/30 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Donor Profile</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Impact Counter */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-right min-w-[200px]">
            <div className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">
              Total Food Batches Donated
            </div>
            <div className="text-3xl font-black text-white mt-1">
              {donations.length}
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              {donations.reduce((sum, d) => sum + (d.beneficiaries_served || 0), 0).toLocaleString('en-IN')} Beneficiaries Fed
            </div>
          </div>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-2xl font-bold text-slate-900">{donations.length}</div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Total Batches</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-2xl font-bold text-emerald-600">{activeDonations.length}</div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Active In-Transit</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-2xl font-bold text-teal-600">
            {donations.filter(d => d.status === 'delivered').length}
          </div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Delivered Successfully</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-2xl font-bold text-slate-600">
            {donations.reduce((sum, d) => sum + (d.beneficiaries_served || 0), 0)}
          </div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">People Nourished</div>
        </div>
      </div>

      {/* Detailed Establishment Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Establishment Profile & Kitchen Location</h3>
              <p className="text-xs text-slate-500">
                Your establishment identity and default food dispatch pickup coordinates.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenEditProfile}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Donor / Establishment Name</div>
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

        <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Commercial Kitchen & Pickup Location</div>
          <div className="text-xs font-medium text-slate-800 mt-0.5">{user?.address || formData.pickup_location}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            This pickup location is automatically pre-filled when you create new food donations so NGOs and volunteers can navigate directly to your kitchen.
          </div>
        </div>
      </div>

    </div>
  )}

  {/* Post Donation Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Post Food Donation</h3>
                  <p className="text-xs text-slate-500">Record food preparation & expiry deadline</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPostModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenSafetyModal} className="py-4 space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Food Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.food_name}
                  onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
                  placeholder="e.g. 50 Servings Dal Makhani & Jeera Rice"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Food Category *
                  </label>
                  <select
                    value={formData.food_type}
                    onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Cooked Food">Cooked Food (Urgent)</option>
                    <option value="Bakery Items">Bakery Items</option>
                    <option value="Raw Ingredients">Raw Ingredients</option>
                    <option value="Packaged Food">Packaged Food</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Quantity & Unit *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="40"
                      className="w-1/2 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <select
                      value={formData.quantity_unit}
                      onChange={(e) => setFormData({ ...formData, quantity_unit: e.target.value })}
                      className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="servings">servings</option>
                      <option value="kg">kg</option>
                      <option value="items">items</option>
                      <option value="boxes">boxes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Expiry Datetime with quick presets */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-900 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    Expiry Deadline *
                  </label>
                  <span className="text-[10px] text-amber-800 font-semibold">
                    Core Expiry Feature
                  </span>
                </div>

                <input
                  type="datetime-local"
                  required
                  value={formData.expiry_datetime}
                  onChange={(e) => setFormData({ ...formData, expiry_datetime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => handlePresetExpiry(1.5)}
                    className="px-2 py-0.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[10px]"
                  >
                    +1.5h (Urgent)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetExpiry(3)}
                    className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium text-[10px]"
                  >
                    +3h (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetExpiry(8)}
                    className="px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium text-[10px]"
                  >
                    +8h (Extended)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Pickup Location / Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pickup_location}
                    onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                    placeholder="14, 100 Feet Road, Indiranagar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    City Zone *
                  </label>
                  <select
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Pune">Pune</option>
                    <option value="Delhi-NCR">Delhi-NCR</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Handling Notes / Allergens (Optional)
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contains nuts or dairy. Please bring insulated containers."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Food Photograph (Multer Upload) */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    Food Photograph (Optional)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal lowercase">
                    JPEG, PNG or WebP (max 5MB)
                  </span>
                </label>

                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2.5 flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Food preview"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {uploadingImage ? 'Uploading image...' : 'Photo attached successfully'}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-medium">
                        {uploadingImage ? 'Processing with Multer...' : 'Visible to verified NGOs'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => {
                        setImagePreview(null);
                        setFormData(prev => ({ ...prev, image_url: '' }));
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-all group">
                    <div className="flex items-center gap-2 text-slate-600 group-hover:text-emerald-700">
                      <UploadCloud className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-semibold">Click to upload food photo</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">Helps NGOs verify packaging and hygiene</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Food Safety & Post</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4-Point Food Safety Verification Modal */}
      <FoodSafetyModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        onConfirm={handleConfirmPost}
        isSubmitting={submitting}
      />

      {/* EDIT DONOR PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Donor Profile</h3>
                  <p className="text-xs text-slate-500">Update establishment information and kitchen pickup location</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Establishment / Donor Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileFormData.name}
                  onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                  placeholder="e.g. Annapoorna Caterers or Hotel Taj Lands End"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={profileFormData.phone}
                    onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Operating City Zone *
                  </label>
                  <select
                    required
                    value={profileFormData.city}
                    onChange={(e) => setProfileFormData({ ...profileFormData, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
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
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Default Kitchen & Pickup Address *
                </label>
                <textarea
                  rows="2"
                  required
                  value={profileFormData.address}
                  onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                  placeholder="e.g. 14, 100 Feet Road, Indiranagar"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This address is automatically pre-filled whenever you post new surplus food batches.
                </p>
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingProfile ? 'Saving...' : 'Save Donor Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
