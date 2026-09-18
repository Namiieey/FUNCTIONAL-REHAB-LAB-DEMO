import React, { useState } from 'react';
import { api } from '../services/api.js';
import { User } from '../types.js';
import { Shield, User as UserIcon, ArrowRight, UserPlus, Database, Stethoscope, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [activePortal, setActivePortal] = useState<'patient' | 'staff'>('patient');
  const [isRegistering, setIsRegistering] = useState(false);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Patient Registration state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('30');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const u = customUser || username;
    const p = customPass || password;

    if (!u || !p) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.login(u, p);
      onSuccess(res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFastLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    try {
      setLoading(true);
      setError(null);
      const res = await api.login(u, p);
      onSuccess(res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fast authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !username || !password) {
      setError('Full name, phone, username, and password are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.register({
        username,
        password,
        fullName,
        phone,
        email: email || undefined,
        gender,
        age: age ? parseInt(age, 10) : undefined,
        medicalHistory,
        emergencyContact
      });
      onSuccess(res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#FF5500]/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Logo & Title */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border-2 border-[#FF5500] shadow-[0_4px_20px_rgba(255,85,0,0.25)] mb-4 overflow-hidden">
          <img
            src="https://plain-apac-prod-public.komododecks.com/202609/17/Kw2mXJAzBAz9GQSJUTXp/image.jpg"
            alt="Functional Rehab Lab"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-display">
          FUNCTIONAL <span className="text-[#FF5500]">REHAB LAB</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-600 font-medium">
          Advanced Orthopedic & Kinetic Physical Rehabilitation
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xl">

          {/* Quick Demo Access Bar */}
          <div className="mb-6 p-3 rounded-2xl bg-orange-50/70 border border-orange-200/80">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#FF5500] uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Role Logins:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-demo-cloudfare-admin"
                onClick={() => handleFastLogin('cloudfare', 'admin123')}
                disabled={loading}
                className="py-2 px-2 rounded-xl bg-white border border-gray-300 hover:border-[#FF5500] text-gray-900 font-extrabold text-[11px] transition shadow-xs flex flex-col items-center justify-center cursor-pointer text-center"
              >
                <Database className="w-4 h-4 text-[#FF5500] mb-0.5" />
                <span className="truncate w-full font-display">Cloudfare</span>
                <span className="text-[9px] text-[#FF5500] font-bold">Admin</span>
              </button>

              <button
                type="button"
                id="btn-demo-doctor"
                onClick={() => handleFastLogin('doctor_ananya', 'doctor123')}
                disabled={loading}
                className="py-2 px-2 rounded-xl bg-white border border-gray-300 hover:border-[#FF5500] text-gray-900 font-extrabold text-[11px] transition shadow-xs flex flex-col items-center justify-center cursor-pointer text-center"
              >
                <Stethoscope className="w-4 h-4 text-blue-600 mb-0.5" />
                <span className="truncate w-full font-display">Dr. Ananya</span>
                <span className="text-[9px] text-blue-600 font-bold">Doctor</span>
              </button>

              <button
                type="button"
                id="btn-demo-patient"
                onClick={() => handleFastLogin('vikram_rao', 'patient123')}
                disabled={loading}
                className="py-2 px-2 rounded-xl bg-white border border-gray-300 hover:border-[#FF5500] text-gray-900 font-extrabold text-[11px] transition shadow-xs flex flex-col items-center justify-center cursor-pointer text-center"
              >
                <UserIcon className="w-4 h-4 text-emerald-600 mb-0.5" />
                <span className="truncate w-full font-display">Vikram Rao</span>
                <span className="text-[9px] text-emerald-600 font-bold">Patient</span>
              </button>
            </div>
          </div>

          {/* Portal Switcher */}
          <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200 mb-6">
            <button
              id="tab-patient-portal"
              type="button"
              onClick={() => {
                setActivePortal('patient');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer tracking-wider ${
                activePortal === 'patient'
                  ? 'bg-[#FF5500] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>PATIENT PORTAL</span>
            </button>
            <button
              id="tab-staff-portal"
              type="button"
              onClick={() => {
                setActivePortal('staff');
                setIsRegistering(false);
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer tracking-wider ${
                activePortal === 'staff'
                  ? 'bg-[#FF5500] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>DOCTOR / ADMIN</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Staff Login Flow */}
          {activePortal === 'staff' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Doctor / Admin Username
                </label>
                <div className="relative">
                  <input
                    id="input-staff-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="e.g. cloudfare or doctor_ananya"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5500] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Secure Password
                </label>
                <input
                  id="input-staff-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5500] transition"
                />
              </div>

              <button
                id="btn-staff-login"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? 'Authenticating...' : 'Access Clinical Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Patient Portal Flow: Login or Register */}
          {activePortal === 'patient' && !isRegistering && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Patient Username
                </label>
                <input
                  id="input-patient-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. vikram_rao"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5500] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  id="input-patient-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5500] transition"
                />
              </div>

              <button
                id="btn-patient-login"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Signing In...' : 'Sign In to Patient Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 text-center border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  New to Functional Rehab Lab?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setError(null);
                    }}
                    className="text-[#FF5500] hover:underline font-extrabold cursor-pointer"
                  >
                    Register as Patient
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Patient Registration Form */}
          {activePortal === 'patient' && isRegistering && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    id="reg-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Vikram Rao"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Phone Number *
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+91 98450 00000"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Choose Username *
                  </label>
                  <input
                    id="reg-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="e.g. vikram_rehab"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Password *
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min 6 chars"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Age</label>
                  <input
                    id="reg-age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Gender</label>
                  <select
                    id="reg-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Primary Injury / Rehab Complaints
                </label>
                <textarea
                  id="reg-medical-history"
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  rows={2}
                  placeholder="e.g. Chronic shoulder pain, hamstring tear, post-operative recovery..."
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Emergency Contact
                </label>
                <input
                  id="reg-emergency"
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Name and phone number"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
                />
              </div>

              <button
                id="btn-patient-submit-reg"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Registering Account...' : 'Complete Patient Registration'}
                <UserPlus className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-xs text-gray-600 hover:text-gray-900 transition cursor-pointer"
                >
                  Already have an account? <span className="text-[#FF5500] font-bold">Sign In</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
