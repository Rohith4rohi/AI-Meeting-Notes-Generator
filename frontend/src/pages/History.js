import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mic, Clock, FileText, CheckSquare, Trash2, ArrowRight, Filter } from 'lucide-react';
import api from '../utils/api';
import { formatRelative, formatDuration, statusClass } from '../utils/helpers';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['all','completed','processing','failed'];

export default function History() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMeetings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const { data } = await api.get(`/meetings?${params}`);
      setMeetings(data.meetings);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load meetings'); }
    finally { setLoading(false); }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { fetchMeetings(1); }, [fetchMeetings]);

  const deleteMeeting = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this meeting?')) return;
    try {
      await api.delete(`/meetings/${id}`);
      toast.success('Meeting deleted');
      fetchMeetings(pagination.page);
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Meeting History</h1>
          <p className="subtitle">{pagination.total} total meetings</p>
        </div>
      </div>

      <div className="page-content">
        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={16} className="icon" />
            <input placeholder="Search meetings..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }} onClick={() => setSearch('')}>✕</button>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textTransform: 'capitalize' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, width: '35%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="empty-state">
            <Mic size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3>{search || statusFilter !== 'all' ? 'No results found' : 'No meetings yet'}</h3>
            <p>{search ? 'Try adjusting your search or filters' : 'Upload your first meeting recording to get started'}</p>
            {!search && statusFilter === 'all' && (
              <button className="btn btn-primary" onClick={() => navigate('/upload')}>Upload Recording</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {meetings.map(m => (
              <MeetingCard key={m._id} meeting={m} onClick={() => navigate(`/meetings/${m._id}`)} onDelete={(e) => deleteMeeting(e, m._id)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
            <button className="btn btn-secondary btn-sm" disabled={pagination.page === 1}
              onClick={() => fetchMeetings(pagination.page - 1)}>Previous</button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)', padding: '0 8px' }}>
              {pagination.page} / {pagination.pages}
            </span>
            <button className="btn btn-secondary btn-sm" disabled={pagination.page >= pagination.pages}
              onClick={() => fetchMeetings(pagination.page + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingCard({ meeting, onClick, onDelete }) {
  const statusColors = {
    completed: 'var(--green)',
    failed: 'var(--rose)',
    uploading: 'var(--accent)',
    processing: 'var(--amber)',
    transcribing: 'var(--amber)',
    analyzing: 'var(--amber)',
  };

  return (
    <div className="card" style={{ cursor: 'pointer', transition: 'all var(--transition)' }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Mic size={20} color="var(--accent-bright)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meeting.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatRelative(meeting.createdAt)}</span>
            {meeting.duration > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{formatDuration(meeting.duration)}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
              <span className="status-dot" style={{ background: statusColors[meeting.status] || 'var(--text-muted)' }} />
              <span style={{ color: statusColors[meeting.status] || 'var(--text-muted)', textTransform: 'capitalize' }}>{meeting.status}</span>
            </span>
            {meeting.tags?.slice(0, 2).map(t => <span key={t} className="badge badge-muted">{t}</span>)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete} title="Delete"
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--rose)'; e.stopPropagation(); }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            style={{ color: 'var(--text-muted)' }}>
            <Trash2 size={15} />
          </button>
          <ArrowRight size={16} color="var(--text-muted)" />
        </div>
      </div>
    </div>
  );
}
