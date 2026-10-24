import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CountdownBadge from '../components/CountdownBadge';
import { 
  Building2, 
  Clock, 
  MapPin, 
  Filter, 
  Search, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Truck, 
  Flame, 
  X, 
  PackageCheck, 
  ChevronRight, 
  Phone,
  User,
  Mail,
  Edit2,
  Save
} from 'lucide-react';

export default function NgoDashboard() {
  const { user, updateProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'feed'); // 'feed', 'claimed', 'profile'
  const [availableDonations, setAvailableDonations] = useState([]);
  const [claimedDonations, setClaimedDonations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Filters
  const [cityFilter, setCityFilter] = useState(user?.role !== 'admin' && user?.city ? user.city : '');
  const [foodTypeFilter, setFoodTypeFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Claim Modal State
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [collectionType, setCollectionType] = useState('volunteer');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  // Beneficiary / Delivery update modal
  const [completingDonation, setCompletingDonation] = useState(null);
  const [beneficiariesCount, setBeneficiariesCount] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // NGO Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    ngo_name: '',
    name: '',
    phone: '',
    city: 'Bengaluru',
    address: '',
    registration_number: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const isVerified = user?.role === 'admin' || user?.profile?.verified === 1;

  const loadData = async () => {
    try {
      setLoading(true);
      const [availRes, claimedRes, volRes] = await Promise.all([
        api.getAvailableDonations({
          city: cityFilter,
          food_type: foodTypeFilter,
          urgency: urgencyFilter,
          search: searchQuery
        }),
        api.getNgoDonations().catch(() => ({ donations: [] })),
        api.getAvailableVolunteers().catch(() => ({ volunteers: [] }))
      ]);

      setAvailableDonations(availRes.donations || []);
      setClaimedDonations(claimedRes.donations || []);
      setVolunteers(volRes.volunteers || []);

      if (volRes.volunteers?.length > 0 && !selectedVolunteerId) {
        setSelectedVolunteerId(volRes.volunteers[0].id);
      }
    } catch (err) {
      console.error('Error fetching NGO dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cityFilter, foodTypeFilter, urgencyFilter]);

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!selectedDonation) return;

    setClaimSubmitting(true);
    try {
      await api.claimDonation({
        donation_id: selectedDonation.id,
        collection_type: collectionType,
        volunteer_id: collectionType === 'volunteer' ? selectedVolunteerId : null,
        notes: claimNotes
      });

      setSelectedDonation(null);
      setClaimNotes('');
      setMessage(`Successfully claimed "${selectedDonation.food_name}"!`);
      setActiveTab('claimed');
      loadData();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to claim donation');
    } finally {
      setClaimSubmitting(false);
    }
  };

  const handleUpdateStatus = async (donationId, status) => {
    try {
      await api.updateNgoDeliveryStatus({
        donation_id: donationId,
        status,
        notes: 'Status updated by NGO coordinator'
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmDelivered = async (e) => {
    e.preventDefault();
    if (!completingDonation) return;

    try {
      await api.updateNgoDeliveryStatus({
        donation_id: completingDonation.id,
        status: 'delivered',
        beneficiaries_served: parseInt(beneficiariesCount, 10) || 0,
        notes: deliveryNotes
      });

      setCompletingDonation(null);
      setBeneficiariesCount('');
      setDeliveryNotes('');
      setMessage('Donation marked as delivered! Beneficiary metrics updated.');
      loadData();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEditProfile = () => {
    setProfileFormData({
      ngo_name: user?.profile?.ngo_name || user?.name || '',
      name: user?.name || '',
      phone: user?.phone || '',
      city: user?.city || 'Bengaluru',
      address: user?.profile?.address || user?.address || '',
      registration_number: user?.profile?.registration_number || ''
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profileFormData);
      if (user?.role !== 'admin' && profileFormData.city !== user?.city) {
        setCityFilter(profileFormData.city);
      }
      setIsEditingProfile(false);
      setMessage('NGO Organization profile successfully updated!');
      loadData();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to update NGO profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">NGO Operations Hub</h1>
            {isVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Partner NGO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Pending Verification
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {user?.profile?.ngo_name || user?.name} • Real-time surplus food matching and distribution tracking
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Available Feed ({availableDonations.length})
          </button>
          <button
            onClick={() => setActiveTab('claimed')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'claimed'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Our Claimed Food ({claimedDonations.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            NGO Profile & Info
          </button>
        </div>
      </div>

      {!isVerified && (
        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Account Pending Verification</div>
            <p className="mt-0.5">
              An administrator has not yet verified your NGO registration details. You can view available food listings, but food claiming and volunteer dispatch will remain locked until your NGO profile is verified and approved.
            </p>
          </div>
        </div>
      )}

      {message && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* FEED TAB */}
      {activeTab === 'feed' && (
        <div className="mt-6 space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              
              {/* Urgency Filter */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setUrgencyFilter('')}
                  className={`px-2.5 py-1 rounded-lg font-medium ${!urgencyFilter ? 'bg-white font-bold shadow-xs' : 'text-slate-500'}`}
                >
                  All Urgencies
                </button>
                <button
                  onClick={() => setUrgencyFilter('urgent')}
                  className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 ${urgencyFilter === 'urgent' ? 'bg-rose-100 text-rose-800 font-bold' : 'text-slate-500'}`}
                >
                  <Flame className="w-3 h-3 text-rose-500" />
                  Urgent (&lt; 2h)
                </button>
                <button
                  onClick={() => setUrgencyFilter('expiring_soon')}
                  className={`px-2.5 py-1 rounded-lg font-medium ${urgencyFilter === 'expiring_soon' ? 'bg-amber-100 text-amber-800 font-bold' : 'text-slate-500'}`}
                >
                  Expiring Soon (2-4h)
                </button>
                <button
                  onClick={() => setUrgencyFilter('fresh')}
                  className={`px-2.5 py-1 rounded-lg font-medium ${urgencyFilter === 'fresh' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-500'}`}
                >
                  Fresh (&gt; 4h)
                </button>
              </div>

              {/* Food Type Selector */}
              <select
                value={foodTypeFilter}
                onChange={(e) => setFoodTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 text-slate-700 focus:outline-none"
              >
                <option value="">All Food Types</option>
                <option value="Cooked Food">Cooked Food</option>
                <option value="Bakery Items">Bakery Items</option>
                <option value="Raw Ingredients">Raw Ingredients</option>
                <option value="Packaged Food">Packaged Food</option>
              </select>

              {/* City Zone Indicator / Admin Filter */}
              {user?.role !== 'admin' && user?.city ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Zone: {user.city} (Geo-Fenced)</span>
                </div>
              ) : (
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 text-slate-700 focus:outline-none"
                >
                  <option value="">All Indian Cities</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                  <option value="Delhi-NCR">Delhi-NCR</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                </select>
              )}
            </div>

            <button
              onClick={loadData}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition-colors"
            >
              Refresh Listings
            </button>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Scanning for surplus food...</div>
          ) : availableDonations.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Matching Surplus Food Available</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No unclaimed food currently matches your filters, or all nearby donations have already been collected!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableDonations.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-xs transition-all ${
                    item.urgency?.isUrgent
                      ? 'border-rose-300 ring-1 ring-rose-100'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Urgency & Category Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                        {item.food_type}
                      </span>
                      <CountdownBadge 
                        expiryDateTime={item.expiry_datetime} 
                        status={item.status} 
                      />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{item.food_name}</h3>

                    {item.image_url && (
                      <div className="my-2.5 rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-40 bg-slate-100">
                        <img 
                          src={item.image_url} 
                          alt={item.food_name} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50/60 px-2.5 py-1 rounded-lg inline-block">
                      Quantity: {item.quantity} {item.quantity_unit}
                    </div>

                    {/* Donor & Location */}
                    <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-semibold text-slate-800">{item.donor_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{item.pickup_location}, {item.city}</span>
                      </div>
                      {item.donor_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{item.donor_phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Food Safety Verified Tag */}
                    {item.safety_checklist && (
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Donor 4-Point Safety Verified</span>
                      </div>
                    )}

                    {item.notes && (
                      <p className="mt-2 text-[11px] text-slate-500 italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  {/* Claim Button */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <button
                      disabled={!isVerified}
                      onClick={() => setSelectedDonation(item)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isVerified
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{isVerified ? 'Accept & Coordinate Pickup' : 'Verification Required'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CLAIMED TAB */}
      {activeTab === 'claimed' && (
        <div className="mt-6 space-y-6">
          <h2 className="text-base font-bold text-slate-900">
            Our Active Collections & Completed Distributions ({claimedDonations.length})
          </h2>

          {claimedDonations.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold">No food claimed yet</p>
              <p className="text-xs text-slate-400 mt-1">Browse the Available Feed tab to accept surplus food donations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claimedDonations.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                        {item.food_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'picked_up' ? 'bg-sky-100 text-sky-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        Status: {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{item.food_name}</h3>
                    
                    <p className="text-xs text-slate-600">
                      <strong>{item.quantity} {item.quantity_unit}</strong> • Donor: {item.donor_name} ({item.pickup_location})
                    </p>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                      <span>Dispatch: <strong>{item.collection_type === 'volunteer' ? `Volunteer: ${item.volunteer_name || 'Assigned'}` : 'NGO Direct Team'}</strong></span>
                      {item.beneficiaries_served > 0 && (
                        <span className="text-emerald-700 font-bold">Beneficiaries Fed: {item.beneficiaries_served}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions depending on status */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === 'accepted' && item.collection_type === 'ngo_team' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'picked_up')}
                        className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors"
                      >
                        Mark Picked Up
                      </button>
                    )}

                    {['accepted', 'assigned', 'picked_up'].includes(item.status) && (
                      <button
                        onClick={() => setCompletingDonation(item)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        Confirm Delivered & Log Beneficiaries
                      </button>
                    )}

                    {item.status === 'delivered' && (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Distribution Completed
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NGO PROFILE & ORGANIZATION INFO TAB */}
      {activeTab === 'profile' && (
        <div className="mt-6 space-y-6">
          
          {/* Profile Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 font-black text-xl shadow-inner flex-shrink-0">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">{user?.profile?.ngo_name || user?.name}</h2>
                    {isVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified NGO Partner
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Verification Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Coordinator: <strong>{user?.name}</strong> • {user?.email} • {user?.phone || 'No phone recorded'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-md">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      Active City Zone: <strong>{user?.city || 'Bengaluru'}</strong>
                    </span>
                    <button
                      onClick={handleOpenEditProfile}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 text-xs font-bold border border-teal-400/30 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit NGO Profile</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Rescue Counter */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-right min-w-[200px]">
                <div className="text-[11px] uppercase tracking-wider text-teal-300 font-bold">
                  Total Rescues Coordinated
                </div>
                <div className="text-3xl font-black text-white mt-1">
                  {claimedDonations.length}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  {claimedDonations.reduce((sum, d) => sum + (d.beneficiaries_served || 0), 0).toLocaleString('en-IN')} Beneficiaries Fed
                </div>
              </div>
            </div>
          </div>

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-2xl font-bold text-slate-900">{claimedDonations.length}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Total Food Claims</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-2xl font-bold text-sky-600">
                {claimedDonations.filter(d => ['accepted', 'assigned', 'picked_up'].includes(d.status)).length}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Active In-Transit</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-2xl font-bold text-emerald-600">
                {claimedDonations.filter(d => d.status === 'delivered').length}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Deliveries Completed</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-2xl font-bold text-teal-600">
                {claimedDonations.reduce((sum, d) => sum + (d.beneficiaries_served || 0), 0)}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">People Nourished</div>
            </div>
          </div>

          {/* Detailed Organization Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Organization Identity & Verification Details</h3>
                  <p className="text-xs text-slate-500">
                    Verified registration attributes and central distribution hub coordinates.
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenEditProfile}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Edit Info</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NGO Name</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{user?.profile?.ngo_name || user?.name}</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trust / 80G Reg Number</div>
                <div className="text-sm font-mono font-semibold text-slate-800 mt-0.5">
                  {user?.profile?.registration_number || 'Pending Entry'}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Representative</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{user?.name}</div>
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
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Email</div>
                <div className="text-xs font-mono text-slate-800 mt-0.5">{user?.email}</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coordinator Phone</div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">{user?.phone || 'Not recorded'}</div>
              </div>
            </div>

            <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distribution Center & Drop-Off Address</div>
              <div className="text-xs font-medium text-slate-800 mt-0.5">{user?.profile?.address || user?.address || 'Not specified'}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                This destination address is shared with volunteers and donors when coordinating pickups.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* CLAIM & ASSIGN MODAL */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Claim Surplus Food</h3>
                  <p className="text-xs text-slate-500">Configure pickup method & volunteer dispatch</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDonation(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClaim} className="py-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900 text-sm">{selectedDonation.food_name}</div>
                <div className="text-slate-500 mt-0.5">{selectedDonation.quantity} {selectedDonation.quantity_unit} • {selectedDonation.pickup_location}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">
                  Collection Dispatch Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCollectionType('volunteer')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      collectionType === 'volunteer'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-300'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Assign Volunteer
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectionType('ngo_team')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      collectionType === 'ngo_team'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-300'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    NGO In-House Team
                  </button>
                </div>
              </div>

              {collectionType === 'volunteer' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Select Available Volunteer *
                  </label>
                  {volunteers.length === 0 ? (
                    <p className="text-rose-600 font-medium">No volunteers currently registered. Please select "NGO In-House Team".</p>
                  ) : (
                    <select
                      value={selectedVolunteerId}
                      onChange={(e) => setSelectedVolunteerId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                    >
                      {volunteers.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.phone || 'Volunteer'}) • Status: {v.availability_status} • {v.total_deliveries} deliveries
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-semibold flex items-center justify-between">
                    <span>Allocated Delivery Stipend:</span>
                    <span className="font-bold text-emerald-900">₹250.00 (UPI Payout upon delivery)</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Pickup Instructions / Destination Notes
                </label>
                <textarea
                  rows="2"
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="e.g. Please bring thermal carry bags. Destination: Koramangala Community Kitchen, Bengaluru."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDonation(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimSubmitting || (collectionType === 'volunteer' && !selectedVolunteerId)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-sm"
                >
                  {claimSubmitting ? 'Confirming...' : 'Confirm Claim & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BENEFICIARY REPORTING MODAL */}
      {completingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Confirm Delivery</h3>
                  <p className="text-xs text-slate-500">Record beneficiary impact for research audit</p>
                </div>
              </div>
              <button 
                onClick={() => setCompletingDonation(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelivered} className="py-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900 text-sm">{completingDonation.food_name}</div>
                <div className="text-slate-500 mt-0.5">{completingDonation.quantity} {completingDonation.quantity_unit}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Number of Beneficiaries Served *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={beneficiariesCount}
                  onChange={(e) => setBeneficiariesCount(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Estimates direct individuals fed with this donation.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Distribution Notes
                </label>
                <textarea
                  rows="2"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Distributed at local soup kitchen evening service."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompletingDonation(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-sm"
                >
                  Save & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NGO PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit NGO Organization Profile</h3>
                  <p className="text-xs text-slate-500">Update organization info, city zone, and distribution address</p>
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
                  NGO Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileFormData.ngo_name}
                  onChange={(e) => setProfileFormData({ ...profileFormData, ngo_name: e.target.value })}
                  placeholder="e.g. Roti Bank Trust"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Coordinator Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFormData.name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                    placeholder="e.g. Mansi Jadhav"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={profileFormData.phone}
                    onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Operating City Zone *
                  </label>
                  <select
                    required
                    value={profileFormData.city}
                    onChange={(e) => setProfileFormData({ ...profileFormData, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Registration / 80G Number
                  </label>
                  <input
                    type="text"
                    value={profileFormData.registration_number}
                    onChange={(e) => setProfileFormData({ ...profileFormData, registration_number: e.target.value })}
                    placeholder="e.g. TRUST-KA-2023-890"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Distribution Center / Drop-Off Address *
                </label>
                <textarea
                  rows="2"
                  required
                  value={profileFormData.address}
                  onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                  placeholder="e.g. 88, Community Shelter Hall, Shivajinagar"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
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
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingProfile ? 'Saving...' : 'Save NGO Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
