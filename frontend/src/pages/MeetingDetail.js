import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Clock, FileText, CheckSquare, Users, Tag, Copy, RefreshCw, Trash2, Edit2, Check, X } from 'lucide-react';
import api from '../utils/api';
import { formatDate, formatDuration, formatFileSize } from '../utils/helpers';
import toast from 'react-hot-toast';

const PROCESSING_STATUSES = ['uploading','processing','transcribing','analyzing'];
const SPEAKER_CLASSES = ['speaker-1','speaker-2','speaker-3','speaker-4'];

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('summary');
  const [polling, setPolling] = useState(false);
  const pollRef = useRef(null);

  const fetchMeeting = useCallback(async () => {
    try {
      const { data } = await api.get(`/meetings/${id}`);
      setMeeting(data.meeting);
      return data.meeting;
    } catch (err) {
      toast.error('Meeting not found');
      navigate('/history');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchMeeting().then(m => {
      if (m && PROCESSING_STATUSES.includes(m.status)) startPolling();
    });
    return () => clearInterval(pollRef.current);
  }, [fetchMeeting]);

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPolling(true);
    const intervalId = setInterval(async () => {
      try {
        const { data } = await api.get(`/meetings/${id}/status`);
        if (!PROCESSING_STATUSES.includes(data.status)) {
          clearInterval(intervalId);
          if (pollRef.current === intervalId) {
            pollRef.current = null;
            setPolling(false);
            fetchMeeting();
            if (data.status === 'completed') toast.success('Meeting processed successfully!');
            else if (data.status === 'failed') toast.error('Processing failed: ' + (data.error || 'Unknown error'));
          }
        }
      } catch { 
        clearInterval(intervalId); 
        if (pollRef.current === intervalId) setPolling(false);
      }
    }, 3000);
    pollRef.current = intervalId;
  };

  const toggleActionItem = async (itemId, completed) => {
    try {
      const { data } = await api.patch(`/meetings/${id}/action-items/${itemId}`, { completed });
      setMeeting(data.meeting);
    } catch { toast.error('Failed to update task'); }
  };

  const updateAssignee = async (itemId, assignee) => {
    try {
      const { data } = await api.patch(`/meetings/${id}/action-items/${itemId}`, { assignee });
      setMeeting(data.meeting);
    } catch { toast.error('Failed to update assignee'); }
  };

  const shareLink = async () => {
    try {
      const { data } = await api.post(`/meetings/${id}/share`);
      await navigator.clipboard.writeText(data.shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch { toast.error('Failed to generate share link'); }
  };

  const handleExport = async (type) => {
    const toastId = toast.loading(`Generating ${type.toUpperCase()}...`);
    try {
      const { data } = await api.get(`/export/${id}/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${meeting?.title?.replace(/[^a-z0-9]/gi, '_') || 'Meeting_Notes'}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Download started', { id: toastId });
    } catch { 
      toast.error(`Failed to export ${type.toUpperCase()}`, { id: toastId }); 
    }
  };

  const exportPDF = () => handleExport('pdf');
  const exportDOCX = () => handleExport('docx');

  const deleteMeeting = async () => {
    if (!window.confirm('Delete this meeting? This cannot be undone.')) return;
    try {
      await api.delete(`/meetings/${id}`);
      toast.success('Meeting deleted');
      navigate('/history');
    } catch { toast.error('Failed to delete meeting'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  if (!meeting) return null;

  const isProcessing = PROCESSING_STATUSES.includes(meeting.status);

  const statusMessages = {
    uploading: 'Uploading your audio file...',
    processing: 'Starting AI processing...',
    transcribing: 'Transcribing audio with Whisper AI...',
    analyzing: 'Analyzing content and extracting action items...',
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
            <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22 }}>{meeting.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(meeting.createdAt)}</span>
                {meeting.duration > 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{formatDuration(meeting.duration)}</span>}
                {meeting.wordCount > 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{meeting.wordCount} words</span>}
                <StatusBadge status={meeting.status} />
              </div>
            </div>
          </div>
          {!isProcessing && meeting.status === 'completed' && (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={shareLink}><Share2 size={14} /> Share</button>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button className="btn btn-secondary btn-sm" onClick={exportPDF}><Download size={14} /> PDF</button>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={exportDOCX}><Download size={14} /> DOCX</button>
              <button className="btn btn-danger btn-sm" onClick={deleteMeeting}><Trash2 size={14} /></button>
            </div>
          )}
        </div>

        {/* Tags */}
        {meeting.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 48, paddingBottom: 16 }}>
            {meeting.tags.map(t => <span key={t} className="badge badge-muted"><Tag size={10} />{t}</span>)}
          </div>
        )}

        {/* Tabs */}
        {!isProcessing && (
          <div style={{ paddingLeft: 16, paddingRight: 32, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 0 }}>
              {[
                { key: 'summary', icon: FileText, label: 'Summary' },
                { key: 'actions', icon: CheckSquare, label: `Actions (${meeting.actionItems?.length || 0})` },
                { key: 'transcript', icon: FileText, label: 'Transcript' },
                { key: 'participants', icon: Users, label: 'Participants' },
              ].map(({ key, icon: Icon, label }) => (
                <button key={key} onClick={() => setTab(key)}
                  style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, background: 'none', border: 'none', borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent', color: tab === key ? 'var(--accent-bright)' : 'var(--text-secondary)', transition: 'all var(--transition)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: '-1px' }}>
                  <Icon size={15} />{label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="page-content">
        {/* Processing state */}
        {isProcessing && (
          <div className="card card-accent" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', padding: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--accent)' }} />
            </div>
            <h2 style={{ fontSize: 20, marginBottom: 10 }}>Processing your meeting</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
              {statusMessages[meeting.status]}
            </p>
            <div className="progress-bar" style={{ marginBottom: 12 }}>
              <div className="progress-fill animated" style={{ width: meeting.status === 'uploading' ? '20%' : meeting.status === 'processing' ? '40%' : meeting.status === 'transcribing' ? '65%' : '85%' }} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>This usually takes 1-3 minutes. Page auto-refreshes.</p>
          </div>
        )}

        {meeting.status === 'failed' && (
          <div className="card" style={{ borderColor: 'var(--rose)', background: 'var(--rose-dim)', maxWidth: 560 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <X size={20} color="var(--rose)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--rose)' }}>Processing Failed</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{meeting.processingError || 'An unknown error occurred'}</div>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/upload')}>Try Again</button>
              </div>
            </div>
          </div>
        )}

        {/* Summary tab */}
        {tab === 'summary' && meeting.status === 'completed' && (
          <div style={{ maxWidth: 760 }}>
            {meeting.summary?.overview && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent-glow)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>📝</span>
                  Overview
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>{meeting.summary.overview}</p>
              </div>
            )}

            {meeting.summary?.keyPoints?.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--teal-dim)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>💡</span>
                  Key Points
                </h3>
                {meeting.summary.keyPoints.map((p, i) => (
                  <div key={i} className="key-point">
                    <div className="key-point-bullet" />
                    <span className="key-point-text">{p}</span>
                  </div>
                ))}
              </div>
            )}

            {meeting.summary?.topics?.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: 15, marginBottom: 14 }}>Topics Discussed</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {meeting.summary.topics.map(t => <span key={t} className="badge badge-teal">{t}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action items tab */}
        {tab === 'actions' && meeting.status === 'completed' && (
          <div style={{ maxWidth: 760 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {meeting.actionItems?.filter(i => i.completed).length || 0} of {meeting.actionItems?.length || 0} completed
                </span>
              </div>
              {meeting.actionItems?.length > 0 && (
                <div className="progress-bar" style={{ width: 120 }}>
                  <div className="progress-fill" style={{ width: `${((meeting.actionItems.filter(i=>i.completed).length / meeting.actionItems.length) * 100).toFixed(0)}%` }} />
                </div>
              )}
            </div>

            {meeting.actionItems?.length > 0 ? meeting.actionItems.map(item => (
              <ActionItem key={item.id} item={item}
                onToggle={(completed) => toggleActionItem(item.id, completed)}
                onAssigneeChange={(assignee) => updateAssignee(item.id, assignee)} />
            )) : (
              <div className="empty-state">
                <CheckSquare size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h3>No action items found</h3>
                <p>No tasks were detected in this meeting</p>
              </div>
            )}
          </div>
        )}

        {/* Transcript tab */}
        {tab === 'transcript' && meeting.status === 'completed' && (
          <div style={{ maxWidth: 760 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15 }}>Full Transcript</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(meeting.transcript?.full || ''); toast.success('Copied!'); }}>
                <Copy size={13} /> Copy
              </button>
            </div>
            {meeting.transcript?.segments?.length > 0 ? (
              meeting.transcript.segments.map((seg, i) => {
                const speakerIdx = parseInt(seg.speaker?.replace(/\D/g, '') || '1') - 1;
                return (
                  <div key={i} className="transcript-segment">
                    <div className={`speaker-label ${SPEAKER_CLASSES[speakerIdx % 4]}`}>{seg.speaker}</div>
                    <div>
                      <div className="transcript-text">{seg.text}</div>
                      {seg.startTime !== undefined && (
                        <div className="transcript-time">{formatDuration(seg.startTime)} – {formatDuration(seg.endTime)}</div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="card" style={{ padding: 24 }}>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {meeting.transcript?.full || 'No transcript available'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Participants tab */}
        {tab === 'participants' && meeting.status === 'completed' && (
          <div style={{ maxWidth: 540 }}>
            <h3 style={{ fontSize: 15, marginBottom: 20 }}>Meeting Participants</h3>
            {meeting.participants?.length > 0 ? meeting.participants.map((p, i) => (
              <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `hsl(${i * 60}, 60%, 25%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: `hsl(${i * 60}, 80%, 70%)`, flexShrink: 0 }}>
                  {(p.name || '?').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>{p.name}</div>
                  {p.role && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.role}</div>}
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <Users size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h3>No participants detected</h3>
                <p>Participant names were not found in this transcript</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    completed: { label: 'Completed', cls: 'badge-green' },
    failed: { label: 'Failed', cls: 'badge-rose' },
    uploading: { label: 'Uploading', cls: 'badge-accent' },
    processing: { label: 'Processing', cls: 'badge-amber' },
    transcribing: { label: 'Transcribing', cls: 'badge-amber' },
    analyzing: { label: 'Analyzing', cls: 'badge-amber' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'badge-muted' };
  return (
    <span className={`badge ${cls}`}>
      <span className={`status-dot ${cls.replace('badge-','') === 'green' ? 'completed' : cls.includes('amber') ? 'processing' : cls.includes('rose') ? 'failed' : 'uploading'}`} />
      {label}
    </span>
  );
}

function ActionItem({ item, onToggle, onAssigneeChange }) {
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [assigneeValue, setAssigneeValue] = useState(item.assignee || '');

  const saveAssignee = () => {
    onAssigneeChange(assigneeValue);
    setEditingAssignee(false);
  };

  return (
    <div className={`action-item ${item.completed ? 'completed' : ''}`}>
      <button className={`checkbox-custom ${item.completed ? 'checked' : ''}`} onClick={() => onToggle(!item.completed)}>
        {item.completed && <Check size={11} color="white" />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="action-text">{item.task}</div>
        <div className="action-meta">
          <span className={`badge ${item.priority === 'high' ? 'priority-high' : item.priority === 'low' ? 'priority-low' : 'priority-medium'}`}>
            {item.priority}
          </span>
          {editingAssignee ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input value={assigneeValue} onChange={e => setAssigneeValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveAssignee(); if (e.key === 'Escape') setEditingAssignee(false); }}
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-accent)', borderRadius: 6, color: 'var(--text-primary)', padding: '3px 8px', fontSize: 12, outline: 'none', width: 120 }}
                placeholder="Assignee name" autoFocus />
              <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={saveAssignee}><Check size={13} color="var(--green)" /></button>
              <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={() => setEditingAssignee(false)}><X size={13} color="var(--text-muted)" /></button>
            </div>
          ) : (
            <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 12, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => setEditingAssignee(true)}>
              <Users size={11} />
              {item.assignee || <span style={{ color: 'var(--text-muted)' }}>Assign</span>}
              <Edit2 size={10} color="var(--text-muted)" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
