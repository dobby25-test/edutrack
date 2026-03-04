import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const formatDate = (value) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString();
};

export default function StudentProfile({ onClose, theme = 'light', onToggleTheme }) {
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    void fetchProfile();
  }, []);

  const canUpload = useMemo(() => Boolean(selectedFile && previewSrc && !uploading), [selectedFile, previewSrc, uploading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile/me');
      setProfile(res.data?.user || null);
      setBadges(res.data?.badges || []);
      setStats(res.data?.stats || {});
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetUploadState = () => {
    setPreviewSrc('');
    setSelectedFile(null);
    setUploadError('');
    setDragActive(false);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    resetUploadState();
  };

  const validateFile = (file) => {
    if (!file) return 'No file selected.';
    if (!ALLOWED_TYPES.has(file.type)) return 'Only JPG, PNG, and WebP images are allowed.';
    if (file.size > MAX_PHOTO_SIZE) return 'File size must be 5MB or less.';
    return '';
  };

  const preparePreview = (file) => {
    const validation = validateFile(file);
    if (validation) {
      setUploadError(validation);
      setSelectedFile(null);
      setPreviewSrc('');
      return;
    }

    setUploadError('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewSrc(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      setUploadError('Could not read selected file. Please try another image.');
      setSelectedFile(null);
      setPreviewSrc('');
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) preparePreview(file);
  };

  const handleUpload = async () => {
    if (!canUpload) return;

    try {
      setUploading(true);
      setUploadError('');
      await api.post('/profile/upload-photo', { photoUrl: previewSrc });
      await fetchProfile();
      closeUploadModal();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploading(true);
      setUploadError('');
      await api.delete('/profile/remove-photo');
      await fetchProfile();
      closeUploadModal();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to remove photo.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className={`sp-page ${theme}`}>
        <div className="sp-loading-wrap">
          <div className="sp-loading-card">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`sp-page ${theme}`}>
        <div className="sp-loading-wrap">
          <div className="sp-loading-card">Could not load profile.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div className={`sp-page ${theme}`}>
        <div className="sp-header-row">
          <button type="button" className="sp-link-btn" onClick={onClose}>Back to Dashboard</button>
          <button type="button" className="sp-theme-btn" onClick={onToggleTheme}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <section className="sp-profile-card">
          <div className="sp-banner" />
          <div className="sp-main">
            <div className="sp-photo-wrap">
              {profile.profilePhoto ? (
                <img className="sp-photo" src={profile.profilePhoto} alt={profile.name} />
              ) : (
                <div className="sp-photo-placeholder">{(profile.name || '?').charAt(0).toUpperCase()}</div>
              )}
              <button type="button" className="sp-photo-edit" onClick={() => setShowUploadModal(true)}>Photo</button>
            </div>

            <div className="sp-identity">
              <h1>{profile.name}</h1>
              <p>{profile.rollNumber || profile.rollNo || 'No roll number'} | {profile.department || 'No department'}{profile.year ? ` | ${profile.year}` : ''}</p>
              <p>{profile.email}{profile.phone ? ` | ${profile.phone}` : ''}</p>
            </div>

            <div className="sp-stats-grid">
              <article className="sp-stat-card">
                <h3>{stats.completed || 0}</h3>
                <p>Completed Assignments</p>
              </article>
              <article className="sp-stat-card">
                <h3>{stats.pending || 0}</h3>
                <p>Pending Assignments</p>
              </article>
              <article className="sp-stat-card">
                <h3>{stats.averageScore || 0}%</h3>
                <p>Average Score</p>
              </article>
              <article className="sp-stat-card">
                <h3>{stats.badgeCount || 0}</h3>
                <p>Total Badges Earned</p>
              </article>
            </div>
          </div>
        </section>

        <div className="sp-tabs">
          <button type="button" className={activeTab === 'overview' ? 'is-active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
          <button type="button" className={activeTab === 'badges' ? 'is-active' : ''} onClick={() => setActiveTab('badges')}>Badges ({badges.length})</button>
        </div>

        <section className="sp-tab-panel">
          {activeTab === 'overview' && (
            <div className="sp-overview-grid">
              <article className="sp-summary-card">
                <h3>Assignment Summary</h3>
                <p>Total assignments: <strong>{stats.totalAssignments || 0}</strong></p>
                <p>Submission rate: <strong>{stats.totalAssignments ? Math.round(((stats.completed || 0) / stats.totalAssignments) * 100) : 0}%</strong></p>
              </article>
              <article className="sp-summary-card">
                <h3>Recent Badges</h3>
                <div className="sp-mini-badges">
                  {badges.slice(0, 6).map((badge) => (
                    <span key={`${badge.type}-${badge.awardedAt}`} className="sp-mini-badge">{badge.icon} {badge.name}</span>
                  ))}
                  {!badges.length && <p className="sp-muted">No badges yet. Keep submitting assignments.</p>}
                </div>
              </article>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="sp-badge-grid">
              {badges.map((badge) => (
                <article key={`${badge.type}-${badge.awardedAt}`} className="sp-badge-card">
                  <div className="sp-badge-icon">{badge.icon}</div>
                  <div>
                    <h4>{badge.name}</h4>
                    <p>{badge.description}</p>
                    <small>{formatDate(badge.awardedAt)}{badge.isAutomatic ? ' | Automatic' : ' | Teacher Awarded'}</small>
                  </div>
                </article>
              ))}
              {!badges.length && <p className="sp-muted">No badges yet.</p>}
            </div>
          )}
        </section>

        {showUploadModal && (
          <div className="sp-modal-backdrop" onClick={closeUploadModal}>
            <div className="sp-modal" onClick={(event) => event.stopPropagation()}>
              <div className="sp-modal-head">
                <h3>Upload Photo</h3>
                <button type="button" onClick={closeUploadModal}>x</button>
              </div>

              <div
                className={`sp-drop-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  if (event.currentTarget === event.target) setDragActive(false);
                }}
                onDrop={onDrop}
              >
                <input
                  id="profile-photo-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => preparePreview(event.target.files?.[0])}
                  hidden
                />
                <label htmlFor="profile-photo-file">
                  <strong>Drag and drop an image here</strong>
                  <span>or click to browse</span>
                  <small>Max 5MB | JPG, PNG, WebP</small>
                </label>
              </div>

              {previewSrc && (
                <div className="sp-preview-wrap">
                  <p>Instant Preview</p>
                  <img src={previewSrc} alt="Preview" className="sp-preview-image" />
                </div>
              )}

              {uploadError && <p className="sp-error">{uploadError}</p>}

              <div className="sp-modal-actions">
                <button type="button" className="sp-btn" onClick={handleUpload} disabled={!canUpload}>
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
                {profile.profilePhoto && (
                  <button type="button" className="sp-btn danger" onClick={handleRemovePhoto} disabled={uploading}>
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const css = `
  .sp-page{
    --sp-bg:#eef5ff;
    --sp-bg-2:#f8fbff;
    --sp-card:#ffffff;
    --sp-card-soft:#f8fbff;
    --sp-border:#dbe4f0;
    --sp-text:#14213d;
    --sp-muted:#4b5d78;
    --sp-primary:#14213d;
    --sp-chip:#eef4ff;
    --sp-chip-border:#c9d7ee;
    min-height:100vh;
    padding:20px;
    background:linear-gradient(160deg,var(--sp-bg),var(--sp-bg-2));
    color:var(--sp-text);
    font-family:'Space Grotesk',sans-serif;
  }
  .sp-page.dark{
    --sp-bg:#071226;
    --sp-bg-2:#0b1830;
    --sp-card:rgba(14,27,48,.92);
    --sp-card-soft:rgba(18,35,60,.9);
    --sp-border:rgba(120,173,255,.22);
    --sp-text:#eaf3ff;
    --sp-muted:#9fb0c8;
    --sp-primary:#5aa2ff;
    --sp-chip:rgba(82,211,255,.14);
    --sp-chip-border:rgba(82,211,255,.35);
  }

  .sp-loading-wrap{display:grid;place-items:center;min-height:40vh}
  .sp-loading-card{background:var(--sp-card);border:1px solid var(--sp-border);border-radius:12px;padding:20px 24px;color:var(--sp-muted)}

  .sp-header-row{max-width:1060px;margin:0 auto 12px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
  .sp-link-btn,.sp-theme-btn{border:1px solid var(--sp-border);background:var(--sp-card-soft);color:var(--sp-text);font-weight:600;cursor:pointer;padding:8px 12px;border-radius:10px}

  .sp-profile-card{max-width:1060px;margin:0 auto;border:1px solid var(--sp-border);border-radius:16px;overflow:hidden;background:var(--sp-card)}
  .sp-banner{height:132px;background:linear-gradient(120deg,#0ea5a5,#f59e0b)}
  .sp-main{padding:0 24px 24px;position:relative}

  .sp-photo-wrap{position:absolute;top:-50px;left:24px}
  .sp-photo,.sp-photo-placeholder{width:108px;height:108px;border-radius:50%;border:4px solid #fff;box-shadow:0 8px 22px rgba(20,33,61,.16)}
  .sp-photo{object-fit:cover}
  .sp-photo-placeholder{display:grid;place-items:center;background:linear-gradient(120deg,#1d4ed8,#0ea5a5);color:#fff;font-size:38px;font-weight:700}
  .sp-photo-edit{position:absolute;right:-4px;bottom:-4px;border:0;border-radius:999px;padding:7px 10px;background:var(--sp-primary);color:#fff;cursor:pointer;font-size:12px}

  .sp-identity{padding-top:68px;margin-bottom:20px}
  .sp-identity h1{font-size:30px;line-height:1.1;margin:0 0 6px}
  .sp-identity p{margin:0 0 5px;color:var(--sp-muted)}

  .sp-stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  .sp-stat-card{background:var(--sp-card-soft);border:1px solid var(--sp-border);border-radius:12px;padding:14px;text-align:center}
  .sp-stat-card h3{margin:0;font-size:30px;color:var(--sp-text)}
  .sp-stat-card p{margin:3px 0 0;color:var(--sp-muted);font-size:13px}

  .sp-tabs{max-width:1060px;margin:16px auto 0;display:flex;gap:8px}
  .sp-tabs button{border:1px solid var(--sp-border);background:var(--sp-card);border-radius:10px;padding:10px 14px;font-weight:600;cursor:pointer;color:var(--sp-text)}
  .sp-tabs button.is-active{background:var(--sp-primary);color:#fff;border-color:var(--sp-primary)}

  .sp-tab-panel{max-width:1060px;margin:12px auto 0;border:1px solid var(--sp-border);border-radius:16px;padding:18px;background:var(--sp-card)}
  .sp-overview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .sp-summary-card{border:1px solid var(--sp-border);background:var(--sp-card-soft);border-radius:12px;padding:14px}
  .sp-summary-card h3{margin:0 0 8px}
  .sp-summary-card p{margin:0 0 6px;color:var(--sp-muted)}

  .sp-mini-badges{display:flex;flex-wrap:wrap;gap:8px}
  .sp-mini-badge{border:1px solid var(--sp-chip-border);background:var(--sp-chip);padding:6px 9px;border-radius:999px;font-size:13px}

  .sp-badge-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
  .sp-badge-card{display:flex;gap:12px;border:1px solid var(--sp-border);border-radius:12px;padding:14px;background:var(--sp-card-soft)}
  .sp-badge-icon{font-size:30px;line-height:1}
  .sp-badge-card h4{margin:0 0 4px}
  .sp-badge-card p{margin:0 0 4px;color:var(--sp-muted);font-size:13px}
  .sp-badge-card small{color:var(--sp-muted)}

  .sp-modal-backdrop{position:fixed;inset:0;background:rgba(10,22,40,.55);display:grid;place-items:center;z-index:1000;padding:16px}
  .sp-modal{width:min(100%,560px);background:var(--sp-card);border-radius:16px;padding:16px;border:1px solid var(--sp-border)}
  .sp-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
  .sp-modal-head h3{margin:0}
  .sp-modal-head button{border:0;background:var(--sp-card-soft);color:var(--sp-text);width:30px;height:30px;border-radius:999px;cursor:pointer}

  .sp-drop-zone{border:2px dashed var(--sp-chip-border);border-radius:12px;padding:22px;background:var(--sp-card-soft);text-align:center;transition:border-color .2s, background-color .2s}
  .sp-drop-zone.drag-active{border-color:#0ea5a5}
  .sp-drop-zone label{display:grid;gap:4px;cursor:pointer;color:var(--sp-muted)}

  .sp-preview-wrap{margin-top:12px;border:1px solid var(--sp-border);border-radius:12px;padding:12px;background:var(--sp-card-soft)}
  .sp-preview-wrap p{margin:0 0 8px;color:var(--sp-muted);font-size:13px}
  .sp-preview-image{width:100%;max-height:220px;object-fit:cover;border-radius:10px}

  .sp-modal-actions{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
  .sp-btn{border:0;background:var(--sp-primary);color:#fff;border-radius:10px;padding:10px 14px;font-weight:600;cursor:pointer}
  .sp-btn:disabled{opacity:.6;cursor:not-allowed}
  .sp-btn.danger{background:#a4161a}

  .sp-error{margin-top:10px;color:#a4161a;font-size:13px}
  .sp-muted{margin:0;color:var(--sp-muted)}

  @media (max-width: 860px){
    .sp-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    .sp-overview-grid{grid-template-columns:1fr}
  }

  @media (max-width: 560px){
    .sp-page{padding:14px}
    .sp-main{padding:0 14px 14px}
    .sp-photo-wrap{left:14px}
    .sp-identity{padding-top:64px}
    .sp-identity h1{font-size:24px}
  }
`;
