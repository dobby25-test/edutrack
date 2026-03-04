import { useEffect, useState } from 'react';
import api from '../../services/api';
import { applyTheme, getInitialTheme, THEME_CHANGE_EVENT } from '../../utils/theme';

export default function NotificationCenter() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
      try {
        const res = await api.get('/notifications');
        const rows = Array.isArray(res?.data?.notifications) ? res.data.notifications : [];
        if (isMounted) {
          setItems(rows);
          setUnreadCount(Number(res?.data?.unreadCount) || 0);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    void run();
    const intervalId = setInterval(() => {
      void run();
    }, 30000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const refresh = async () => {
    try {
      const res = await api.get('/notifications');
      const rows = Array.isArray(res?.data?.notifications) ? res.data.notifications : [];
      setItems(rows);
      setUnreadCount(Number(res?.data?.unreadCount) || 0);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      await refresh();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      setLoading(true);
      await api.put('/notifications/read-all');
      await refresh();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      await refresh();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className={`nc-wrap ${theme}`}>
        <button className="nc-bell" type="button" onClick={() => setIsOpen((prev) => !prev)}>
          <span>Bell</span>
          {unreadCount > 0 ? <i>{unreadCount > 99 ? '99+' : unreadCount}</i> : null}
        </button>

        {isOpen ? (
          <>
            <div className="nc-overlay" onClick={() => setIsOpen(false)} />
            <section className="nc-panel">
              <header>
                <h3>Notifications</h3>
                {unreadCount > 0 ? (
                  <button type="button" onClick={markAllRead} disabled={loading}>
                    {loading ? 'Updating...' : 'Mark All Read'}
                  </button>
                ) : null}
              </header>

              <div className="nc-list">
                {items.length === 0 ? <p className="nc-empty">No notifications yet.</p> : null}
                {items.map((item, index) => (
                  <article
                    key={item.id}
                    className={`nc-item ${item.isRead ? '' : 'unread'}`}
                    style={{ animationDelay: `${index * 35}ms` }}
                  >
                    <div className="nc-icon">{item.icon || 'Info'}</div>
                    <div className="nc-copy">
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                      <small>{new Date(item.createdAt).toLocaleString()}</small>
                    </div>
                    <div className="nc-actions">
                      {!item.isRead ? (
                        <button type="button" onClick={() => markRead(item.id)}>
                          Read
                        </button>
                      ) : null}
                      <button type="button" className="danger" onClick={() => remove(item.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}

const css = `
  .nc-wrap {
    --panel: rgba(16, 25, 43, 0.92);
    --panel-soft: rgba(23, 35, 58, 0.88);
    --text: #eaf2ff;
    --muted: #9fb0c8;
    --border: rgba(99, 179, 255, 0.2);
    --accent: #63b3ff;
    --danger: #ff7b84;
    position: relative;
    font-family: "IBM Plex Sans", sans-serif;
  }
  .nc-wrap.light {
    --panel: rgba(255, 255, 255, 0.98);
    --panel-soft: rgba(246, 251, 255, 0.98);
    --text: #0f172a;
    --muted: #546579;
    --border: rgba(37, 99, 235, 0.16);
    --accent: #2563eb;
    --danger: #dc2626;
  }
  .nc-bell {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--panel-soft);
    color: var(--text);
    cursor: pointer;
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
  }
  .nc-bell span {
    font-size: 0;
  }
  .nc-bell::before {
    content: "N";
    font-size: 13px;
    font-weight: 800;
  }
  .nc-bell i {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    border-radius: 999px;
    padding: 1px 5px;
    font-size: 10px;
    font-style: normal;
    background: var(--danger);
    color: #fff;
    text-align: center;
  }
  .nc-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
  }
  .nc-panel {
    position: absolute;
    top: 50px;
    right: 0;
    width: min(420px, calc(100vw - 24px));
    max-height: 72vh;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--panel);
    color: var(--text);
    box-shadow: 0 18px 44px rgba(2, 6, 23, 0.35);
    z-index: 1001;
    animation: ncPop 0.18s ease;
  }
  .nc-panel header {
    padding: 12px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .nc-panel h3 {
    margin: 0;
    font-size: 15px;
  }
  .nc-panel header button {
    border: 1px solid var(--border);
    background: var(--panel-soft);
    color: var(--accent);
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
  .nc-list {
    display: grid;
    gap: 8px;
    padding: 10px;
    overflow: auto;
    max-height: calc(72vh - 56px);
  }
  .nc-item {
    opacity: 0;
    animation: ncSlide 0.25s ease forwards;
    display: grid;
    grid-template-columns: 34px 1fr auto;
    gap: 10px;
    border: 1px solid var(--border);
    background: var(--panel-soft);
    border-radius: 10px;
    padding: 10px;
  }
  .nc-item.unread {
    border-color: var(--accent);
  }
  .nc-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid var(--border);
    color: var(--accent);
    background: rgba(99, 179, 255, 0.12);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nc-copy strong {
    display: block;
    font-size: 13px;
  }
  .nc-copy p {
    margin: 4px 0 4px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.4;
  }
  .nc-copy small {
    color: var(--muted);
    font-size: 11px;
  }
  .nc-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .nc-actions button {
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    border-radius: 7px;
    padding: 4px 7px;
    font-size: 11px;
    cursor: pointer;
  }
  .nc-actions .danger {
    color: var(--danger);
    border-color: color-mix(in srgb, var(--danger) 45%, transparent);
  }
  .nc-empty {
    margin: 0;
    border: 1px solid var(--border);
    background: var(--panel-soft);
    border-radius: 10px;
    padding: 14px;
    color: var(--muted);
    font-size: 13px;
  }
  @keyframes ncPop {
    from {
      opacity: 0;
      transform: translateY(-6px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  @keyframes ncSlide {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
