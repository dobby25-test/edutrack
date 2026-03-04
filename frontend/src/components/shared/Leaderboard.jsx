import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { applyTheme, getInitialTheme, THEME_CHANGE_EVENT } from '../../utils/theme';

export default function Leaderboard({ course, section, onClose }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [scope, setScope] = useState('overall');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === 'eduTheme' && event.newValue) {
        setTheme(event.newValue === 'light' ? 'light' : 'dark');
      }
    };
    const onTheme = (event) => {
      const next = event?.detail?.theme;
      if (next === 'light' || next === 'dark') setTheme(next);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(THEME_CHANGE_EVENT, onTheme);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(THEME_CHANGE_EVENT, onTheme);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (isMounted) setLoading(true);
      try {
        const params = new URLSearchParams();
        if (scope === 'course' && course) params.set('course', course);
        if (scope === 'section' && section) params.set('section', section);
        const query = params.toString();
        const res = await api.get(`/leaderboard${query ? `?${query}` : ''}`);
        if (isMounted) {
          setItems(Array.isArray(res?.data?.leaderboard) ? res.data.leaderboard : []);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void run();
    return () => { isMounted = false; };
  }, [scope, course, section]);

  const title = useMemo(() => {
    if (scope === 'course') return 'Course Leaderboard';
    if (scope === 'section') return 'Section Leaderboard';
    return 'Global Leaderboard';
  }, [scope]);

  return (
    <>
      <style>{css}</style>
      <div className={`lb-page ${theme}`}>
        <header className="lb-header">
          <button className="lb-back" type="button" onClick={onClose}>
            Back
          </button>
          <div>
            <h1>{title}</h1>
            <p>Live student ranking by points, scores, and badges.</p>
          </div>
        </header>

        <section className="lb-filters">
          <button
            type="button"
            className={scope === 'overall' ? 'active' : ''}
            onClick={() => setScope('overall')}
          >
            Overall
          </button>
          {course ? (
            <button
              type="button"
              className={scope === 'course' ? 'active' : ''}
              onClick={() => setScope('course')}
            >
              My Course
            </button>
          ) : null}
          {section ? (
            <button
              type="button"
              className={scope === 'section' ? 'active' : ''}
              onClick={() => setScope('section')}
            >
              My Section
            </button>
          ) : null}
        </section>

        <section className="lb-list">
          {loading ? <p className="lb-state">Loading leaderboard...</p> : null}
          {!loading && items.length === 0 ? <p className="lb-state">No leaderboard data found.</p> : null}
          {!loading
            ? items.map((student, index) => (
                <article
                  key={student.id}
                  className={`lb-item ${index < 3 ? 'podium' : ''}`}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="lb-rank">{index + 1}</div>
                  <div className="lb-avatar" aria-hidden="true">
                    {student.profilePhoto ? (
                      <img src={student.profilePhoto} alt={student.name} />
                    ) : (
                      <span>{(student.name || 'S').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="lb-user">
                    <strong>{student.name}</strong>
                    <small>
                      {student.rollNo || 'N/A'} | {student.course || 'N/A'} {student.section || ''}
                    </small>
                  </div>
                  <div className="lb-stats">
                    <span>{student.averageScore ?? 0}% Avg</span>
                    <span>{student.badges ?? 0} Badges</span>
                    <span>{student.points ?? 0} Pts</span>
                  </div>
                </article>
              ))
            : null}
        </section>
      </div>
    </>
  );
}

const css = `
  .lb-page {
    --bg1: #070d18;
    --bg2: #10192d;
    --panel: rgba(16, 25, 43, 0.82);
    --panel-soft: rgba(23, 35, 58, 0.82);
    --text: #eaf2ff;
    --muted: #9fb0c8;
    --border: rgba(99, 179, 255, 0.2);
    --accent: #63b3ff;
    min-height: 100vh;
    padding: 22px;
    color: var(--text);
    background:
      radial-gradient(circle at 8% 2%, rgba(94, 114, 235, 0.25), transparent 38%),
      radial-gradient(circle at 90% 12%, rgba(99, 179, 255, 0.18), transparent 40%),
      linear-gradient(160deg, var(--bg1), var(--bg2));
    font-family: "IBM Plex Sans", sans-serif;
  }
  .lb-page.light {
    --panel: rgba(255, 255, 255, 0.94);
    --panel-soft: rgba(246, 251, 255, 0.96);
    --text: #0f172a;
    --muted: #546579;
    --border: rgba(37, 99, 235, 0.16);
    --accent: #2563eb;
    background:
      radial-gradient(circle at 8% 2%, rgba(191, 219, 254, 0.45), transparent 40%),
      radial-gradient(circle at 90% 12%, rgba(167, 243, 208, 0.32), transparent 40%),
      linear-gradient(165deg, #eef4ff, #f8fbff);
  }
  .lb-header {
    max-width: 980px;
    margin: 0 auto 16px;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: start;
  }
  .lb-header h1 {
    margin: 0;
    font-size: clamp(24px, 3vw, 34px);
  }
  .lb-header p {
    margin: 6px 0 0;
    color: var(--muted);
    font-size: 13px;
  }
  .lb-back {
    border: 1px solid var(--border);
    background: var(--panel);
    color: var(--text);
    border-radius: 10px;
    padding: 8px 12px;
    font-weight: 700;
    cursor: pointer;
  }
  .lb-filters {
    max-width: 980px;
    margin: 0 auto 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .lb-filters button {
    border: 1px solid var(--border);
    background: var(--panel);
    color: var(--text);
    border-radius: 10px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 600;
  }
  .lb-filters button.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
    color: var(--accent);
  }
  .lb-list {
    max-width: 980px;
    margin: 0 auto;
    display: grid;
    gap: 10px;
  }
  .lb-item {
    opacity: 0;
    animation: lbSlideIn 0.35s ease forwards;
    border: 1px solid var(--border);
    background: var(--panel);
    border-radius: 14px;
    padding: 12px;
    display: grid;
    grid-template-columns: 56px 52px 1fr auto;
    gap: 12px;
    align-items: center;
  }
  .lb-item.podium {
    background: var(--panel-soft);
  }
  .lb-rank {
    font-size: 28px;
    font-weight: 800;
    color: var(--accent);
    text-align: center;
  }
  .lb-avatar {
    width: 48px;
    height: 48px;
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid var(--border);
    display: grid;
    place-items: center;
    font-weight: 800;
    background: rgba(99, 179, 255, 0.16);
  }
  .lb-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .lb-user strong {
    display: block;
    font-size: 16px;
  }
  .lb-user small {
    color: var(--muted);
    font-size: 12px;
  }
  .lb-stats {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .lb-stats span {
    font-size: 12px;
    border: 1px solid var(--border);
    background: var(--panel-soft);
    border-radius: 999px;
    padding: 6px 10px;
    color: var(--muted);
  }
  .lb-state {
    margin: 0;
    border: 1px solid var(--border);
    background: var(--panel);
    border-radius: 12px;
    padding: 18px;
    color: var(--muted);
  }
  @keyframes lbSlideIn {
    from { transform: translateY(8px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @media (max-width: 760px) {
    .lb-page {
      padding: 14px;
    }
    .lb-item {
      grid-template-columns: 40px 42px 1fr;
    }
    .lb-stats {
      grid-column: 1 / -1;
      justify-content: flex-start;
    }
    .lb-rank {
      font-size: 22px;
    }
  }
`;
