import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, CheckSquare, Clock, TrendingUp, Plus, ArrowRight, Calendar } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatRelative, formatDuration, statusClass, statusLabel } from '../utils/helpers';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/meetings/stats/overview')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    { label: 'Total Meetings', value: stats?.stats?.total ?? 0, icon: Mic, color: 'var(--accent)', bg: 'var(--accent-glow)' },
    { label: 'Completed', value: stats?.stats?.completed ?? 0, icon: CheckSquare, color: 'var(--green)', bg: 'var(--green-dim)' },
    { label: 'This Month', value: stats?.stats?.thisMonth ?? 0, icon: Calendar, color: 'var(--teal)', bg: 'var(--teal-dim)' },
    { label: 'Open Tasks', value: stats?.stats?.actionItems?.pending ?? 0, icon: TrendingUp, color: 'var(--amber)', bg: 'var(--amber-dim)' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="subtitle">Here's what's happening with your meetings</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/upload')}>
          <Plus size={16} /> New Meeting
        </button>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div className="stat-card" key={label}>
              <div className="stat-icon" style={{ background: bg }}>
                <Icon size={18} color={color} />
              </div>
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ color }}>{loading ? '—' : value}</div>
            </div>
          ))}
        </div>

        {/* Recent meetings */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 17 }}>Recent Meetings</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
              View all <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 12, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.recentMeetings?.length ? (
            <div>
              {stats.recentMeetings.map((m) => (
                <div key={m._id} onClick={() => navigate(`/meetings/${m._id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 10px', borderRadius: 10, cursor: 'pointer', transition: 'background var(--transition)', marginBottom: 4 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mic size={18} color="var(--accent-bright)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span>{formatRelative(m.createdAt)}</span>
                      {m.duration > 0 && <><span>·</span><Clock size={11} /><span>{formatDuration(m.duration)}</span></>}
                      {m.wordCount > 0 && <><span>·</span><span>{m.wordCount} words</span></>}
                    </div>
                  </div>
                  <ArrowRight size={15} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 20px' }}>
              <Mic size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3>No meetings yet</h3>
              <p>Upload your first meeting recording to get started</p>
              <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                <Plus size={15} /> Upload Recording
              </button>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid-2">
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/upload')}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={22} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 3 }}>Upload New Recording</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>MP3, WAV, M4A supported</div>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
            </div>
          </div>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/history')}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--teal)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--teal-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={22} color="var(--teal)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 3 }}>Meeting History</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Browse all past meetings</div>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
