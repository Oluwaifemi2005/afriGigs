import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Briefcase, Code, ArrowRight, AlertCircle, Building2, MapPin, Phone } from 'lucide-react';

const africanCountries = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'Rwanda',
  'Egypt',
  'Uganda',
  'Tanzania',
  'Cameroon',
  'Senegal',
];

export const Register = () => {
  const [role, setRole] = useState('developer'); // 'client' or 'developer'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [skills, setSkills] = useState('');
  const [githubOrPortfolio, setGithubOrPortfolio] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const userData = {
        name,
        email,
        password,
        role,
        country,
        city,
        phone,
        companyName: role === 'client' ? companyName : '',
        skills: role === 'developer' ? skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        githubOrPortfolio: role === 'developer' ? githubOrPortfolio : '',
      };

      const newUser = await register(userData);
      if (newUser.role === 'client') {
        navigate('/dashboard/client');
      } else {
        navigate('/dashboard/developer');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-8 border border-slate-800 shadow-2xl relative">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/20">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Join GigAfrik</h1>
          <p className="text-xs text-slate-400 mt-1">Unlock localized tech gigs across Africa</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setRole('developer')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              role === 'developer'
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            I'm a Developer
          </button>
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              role === 'client'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            I'm Hiring (Client)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder={role === 'client' ? 'e.g. Amina Al-Hassan' : 'e.g. Kwame Mensah'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white outline-none bg-slate-900"
              >
                {africanCountries.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                placeholder="e.g. Lagos, Accra, Nairobi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              WhatsApp / Phone Number <span className="text-slate-500 font-normal">(for business alerts)</span>
            </label>
            <input
              type="tel"
              placeholder="+234 803 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Dynamic Role-Specific Fields */}
          {role === 'client' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Company or Business Name
              </label>
              <input
                type="text"
                placeholder="e.g. NaijaPay Solutions, Mara Logistics"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Tech Skills <span className="text-slate-500 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Flutter, Python, Tailwind CSS"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  GitHub / Portfolio Link
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username or yourportfolio.dev"
                  value={githubOrPortfolio}
                  onChange={(e) => setGithubOrPortfolio(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs text-slate-950 shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 ${
              role === 'client'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-amber-500/25'
                : 'bg-gradient-to-r from-brand-600 to-emerald-500 shadow-brand-500/25'
            }`}
          >
            {loading ? 'Creating Profile...' : `Register as ${role === 'client' ? 'Client' : 'Developer'}`}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold">
            Sign In here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
