import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  HeartHandshake, 
  LogOut, 
  Menu, 
  X,
  Bell,
  CheckCircle,
  AlertCircle,
  Truck,
  IndianRupee,
  Mail,
  MapPin,
  Clock,
  User
} from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification Center State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications for logged-in user
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      // Quiet fail if network/session blip
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // 15s poll
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const getProfileUrl = () => {
    if (role === 'donor') return '/donor?tab=profile';
    if (role === 'ngo') return '/ngo?tab=profile';
    if (role === 'volunteer') return '/volunteer?tab=profile';
    if (role === 'admin') return '/admin';
    return '/';
  };

  // Format relative time
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to={role === 'admin' ? '/admin' : role === 'ngo' ? '/ngo' : role === 'donor' ? '/donor' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                FoodRescue<span className="text-emerald-600">Hub</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Expiry & NGO Coordination
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Public Impact: Hidden when logged in as NGO or Admin */}
            {role !== 'ngo' && role !== 'admin' && (
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Public Impact
              </Link>
            )}

            {/* Surplus Feed: Hidden when logged in as Donor, Volunteer, or Admin */}
            {role !== 'donor' && role !== 'volunteer' && role !== 'admin' && (
              <Link
                to="/ngo"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/ngo') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Surplus Feed
              </Link>
            )}

            {role === 'donor' && (
              <Link
                to="/donor"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive('/donor') ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-emerald-50'
                }`}
              >
                Donor Portal
              </Link>
            )}

            {role === 'volunteer' && (
              <Link
                to="/volunteer"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive('/volunteer') ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-emerald-50'
                }`}
              >
                Volunteer Hub & Earnings
              </Link>
            )}

            {role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive('/admin') ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Admin Control
              </Link>
            )}

          </nav>

          {/* Right Controls: User Profile, Notifications & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Authenticated Controls */}
            {user ? (
              <div className="flex items-center gap-2.5">
                
                {/* Notification Bell Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(!notifDropdownOpen);
                      fetchNotifications();
                    }}
                    className="relative p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    title="In-App & Email Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Panel */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      
                      {/* Dropdown Header */}
                      <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notification Items List */}
                      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            No notifications yet. You will receive real-time alerts for donations, claims, and delivery payouts.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className={`p-3.5 transition-colors cursor-pointer ${
                                notif.is_read === 0
                                  ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                                  : 'hover:bg-slate-50 opacity-80'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="mt-0.5 flex-shrink-0">
                                  {notif.type === 'alert' && (
                                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                      <AlertCircle className="w-4 h-4" />
                                    </div>
                                  )}
                                  {notif.type === 'success' && (
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                      <CheckCircle className="w-4 h-4" />
                                    </div>
                                  )}
                                  {notif.type === 'info' && (
                                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                                      <Truck className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="text-xs font-bold text-slate-900 truncate">
                                      {notif.title}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                      {formatTimeAgo(notif.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                    {notif.message}
                                  </p>

                                  {/* Badges: Email Dispatched & In-App */}
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                      <Mail className="w-2.5 h-2.5" />
                                      Email Sent
                                    </span>
                                    {notif.is_read === 0 && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* User info & City Zone Tag (Clickable to Profile) */}
                <Link
                  to={getProfileUrl()}
                  className="hidden lg:flex flex-col text-right group p-1 -mr-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  title="View & Edit Profile"
                >
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">
                      {user.name}
                    </span>
                    <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    {/* Location Badge: Hidden for Admin */}
                    {role !== 'admin' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        <MapPin className="w-2.5 h-2.5 text-rose-500" />
                        {user.city || 'Bengaluru'}
                      </span>
                    )}
                    <span className={`text-[10px] capitalize font-bold ${role === 'admin' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {user.role} {user.profile?.verified === 0 && '(Pending)'}
                    </span>
                  </div>
                </Link>

                {/* Sign out button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-1">
            {role !== 'ngo' && role !== 'admin' && (
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Public Impact
              </Link>
            )}
            {/* Surplus Feed: Hidden for Donor, Volunteer, and Admin */}
            {role !== 'donor' && role !== 'volunteer' && role !== 'admin' && (
              <Link
                to="/ngo"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Surplus Food Feed
              </Link>
            )}
            {role === 'donor' && (
              <Link
                to="/donor"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50"
              >
                Donor Dashboard
              </Link>
            )}
            {role === 'volunteer' && (
              <Link
                to="/volunteer"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-sky-700 bg-sky-50"
              >
                Volunteer Hub & Earnings
              </Link>
            )}
            {role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-900 bg-slate-100"
              >
                Administrator Control
              </Link>
            )}

            {user && (
              <Link
                to={getProfileUrl()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between border-t border-slate-100 mt-2 pt-2"
              >
                <span>My Profile & Settings</span>
                <span className="text-xs text-emerald-600 capitalize">{role}</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
