import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import CountdownBadge from '../components/CountdownBadge';
import { 
  HeartHandshake, 
  Utensils, 
  Clock, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  Building, 
  Building2,
  ArrowRight, 
  Flame, 
  CheckCircle, 
  Leaf,
  MapPin,
  Sparkles,
  Droplets,
  Wind,
  Phone,
  Shield,
  Truck,
  Quote,
  Check,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const { role } = useAuth();
  const [stats, setStats] = useState(null);
  const [liveDonations, setLiveDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interactive Impact Calculator State (Servings)
  const [calcServings, setCalcServings] = useState(120);

  // Calculated metrics
  const calcKg = Math.round(calcServings * 0.45);
  const calcCo2 = Math.round(calcKg * 2.5);
  const calcWater = Math.round(calcKg * 850);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load stats & live available donations in parallel
        const [statsRes, donationsRes] = await Promise.all([
          api.getImpactStats().catch(() => null),
          api.getAvailableDonations().catch(() => ({ donations: [] }))
        ]);

        if (statsRes) setStats(statsRes);
        if (donationsRes?.donations) {
          setLiveDonations(donationsRes.donations.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/40">
        
        {/* Animated background radiant glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-teal-500/10 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[350px] h-[250px] bg-emerald-600/15 blur-[100px] rounded-full pointer-events-none" />

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          
          {/* Trust Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-xs font-bold tracking-wide backdrop-blur-md shadow-inner animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            <span>Govt. DARPAN NGO Network • FSSAI Food Hygiene Compliant</span>
          </div>

          {/* Impact Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
            Rescue Surplus Food. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 drop-shadow-sm">
              Feed Hungry Communities.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-4 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            India’s centralized digital food recovery pipeline connecting banquets, caterers, and restaurants with verified local shelter trusts in real time. Powered by automated time-to-expiry tracking and audited dispatch.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/donor"
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all duration-200 flex items-center gap-2.5"
            >
              <Utensils className="w-5 h-5 text-slate-950" />
              <span>Donate Surplus Food Now</span>
            </Link>

            {role !== 'donor' && (
              <Link
                to="/ngo"
                className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base border border-white/20 hover:border-white/40 transition-all duration-200 flex items-center gap-2.5 backdrop-blur-md hover:scale-105"
              >
                <span>Browse Live Surplus Feed</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>
            )}
          </div>

          {/* High-Trust Value Strip */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left max-w-4xl mx-auto border-t border-slate-800/80">
            <div className="flex items-center gap-2.5 text-slate-300 text-xs font-medium">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Flame className="w-4 h-4" />
              </div>
              <span>&lt; 2-Hr Urgent Alerts</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-300 text-xs font-medium">
              <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>FSSAI Safe Food Share</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-300 text-xs font-medium">
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <Truck className="w-4 h-4" />
              </div>
              <span>Verified Volunteer Fleet</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-300 text-xs font-medium">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Building2 className="w-4 h-4" />
              </div>
              <span>DARPAN Registered NGOs</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. LIVE IMPACT METRICS TIER */}
      <section className="max-w-6xl mx-auto -mt-12 px-4 sm:px-6 w-full relative z-20">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200 p-6 sm:p-8 backdrop-blur-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-600" />
                Audited Community Impact Metrics
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time statistics across active redistribution hubs</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Engine State</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
            
            {/* Card 1 */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-colors">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600">
                {loading ? '...' : (stats?.beneficiariesFed || 0).toLocaleString()}
              </div>
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider mt-2">Beneficiaries Nourished</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Nutritious meals delivered</p>
            </div>

            {/* Card 2 */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 shadow-xs hover:border-teal-300 transition-colors">
              <div className="text-3xl sm:text-4xl font-black text-teal-600">
                {loading ? '...' : `${(stats?.totalKgSaved || 0).toLocaleString()} kg`}
              </div>
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider mt-2">Food Rescued</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Diverted from city landfills</p>
            </div>

            {/* Card 3 */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 shadow-xs hover:border-slate-400 transition-colors">
              <div className="text-3xl sm:text-4xl font-black text-slate-900">
                {loading ? '...' : (stats?.deliveredDonations || 0)}
              </div>
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider mt-2">Successful Dispatches</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Completed pickup handoffs</p>
            </div>

            {/* Card 4 */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 shadow-xs hover:border-amber-300 transition-colors">
              <div className="text-3xl sm:text-4xl font-black text-amber-600">
                {loading ? '...' : (stats?.activePartners || 0)}
              </div>
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider mt-2">Verified Partner NGOs</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Audited shelter networks</p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. LIVE SURPLUS RESCUE STREAM (TOP DONATIONS) */}
      <section className="max-w-6xl mx-auto py-16 px-4 sm:px-6 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>Real-Time Expiry Countdown Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Live Surplus Donations In Transit
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Batches listed by local kitchens and banquets with ticking shelf-life countdowns. Verified NGOs can claim immediate collection.
            </p>
          </div>

          {role !== 'donor' && (
            <Link
              to="/ngo"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl border border-emerald-200 transition-colors"
            >
              <span>View All Available Feed</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {liveDonations.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">All surplus batches currently claimed or delivered!</p>
            <p className="text-xs text-slate-400 mt-0.5">Check back shortly or register as a donor to post fresh surplus.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {liveDonations.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  {/* Category & Countdown */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                      {item.food_type}
                    </span>
                    <CountdownBadge 
                      expiryDateTime={item.expiry_datetime} 
                      status={item.status} 
                    />
                  </div>

                  {/* Photo or Visual Banner */}
                  {item.image_url ? (
                    <div className="mb-3 rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-100">
                      <img 
                        src={item.image_url} 
                        alt={item.food_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="mb-3 rounded-2xl aspect-video bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-100/60 flex items-center justify-center text-emerald-700">
                      <Utensils className="w-8 h-8 opacity-40" />
                    </div>
                  )}

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                    {item.food_name}
                  </h3>

                  <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 px-3 py-1 rounded-lg inline-block">
                    {item.quantity} {item.quantity_unit}
                  </div>

                  {/* Donor & City */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{item.donor_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{item.city}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Tag */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    FSSAI Verified
                  </span>
                  <span>{item.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. INTERACTIVE IMPACT & CARBON CALCULATOR */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-16 px-4 sm:px-6 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Interactive Sustainability Estimator</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              See the Impact of Your Food Surplus
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Drag the volume slider below to estimate the societal and environmental footprint of redirecting excess meals through FoodRescueHub.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
            
            {/* Slider Control */}
            <div className="space-y-4 max-w-3xl mx-auto mb-10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Surplus Meal Volume (Servings)
                </label>
                <span className="font-mono text-2xl font-black text-emerald-700 px-4 py-1 rounded-xl bg-emerald-50 border border-emerald-200">
                  {calcServings} Meals
                </span>
              </div>

              <input 
                type="range"
                min="20"
                max="1000"
                step="10"
                value={calcServings}
                onChange={(e) => setCalcServings(parseInt(e.target.value, 10))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                <span>Small Cafe (20)</span>
                <span>Banquet Hall (250)</span>
                <span>Corporate Event (500)</span>
                <span>Wedding Mega-Kitchen (1,000)</span>
              </div>
            </div>

            {/* Metric Output Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-600/20">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{calcServings}</div>
                <div className="text-xs font-bold text-emerald-900 uppercase mt-1">People Fed</div>
                <p className="text-[10px] text-emerald-700/80 mt-0.5">Immediate hunger relief</p>
              </div>

              <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200 text-center">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-teal-600/20">
                  <Leaf className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{calcKg} kg</div>
                <div className="text-xs font-bold text-teal-900 uppercase mt-1">Landfill Diverted</div>
                <p className="text-[10px] text-teal-700/80 mt-0.5">Organic waste stopped</p>
              </div>

              <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 text-center">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-sky-600/20">
                  <Wind className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{calcCo2} kg</div>
                <div className="text-xs font-bold text-sky-900 uppercase mt-1">CO₂e Prevented</div>
                <p className="text-[10px] text-sky-700/80 mt-0.5">Greenhouse emissions avoided</p>
              </div>

              <div className="p-5 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-center">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-cyan-600/20">
                  <Droplets className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{calcWater.toLocaleString()} L</div>
                <div className="text-xs font-bold text-cyan-900 uppercase mt-1">Water Preserved</div>
                <p className="text-[10px] text-cyan-700/80 mt-0.5">Virtual agricultural water saved</p>
              </div>

            </div>

            <p className="mt-6 text-center text-[11px] text-slate-400 italic">
              *Calculated using Indian Central Pollution Control Board (CPCB) & UN FAO food waste greenhouse conversion indices.
            </p>

          </div>
        </div>
      </section>

      {/* 5. 4-STAGE AUTOMATED RESCUE PIPELINE */}
      <section className="max-w-6xl mx-auto py-20 px-4 sm:px-6 w-full">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How The Real-Time Pipeline Works
          </h2>
          <p className="text-xs sm:text-base text-slate-600 mt-2 max-w-2xl mx-auto">
            Engineered to eliminate the bottlenecks of disorganized WhatsApp groups and delayed phone calls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm relative space-y-3 group hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900">Post in 60s</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Donor logs surplus quantity, preparation time, and photo. Must check FSSAI 4-point hygiene standards.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm relative space-y-3 group hover:border-rose-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 font-black text-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900">Urgency Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Active countdown timers calculate shelf-life. Batches under 2 hours trigger high-urgency notifications.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm relative space-y-3 group hover:border-teal-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-black text-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900">NGO Claim</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verified local NGO claims food with one click, selecting either their in-house vehicle or assigning a volunteer.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm relative space-y-3 group hover:border-sky-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 font-black text-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              04
            </div>
            <h3 className="text-base font-bold text-slate-900">Audited Delivery</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Insulated transport to community night shelters. Headcount logged directly into the system's impact database.
            </p>
          </div>

        </div>
      </section>

      {/* 6. VERIFIED PARTNERS & COMMUNITY TESTIMONIALS */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Backed by Trusted Indian Food Donors & Foundations
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Active across Bengaluru, Mumbai, Delhi-NCR, Hyderabad, and Pune
            </p>
          </div>

          {/* Quotes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700/80 relative space-y-4">
              <Quote className="w-8 h-8 text-emerald-400 opacity-30" />
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                "We cater corporate events and banquets across Bengaluru. In the past, 50-60 surplus meals would go cold while calling NGOs. With this platform, Roti Bank volunteers arrive within 40 minutes of our post. Zero food wasted."
              </p>
              <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">Annapoorna Caterers & Restaurant</div>
                  <div className="text-slate-400 text-[11px]">Indiranagar, Bengaluru</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Verified Food Donor
                </span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700/80 relative space-y-4">
              <Quote className="w-8 h-8 text-emerald-400 opacity-30" />
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                "The countdown badges are a game changer. We immediately know which food will spoil in under 2 hours, allowing us to deploy volunteers with thermal containers to the closest shelters first."
              </p>
              <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">Roti Bank Seva Foundation</div>
                  <div className="text-slate-400 text-[11px]">NITI Aayog DARPAN: DARPAN-KA-2022-04812</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                  Verified NGO Partner
                </span>
              </div>
            </div>

          </div>

          {/* Partner Badges */}
          {stats?.partnerNgos?.length > 0 && (
            <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3">
              {stats.partnerNgos.map((ngo, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs font-medium">
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{ngo.ngo_name}</span>
                  <span className="text-slate-500">({ngo.city})</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 7. HIGH-TRUST COMPREHENSIVE FOOTER */}
      <footer className="mt-auto bg-slate-950 text-slate-400 text-xs border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-black text-lg">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <span>FoodRescue<span className="text-emerald-400">Hub</span></span>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              India's transparent surplus food redistribution platform. Bridging hospitality food surplus with verified community hunger-relief shelters.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold pt-1">
              <Phone className="w-3.5 h-3.5" />
              <span>Emergency Surplus Helpline: +91 1800-425-FOOD (3663)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-white text-xs uppercase tracking-wider">Regulatory Standards</div>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li>• FSSAI Safe Food Share Guidelines</li>
              <li>• NITI Aayog NGO-DARPAN Registry</li>
              <li>• Sec 80G Tax Exemption Compliance</li>
              <li>• UN Sustainable Development Goal 2 & 12</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-white text-xs uppercase tracking-wider">Active Metros</div>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li>• Bengaluru (Koramangala, Indiranagar, HSR)</li>
              <li>• Mumbai (Bandra, Andheri, Dadar)</li>
              <li>• Delhi-NCR (Connaught Place, Gurugram)</li>
              <li>• Hyderabad & Pune</li>
            </ul>
          </div>

        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © 2026 FoodRescueHub India. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>FSSAI Hygiene Assured</span>
            <span>•</span>
            <span>Zero Food Waste Mission</span>
            <span>•</span>
            <span>Terms & Privacy</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
