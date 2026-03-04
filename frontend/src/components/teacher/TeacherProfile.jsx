import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const fmtDate = (value) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString();
};

export default function TeacherProfile({ onClose, theme = 'light', onToggleTheme }) {
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const cards = useMemo(() => ([
    { label: 'Projects Created', value: stats.totalProjects || 0 },
    { label: 'Assignments Managed', value: stats.totalAssignments || 0 },
    { label: 'Students Teaching', value: stats.studentsTeaching || 0 },
    { label: 'Badges Earned', value: badges.length },
  ]), [stats, badges.length]);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile/me');
      setProfile(res.data?.user || null);
      setBadges(res.data?.badges || []);
      setStats(res.data?.stats || {});
    } catch (error) {
      console.error('Failed to load teacher profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setPreview('');
    setUploadError('');
    setDragActive(false);
  };

  const validateFile = (file) => {
    if (!file) return 'Please select a file.';
    if (!ALLOWED_TYPES.has(file.type)) return 'Only JPG, PNG, and WebP images are allowed.';
    if (file.size > MAX_PHOTO_SIZE) return 'File must be 5MB or less.';
    return '';
  };

  const preparePreview = (file) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      setPreview('');
      return;
    }
    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => {
      setUploadError('Could not read file.');
      setPreview('');
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async () => {
    if (!preview) return;
    try {
      setUploading(true);
      setUploadError('');
      await api.post('/profile/upload-photo', { photoUrl: preview });
      await load();
      closeUploadModal();
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    try {
      setUploading(true);
      setUploadError('');
      await api.delete('/profile/remove-photo');
      await load();
      closeUploadModal();
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to remove photo.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className={`tp-wrap ${theme}`}><div className="tp-card">Loading profile...</div></div>;
  }

  if (!profile) {
    return <div className={`tp-wrap ${theme}`}><div className="tp-card">Profile not available.</div></div>;
  }

  return (
    <>
      <style>{css}</style>
      <div className={`tp-wrap ${theme}`}>
        <div className="tp-top">
          <button type="button" className="tp-back" onClick={onClose}>Back</button>
          <button type="button" className="tp-theme" onClick={onToggleTheme}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
        </div>
        <div className="tp-card">
          <div className="tp-banner" />
          <div className="tp-main">
            <div className="tp-photo-wrap">
              {profile.profilePhoto ? <img className="tp-photo" src={profile.profilePhoto} alt={profile.name} /> : <div className="tp-ph">{(profile.name || 'T').charAt(0).toUpperCase()}</div>}
              <button type="button" className="tp-edit" onClick={() => setShowUploadModal(true)}>Photo</button>
            </div>
            <h2>{profile.name}</h2>
            <p>{profile.email} | {profile.department || 'Department not set'}</p>
            <div className="tp-stats">
              {cards.map((card) => (
                <article key={card.label}>
                  <strong>{card.value}</strong>
                  <span>{card.label}</span>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="tp-tabs">
          <button type="button" className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
          <button type="button" className={tab === 'badges' ? 'active' : ''} onClick={() => setTab('badges')}>Badges ({badges.length})</button>
        </div>

        <div className="tp-panel">
          {tab === 'overview' && (
            <div className="tp-overview">
              <div>
                <h3>Teaching Snapshot</h3>
                <p>Total projects: <b>{stats.totalProjects || 0}</b></p>
                <p>Active students: <b>{stats.studentsTeaching || 0}</b></p>
                <p>Assignments handled: <b>{stats.totalAssignments || 0}</b></p>
              </div>
              <div>
                <h3>Recent Badges</h3>
                {badges.slice(0, 6).map((badge) => <span key={`${badge.type}-${badge.awardedAt}`} className="tp-chip">{badge.icon} {badge.name}</span>)}
                {!badges.length && <p className="tp-muted">No badges earned yet.</p>}
              </div>
            </div>
          )}
          {tab === 'badges' && (
            <div className="tp-badges">
              {badges.map((badge) => (
                <article key={`${badge.type}-${badge.awardedAt}`}>
                  <div>{badge.icon}</div>
                  <div>
                    <h4>{badge.name}</h4>
                    <p>{badge.description}</p>
                    <small>{fmtDate(badge.awardedAt)}</small>
                  </div>
                </article>
              ))}
              {!badges.length && <p className="tp-muted">No badges to show.</p>}
            </div>
          )}
        </div>

        {showUploadModal && (
          <div className="tp-modal-bg" onClick={closeUploadModal}>
            <div className="tp-modal" onClick={(event) => event.stopPropagation()}>
              <header>
                <h3>Upload Profile Photo</h3>
                <button type="button" onClick={closeUploadModal}>x</button>
              </header>
              <div
                className={`tp-drop ${dragActive ? 'drag' : ''}`}
                onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragLeave={(event) => { event.preventDefault(); if (event.currentTarget === event.target) setDragActive(false); }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  preparePreview(event.dataTransfer?.files?.[0]);
                }}
              >
                <input id="tp-file" hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => preparePreview(event.target.files?.[0])} />
                <label htmlFor="tp-file">
                  <strong>Drag and drop or browse</strong>
                  <span>Max 5MB | JPG, PNG, WebP</span>
                </label>
              </div>
              {preview && <img src={preview} alt="Preview" className="tp-preview" />}
              {uploadError && <p className="tp-error">{uploadError}</p>}
              <footer>
                <button type="button" onClick={uploadPhoto} disabled={!preview || uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
                {profile.profilePhoto && <button type="button" className="danger" onClick={removePhoto} disabled={uploading}>Remove Photo</button>}
              </footer>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const css = `
  .tp-wrap{--tp-bg:#eff6ff;--tp-bg-2:#f8fbff;--tp-card:#fff;--tp-soft:#f8fafc;--tp-border:#dbe4f0;--tp-text:#0f172a;--tp-muted:#475569;--tp-primary:#0f172a;min-height:100vh;padding:20px;background:linear-gradient(160deg,var(--tp-bg),var(--tp-bg-2));color:var(--tp-text);font-family:"Space Grotesk",sans-serif}
  .tp-wrap.dark{--tp-bg:#071226;--tp-bg-2:#0b1830;--tp-card:rgba(14,27,48,.92);--tp-soft:rgba(18,35,60,.9);--tp-border:rgba(120,173,255,.22);--tp-text:#eaf3ff;--tp-muted:#9fb0c8;--tp-primary:#5aa2ff}
  .tp-top{max-width:980px;margin:0 auto 10px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
  .tp-back,.tp-theme{border:1px solid var(--tp-border);background:var(--tp-soft);color:var(--tp-text);font-weight:700;cursor:pointer;padding:8px 12px;border-radius:10px}
  .tp-card{max-width:980px;margin:0 auto;background:var(--tp-card);border:1px solid var(--tp-border);border-radius:16px;overflow:hidden}
  .tp-banner{height:120px;background:linear-gradient(120deg,#0284c7,#06b6d4)}
  .tp-main{position:relative;padding:66px 18px 18px}
  .tp-photo-wrap{position:absolute;top:-48px;left:18px}
  .tp-photo,.tp-ph{width:96px;height:96px;border-radius:999px;border:3px solid #fff;box-shadow:0 8px 18px rgba(2,6,23,.16)}
  .tp-photo{object-fit:cover}
  .tp-ph{display:grid;place-items:center;background:#0284c7;color:#fff;font-size:36px;font-weight:700}
  .tp-edit{position:absolute;right:-6px;bottom:-6px;border:0;background:var(--tp-primary);color:#fff;border-radius:999px;padding:5px 9px;font-size:11px;cursor:pointer}
  .tp-main h2{margin:0 0 6px}
  .tp-main p{margin:0;color:var(--tp-muted)}
  .tp-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}
  .tp-stats article{background:var(--tp-soft);border:1px solid var(--tp-border);border-radius:12px;padding:10px;text-align:center}
  .tp-stats strong{display:block;font-size:26px}
  .tp-stats span{font-size:12px;color:var(--tp-muted)}
  .tp-tabs{max-width:980px;margin:12px auto 0;display:flex;gap:8px}
  .tp-tabs button{border:1px solid var(--tp-border);background:var(--tp-card);color:var(--tp-text);border-radius:10px;padding:10px 12px;cursor:pointer;font-weight:700}
  .tp-tabs .active{background:var(--tp-primary);color:#fff;border-color:var(--tp-primary)}
  .tp-panel{max-width:980px;margin:10px auto 0;background:var(--tp-card);border:1px solid var(--tp-border);border-radius:14px;padding:14px}
  .tp-overview{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .tp-overview > div{border:1px solid var(--tp-border);border-radius:12px;padding:12px;background:var(--tp-soft)}
  .tp-overview h3{margin:0 0 8px}
  .tp-overview p{margin:0 0 5px;color:var(--tp-muted)}
  .tp-chip{display:inline-block;margin:0 8px 8px 0;padding:6px 9px;border-radius:999px;background:rgba(82,211,255,.14);border:1px solid rgba(82,211,255,.35)}
  .tp-badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
  .tp-badges article{display:flex;gap:10px;border:1px solid var(--tp-border);border-radius:12px;padding:10px;background:var(--tp-soft)}
  .tp-badges article div:first-child{font-size:30px}
  .tp-badges h4{margin:0 0 4px}
  .tp-badges p{margin:0 0 4px;color:var(--tp-muted);font-size:13px}
  .tp-muted{color:var(--tp-muted);margin:0}
  .tp-modal-bg{position:fixed;inset:0;background:rgba(2,6,23,.55);display:grid;place-items:center;z-index:1200;padding:16px}
  .tp-modal{width:min(560px,100%);background:var(--tp-card);border:1px solid var(--tp-border);border-radius:14px;padding:14px}
  .tp-modal header{display:flex;justify-content:space-between;align-items:center}
  .tp-modal header h3{margin:0}
  .tp-modal header button{border:0;background:var(--tp-soft);color:var(--tp-text);width:28px;height:28px;border-radius:999px;cursor:pointer}
  .tp-drop{margin-top:10px;border:2px dashed rgba(82,211,255,.35);border-radius:12px;padding:20px;text-align:center;background:var(--tp-soft)}
  .tp-drop.drag{border-color:#0284c7}
  .tp-drop label{display:grid;gap:5px;cursor:pointer}
  .tp-preview{margin-top:10px;width:100%;max-height:230px;object-fit:cover;border-radius:10px}
  .tp-error{color:#b91c1c;font-size:13px;margin:8px 0 0}
  .tp-modal footer{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}
  .tp-modal footer button{border:0;background:var(--tp-primary);color:#fff;border-radius:10px;padding:9px 12px;cursor:pointer;font-weight:700}
  .tp-modal footer button.danger{background:#b91c1c}
  .tp-modal footer button:disabled{opacity:.6;cursor:not-allowed}
  @media (max-width:760px){.tp-wrap{padding:14px}.tp-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.tp-overview{grid-template-columns:1fr}}
`;
