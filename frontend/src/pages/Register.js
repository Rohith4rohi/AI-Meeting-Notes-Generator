import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill in all fields');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to MeetMind!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, icon, type, placeholder) => (
    <div className="form-group">
      <label className="form-label">{key.charAt(0).toUpperCase() + key.slice(1)}</label>
      <div style={{ position: 'relative' }}>
        {React.createElement(icon, { size: 16, style: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' } })}
        <input className="form-input" style={{ paddingLeft: 38 }} type={type} placeholder={placeholder}
          value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required />
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div className="logo-icon" style={{ width: 48, height: 48, borderRadius: 14 }}><Mic size={22} color="white" /></div>
          </div>
          <h1>Create account</h1>
          <p>Start turning meetings into action</p>
        </div>
        <form onSubmit={handleSubmit}>
          {field('name', User, 'text', 'Your full name')}
          {field('email', Mail, 'email', 'you@company.com')}
          {field('password', Lock, 'password', 'Min 6 characters')}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: 38 }} type="password" placeholder="Repeat password"
                value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? <div className="spinner" /> : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-bright)', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
