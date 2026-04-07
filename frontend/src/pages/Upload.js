import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileAudio, X, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { formatFileSize } from '../utils/helpers';
import toast from 'react-hot-toast';

// const ACCEPTED = { 
//   //Audio formats
//   'audio/mpeg': ['.mp3'], 'audio/wav': ['.wav'], 'audio/x-m4a': ['.m4a'], 'audio/mp4': ['.m4a', '.mp4'], 'audio/ogg': ['.ogg'], 'audio/webm': ['.webm'],
//   //Video formats
//   'video/mp4': ['.mp4'], 'video/webm': ['.webm'], 'video/x-matroska': ['.mkv'], 'video/quicktime': ['.mov']
// };

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({ title: '', description: '' });
  const fileRef = useRef();

const handleFile = (f) => {
  if (!f) return;

  const ok =
    [
      // audio
      'audio/mpeg','audio/wav','audio/x-m4a','audio/mp4','audio/ogg','audio/webm',
      // video
      'video/mp4','video/webm','video/x-matroska','video/quicktime'
    ].includes(f.type)
    || f.name.match(/\.(mp3|wav|m4a|ogg|webm|mp4|mkv|mov)$/i);

  if (!ok) return toast.error('Invalid file type. Supported: Audio & Video files');

  // ✅ DIFFERENT SIZE LOGIC
  const isVideo = f.type?.startsWith("video");

  const maxSize = isVideo 
    ? 500 * 1024 * 1024   // 🎥 video = 500MB
    : 200 * 1024 * 1024;  // 🎤 audio = 200MB

  if (f.size > maxSize) {
    return toast.error(
      isVideo 
        ? "Video file too large (max 500MB)" 
        : "Audio file too large (max 200MB)"
    );
  }

  setFile(f);

  if (!form.title) {
    setForm(p => ({
      ...p,
      title: f.name.replace(/\.[^/.]+$/, '')
    }));
  }
};

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    if (!form.title.trim()) return toast.error('Please enter a meeting title');

    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', form.title);
    fd.append('description', form.description);

    try {
      const { data } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => setProgress(Math.round((ev.loaded / ev.total) * 100))
      });
      toast.success('Upload successful! Processing started...');
      navigate(`/meetings/${data.meeting._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Upload Recording</h1>
          <p className="subtitle">Transform your meeting audio into structured notes</p>
        </div>
      </div>
      <div className="page-content">
        <div style={{ maxWidth: 680 }}>
          <form onSubmit={handleSubmit}>
            {/* Drop zone */}
            {!file ? (
              <div
                className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                onClick={() => fileRef.current?.click()}
                style={{ marginBottom: 24 }}>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <UploadIcon size={26} color="var(--accent)" />
                </div>
                <h3>Drop your audio or video file here</h3>
                <p>or click to browse your files</p>
                <div className="upload-formats">Supported: MP3, WAV, M4A, OGG, WEBM , MP4, MKV, MOV, · Max 500MB (video) / 200MB (audio)</div>
                <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a,.ogg,.webm,.mp4,.mkv,.mov,audio/*,video/*" style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files?.[0])} />
              </div>
            ) : (
              <div className="card card-accent" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {file.type.startsWith("video") ? (
                      <span>🎥</span>
                    ) : (
                      <FileAudio size={22} color="var(--accent)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatFileSize(file.size)}</div>
                    {uploading && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Uploading...</span><span>{progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill animated" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {!uploading && (
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => setFile(null)}>
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Form fields */}
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, marginBottom: 18 }}>Meeting Details</h3>
              <div className="form-group">
                <label className="form-label">Meeting Title *</label>
                <input className="form-input" type="text" placeholder="e.g. Q4 Product Planning Sync"
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                <textarea className="form-input" placeholder="What was this meeting about?" rows={3}
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>

            {/* Info card */}
            <div className="card" style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <AlertCircle size={18} color="var(--accent-bright)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>How it works:</strong> After uploading, our AI will transcribe your audio, identify speakers, generate a summary, and extract action items automatically. This usually takes 1–3 minutes.
                  <br /><br />
                  <strong style={{ color: 'var(--text-primary)' }}>No API key?</strong> The app runs in demo mode with sample data so you can explore all features.
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={!file || uploading} style={{ width: '100%', justifyContent: 'center' }}>
              {uploading ? (
                <><Loader size={16} className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', width: 16, height: 16 }} /> Processing...</>
              ) : (
                <><UploadIcon size={16} /> Upload & Analyze</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
