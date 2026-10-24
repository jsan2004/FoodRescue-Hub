import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Utensils, 
  Bike, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  AlertCircle, 
  ArrowRight,
  ShieldAlert,
  IndianRupee,
  Compass
} from 'lucide-react';

const CITIES = [
  'Bengaluru',
  'Mumbai',
  'Pune',
  'Delhi-NCR',
  'Hyderabad',
  'Chennai',
  'Kolkata'
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('donor');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: 'Bengaluru',
    customCity: '',
    ngoName: '',
    registrationNumber: '',
    address: '',
    preferredAreas: '',
    upi_id: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalCity = formData.city === 'Other' ? formData.customCity.trim() : formData.city;
    if (!finalCity) {
      setError('Please select or specify your operational city.');
      return;
    }

    setLoading(true);

    try {
      const user = await register({
        ...formData,
        city: finalCity,
        role
      });

      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'ngo') navigate('/ngo');
      else if (user.role === 'donor') navigate('/donor');
      else if (user.role === 'volunteer') navigate('/volunteer');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Join the community food redistribution network
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200/80">
          
          {/* Geo-fencing Notice */}
          <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs leading-relaxed">
            <Compass className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Strict City-Zone Geo-Fencing:</strong> To ensure food arrives fresh within safe consumption windows, members only see food surplus and missions in their registered city zone (e.g. Mumbai, Bengaluru, Pune).
            </div>
          </div>

          {/* Role Selector Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('donor')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  role === 'donor'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Utensils className="w-5 h-5 text-amber-500" />
                <span className="text-xs">Food Donor</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('ngo')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  role === 'ngo'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span className="text-xs">NGO / Charity</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('volunteer')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  role === 'volunteer'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bike className="w-5 h-5 text-sky-500" />
                <span className="text-xs">Volunteer</span>
              </button>
            </div>
          </div>

          {role === 'ngo' && (
            <div className="mb-6 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Verification Notice:</strong> NGO accounts require Administrator verification before donations can be accepted and claimed, ensuring verified community distribution.
              </span>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Person / Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Rajesh Sharma"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@organisation.org.in"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* MANDATORY CITY DROPDOWN FOR ALL USERS */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Operating City / Region (Mandatory) *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Other">Other City...</option>
                </select>
              </div>

              {formData.city === 'Other' && (
                <div className="pt-2">
                  <input
                    type="text"
                    name="customCity"
                    required
                    value={formData.customCity}
                    onChange={handleChange}
                    placeholder="Enter city name (e.g. Ahmedabad, Jaipur)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                You will only be linked with donors, NGOs, and food donations inside this selected city.
              </p>
            </div>

            {/* NGO Specific Fields */}
            {role === 'ngo' && (
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      NGO / Charity Name *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="ngoName"
                        required
                        value={formData.ngoName}
                        onChange={handleChange}
                        placeholder="Roti Bank Seva Foundation"
                        className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Registration #
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        placeholder="DARPAN-KA-2023-01824"
                        className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Headquarters Street Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="12, 5th Cross, Koramangala 4th Block"
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Volunteer Specific Fields */}
            {role === 'volunteer' && (
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    UPI ID for Delivery Payouts (₹250 / delivery)
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="upi_id"
                      value={formData.upi_id}
                      onChange={handleChange}
                      placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Direct automated bank transfer: You earn ₹250 for each successful food rescue & delivery.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Preferred Pickup Localities / Areas
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="preferredAreas"
                      value={formData.preferredAreas}
                      onChange={handleChange}
                      placeholder="e.g. Koramangala, Indiranagar, HSR Layout"
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
