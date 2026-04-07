import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Mic, Clock, FileText, CheckSquare, Users, Check } from 'lucide-react';
import api from '../utils/api';
import { formatDate, formatDuration } from '../utils/helpers';

export default function SharedMeeting() {
  const { token } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('summary');

  useEffect(() => {
    api.get(`/meetings/shared/${token}`)
      .then(({ data }) => setMeeting(data.meeting))
      .catch(() => setError('Meeting not found or link has expired'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)', padding: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>{error}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>The share link may have been revoked or is invalid.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="logo-icon" style={{ width: 32, height: 32, borderRadius: 9 }}><Mic size={15} color="white" /></div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, background: 'linear-gradient(135deg, #fff, var(--accent-bright))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MeetMind</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>Shared Meeting</span>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>{meeting.title}</h1>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
            <span>{formatDate(meeting.createdAt)}</span>
            {meeting.duration > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{formatDuration(meeting.duration)}</span>}
            {meeting.wordCount > 0 && <span>{meeting.wordCount} words</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          {[
            { key: 'summary', icon: FileText, label: 'Summary' },
            { key: 'actions', icon: CheckSquare, label: `Actions (${meeting.actionItems?.length || 0})` },
            { key: 'transcript', icon: FileText, label: 'Transcript' },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: '10px 16px', fontSize: 14, fontWeight: 500, background: 'none', border: 'none', borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent', color: tab === key ? 'var(--accent-bright)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '-1px' }}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {tab === 'summary' && (
          <div>
            {meeting.summary?.overview && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, marginBottom: 12 }}>Overview</h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>{meeting.summary.overview}</p>
              </div>
            )}
            {meeting.summary?.keyPoints?.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: 15, marginBottom: 14 }}>Key Points</h3>
                {meeting.summary.keyPoints.map((p, i) => (
                  <div key={i} className="key-point"><div className="key-point-bullet" /><span className="key-point-text">{p}</span></div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'actions' && (
          <div>
            {meeting.actionItems?.map(item => (
              <div key={item.id} className={`action-item ${item.completed ? 'completed' : ''}`}>
                <div className={`checkbox-custom ${item.completed ? 'checked' : ''}`} style={{ pointerEvents: 'none' }}>
                  {item.completed && <Check size={11} color="white" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="action-text">{item.task}</div>
                  <div className="action-meta">
                    <span className={`badge ${item.priority === 'high' ? 'priority-high' : item.priority === 'low' ? 'priority-low' : 'priority-medium'}`}>{item.priority}</span>
                    {item.assignee && <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} />{item.assignee}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'transcript' && (
          <div>
            {meeting.transcript?.segments?.map((seg, i) => (
              <div key={i} className="transcript-segment">
                <div className={`speaker-label speaker-${(parseInt(seg.speaker?.replace(/\D/g,'') || 1) % 4) || 1}`}>{seg.speaker}</div>
                <div className="transcript-text">{seg.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
