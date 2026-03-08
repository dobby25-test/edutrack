import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import LogoLoader from '../shared/LogoLoader';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const fmtDate = (value) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString();
};

export default function DirectorProfile({ onClose, theme = 'light', onToggleTheme }) {
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
    { label: 'Total Projects', value: stats.totalProjects || 0 },
    { label: 'Total Teachers', value: stats.totalTeachers || 0 },
    { label: 'Total Students', value: stats.totalStudents || 0 },
    { label: 'Pending Reviews', value: stats.pendingReviews || 0 },
  ]), [stats]);

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
      console.error('Failed to load director profile:', error);
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
    return (
      <div className={`dp-wrap ${theme}`}>
        <div className="dp-card" style={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
          <LogoLoader compact />
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className={`dp-wrap ${theme}`}><div className="dp-card">Profile not available.</div></div>;
  }

  return (
    <>
      <style>{css}</style>
      <div className={`dp-wrap ${theme}`}>
        <div className="dp-top">
          <button type="button" className="dp-back" onClick={onClose}>Back</button>
          <button type="button" className="dp-theme" onClick={onToggleTheme}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
        </div>
        <div className="dp-card">
          <div className="dp-banner" />
          <div className="dp-main">
            <div className="dp-photo-wrap">
              {profile.profilePhoto ? <img className="dp-photo" src={profile.profilePhoto} alt={profile.name} /> : <div className="dp-ph">{(profile.name || 'D').charAt(0).toUpperCase()}</div>}
              <button type="button" className="dp-edit" onClick={() => setShowUploadModal(true)}>Photo</button>
            </div>
            <h2>{profile.name}</h2>
            <p>{profile.email} | {profile.department || 'Administration'}</p>
            <div className="dp-stats">
              {cards.map((card) => (
                <article key={card.label}>
                  <strong>{card.value}</strong>
                  <span>{card.label}</span>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="dp-tabs">
          <button type="button" className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
          <button type="button" className={tab === 'badges' ? 'active' : ''} onClick={() => setTab('badges')}>Badges ({badges.length})</button>
        </div>

        <div className="dp-panel">
          {tab === 'overview' && (
            <div className="dp-overview">
              <div>
                <h3>Institution Snapshot</h3>
                <p>Projects: <b>{stats.totalProjects || 0}</b></p>
                <p>Teachers: <b>{stats.totalTeachers || 0}</b></p>
                <p>Students: <b>{stats.totalStudents || 0}</b></p>
                <p>Pending reviews: <b>{stats.pendingReviews || 0}</b></p>
              </div>
              <div>
                <h3>Recent Badges</h3>
                {badges.slice(0, 6).map((badge) => <span key={`${badge.type}-${badge.awardedAt}`} className="dp-chip">{badge.icon} {badge.name}</span>)}
                {!badges.length && <p className="dp-muted">No badges earned yet.</p>}
              </div>
            </div>
          )}
          {tab === 'badges' && (
            <div className="dp-badges">
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
              {!badges.length && <p className="dp-muted">No badges to show.</p>}
            </div>
          )}
        </div>

        {showUploadModal && (
          <div className="dp-modal-bg" onClick={closeUploadModal}>
            <div className="dp-modal" onClick={(event) => event.stopPropagation()}>
              <header>
                <h3>Upload Profile Photo</h3>
                <button type="button" onClick={closeUploadModal}>x</button>
              </header>
              <div
                className={`dp-drop ${dragActive ? 'drag' : ''}`}
                onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragLeave={(event) => { event.preventDefault(); if (event.currentTarget === event.target) setDragActive(false); }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  preparePreview(event.dataTransfer?.files?.[0]);
                }}
              >
                <input id="dp-file" hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => preparePreview(event.target.files?.[0])} />
                <label htmlFor="dp-file">
                  <strong>Drag and drop or browse</strong>
                  <span>Max 5MB | JPG, PNG, WebP</span>
                </label>
              </div>
              {preview && <img src={preview} alt="Preview" className="dp-preview" />}
              {uploadError && <p className="dp-error">{uploadError}</p>}
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
  .dp-wrap{--dp-bg:#eff6ff;--dp-bg-2:#f8fbff;--dp-card:#fff;--dp-soft:#f8fafc;--dp-border:#dbe4f0;--dp-text:#0f172a;--dp-muted:#475569;--dp-primary:#0f172a;min-height:100vh;padding:20px;background:linear-gradient(160deg,var(--dp-bg),var(--dp-bg-2));color:var(--dp-text);font-family:"Space Grotesk",sans-serif}
  .dp-wrap.dark{--dp-bg:#071226;--dp-bg-2:#0b1830;--dp-card:rgba(14,27,48,.92);--dp-soft:rgba(18,35,60,.9);--dp-border:rgba(120,173,255,.22);--dp-text:#eaf3ff;--dp-muted:#9fb0c8;--dp-primary:#5aa2ff}
  .dp-top{max-width:980px;margin:0 auto 10px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
  .dp-back,.dp-theme{border:1px solid var(--dp-border);background:var(--dp-soft);color:var(--dp-text);font-weight:700;cursor:pointer;padding:8px 12px;border-radius:10px}
  .dp-card{max-width:980px;margin:0 auto;background:var(--dp-card);border:1px solid var(--dp-border);border-radius:16px;overflow:hidden}
  .dp-banner{height:120px;background:linear-gradient(120deg,#9333ea,#f97316)}
  .dp-main{position:relative;padding:66px 18px 18px}
  .dp-photo-wrap{position:absolute;top:-48px;left:18px}
  .dp-photo,.dp-ph{width:96px;height:96px;border-radius:999px;border:3px solid #fff;box-shadow:0 8px 18px rgba(2,6,23,.16)}
  .dp-photo{object-fit:cover}
  .dp-ph{display:grid;place-items:center;background:#9333ea;color:#fff;font-size:36px;font-weight:700}
  .dp-edit{position:absolute;right:-6px;bottom:-6px;border:0;background:var(--dp-primary);color:#fff;border-radius:999px;padding:5px 9px;font-size:11px;cursor:pointer}
  .dp-main h2{margin:0 0 6px}
  .dp-main p{margin:0;color:var(--dp-muted)}
  .dp-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}
  .dp-stats article{background:var(--dp-soft);border:1px solid var(--dp-border);border-radius:12px;padding:10px;text-align:center}
  .dp-stats strong{display:block;font-size:26px}
  .dp-stats span{font-size:12px;color:var(--dp-muted)}
  .dp-tabs{max-width:980px;margin:12px auto 0;display:flex;gap:8px}
  .dp-tabs button{border:1px solid var(--dp-border);background:var(--dp-card);color:var(--dp-text);border-radius:10px;padding:10px 12px;cursor:pointer;font-weight:700}
  .dp-tabs .active{background:var(--dp-primary);color:#fff;border-color:var(--dp-primary)}
  .dp-panel{max-width:980px;margin:10px auto 0;background:var(--dp-card);border:1px solid var(--dp-border);border-radius:14px;padding:14px}
  .dp-overview{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .dp-overview > div{border:1px solid var(--dp-border);border-radius:12px;padding:12px;background:var(--dp-soft)}
  .dp-overview h3{margin:0 0 8px}
  .dp-overview p{margin:0 0 5px;color:var(--dp-muted)}
  .dp-chip{display:inline-block;margin:0 8px 8px 0;padding:6px 9px;border-radius:999px;background:rgba(147,51,234,.15);border:1px solid rgba(147,51,234,.4)}
  .dp-badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
  .dp-badges article{display:flex;gap:10px;border:1px solid var(--dp-border);border-radius:12px;padding:10px;background:var(--dp-soft)}
  .dp-badges article div:first-child{font-size:30px}
  .dp-badges h4{margin:0 0 4px}
  .dp-badges p{margin:0 0 4px;color:var(--dp-muted);font-size:13px}
  .dp-muted{color:var(--dp-muted);margin:0}
  .dp-modal-bg{position:fixed;inset:0;background:rgba(2,6,23,.55);display:grid;place-items:center;z-index:1200;padding:16px}
  .dp-modal{width:min(560px,100%);background:var(--dp-card);border:1px solid var(--dp-border);border-radius:14px;padding:14px}
  .dp-modal header{display:flex;justify-content:space-between;align-items:center}
  .dp-modal header h3{margin:0}
  .dp-modal header button{border:0;background:var(--dp-soft);color:var(--dp-text);width:28px;height:28px;border-radius:999px;cursor:pointer}
  .dp-drop{margin-top:10px;border:2px dashed rgba(147,51,234,.4);border-radius:12px;padding:20px;text-align:center;background:var(--dp-soft)}
  .dp-drop.drag{border-color:#9333ea}
  .dp-drop label{display:grid;gap:5px;cursor:pointer}
  .dp-preview{margin-top:10px;width:100%;max-height:230px;object-fit:cover;border-radius:10px}
  .dp-error{color:#b91c1c;font-size:13px;margin:8px 0 0}
  .dp-modal footer{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}
  .dp-modal footer button{border:0;background:var(--dp-primary);color:#fff;border-radius:10px;padding:9px 12px;cursor:pointer;font-weight:700}
  .dp-modal footer button.danger{background:#b91c1c}
  .dp-modal footer button:disabled{opacity:.6;cursor:not-allowed}
  @media (max-width:760px){.dp-wrap{padding:14px}.dp-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.dp-overview{grid-template-columns:1fr}}
`;
