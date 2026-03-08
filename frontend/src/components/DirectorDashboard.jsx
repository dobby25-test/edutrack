import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import authService from '../services/authService';
import UserManagement from './director/UserManagement';
import DirectorProfile from './director/DirectorProfile';
import LogoLoader from './shared/LogoLoader';
import useGlobalTheme from '../hooks/useGlobalTheme';
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString());

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = String(v ?? '');
    if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return `${headers.join(',')}\n${rows.map((r) => headers.map((h) => esc(r[h])).join(',')).join('\n')}`;
}

function downloadCsv(filename, rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function Sidebar({ active, setActive, user, theme, onToggleTheme, onLogout, onOpenProfile }) {
  const tabs = ['overview', 'departments', 'teachers', 'projects', 'students', 'users'];
  return (
    <aside className="dir-sidebar">
      <h2>EduTrack</h2>
      <p>Director Portal</p>
      <div className="dir-user">
        <span>
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt={user?.name || 'Director'} className="dir-user-avatar" />
          ) : (
            (user?.name?.[0] || 'D')
          )}
        </span>
        <div>
          <strong>{user?.name || 'Director'}</strong>
          <small>{user?.department || 'Administration'}</small>
        </div>
      </div>
      <nav>
        {tabs.map((t) => (
          <button key={t} className={active === t ? 'active' : ''} onClick={() => setActive(t)}>
            {t}
          </button>
        ))}
      </nav>
      <button onClick={onToggleTheme}>
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>
      <button onClick={onOpenProfile}>My Profile</button>
      <button className="danger" onClick={onLogout}>Sign Out</button>
    </aside>
  );
}

function BarChart({ items, selected, onSelect }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="bars">
      {items.map((i) => (
        <button key={i.label} className={selected === i.label ? 'active' : ''} onClick={() => onSelect(i.label)}>
          <div style={{ height: `${Math.max(Math.round((i.value / max) * 130), 8)}px` }} />
          <small>{i.label}</small>
        </button>
      ))}
    </div>
  );
}

function Modal({ title, rows, onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header><h3>{title}</h3><button onClick={onClose}>Close</button></header>
        <div>
          {rows.map((r) => (
            <p key={r.label}><span>{r.label}</span><strong>{r.value}</strong></p>
          ))}
        </div>
      </div>
    </div>
  );
}

function Empty({ msg }) {
  return <div className="empty">{msg}</div>;
}

export default function DirectorDashboard() {
  const user = authService.getCurrentUser();
  const [active, setActive] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');
  const [chartType, setChartType] = useState('bar');
  const [chartDept, setChartDept] = useState('all');
  const { theme, toggleTheme } = useGlobalTheme();
  const [teacherDetail, setTeacherDetail] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [profileName, setProfileName] = useState(user?.name || 'Director');
  const [data, setData] = useState({ stats: {}, projects: [], departments: [], teachers: [], students: [] });

  useEffect(() => {
    setSearch('');
    setDepartment('all');
    if (active !== 'projects') setStatus('all');
  }, [active]);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, projectsRes, usersRes] = await Promise.all([
        api.get('/projects/director/stats'),
        api.get('/projects/all'),
        api.get('/auth/all-users')
      ]);
      const stats = statsRes.data || {};
      const projects = projectsRes.data.projects || [];
      const users = usersRes.data.users || [];
      const teachers = users.filter((u) => u.role === 'teacher');
      const students = users.filter((u) => u.role === 'student');

      const deptMap = {};
      const ensure = (n) => {
        const key = n || 'Unassigned';
        if (!deptMap[key]) deptMap[key] = { name: key, students: 0, teachers: 0, totalProjects: 0, totalAssignments: 0, submitted: 0, graded: 0 };
        return deptMap[key];
      };
      students.forEach((s) => ensure(s.department).students++);
      teachers.forEach((t) => ensure(t.department).teachers++);
      projects.forEach((p) => {
        const d = ensure(p.department);
        d.totalProjects++;
        d.totalAssignments += p.totalStudents || 0;
        d.submitted += p.submitted || 0;
        d.graded += p.graded || 0;
      });

      const tMap = {};
      teachers.forEach((t) => { tMap[t.id] = { ...t, totalProjects: 0, totalStudents: 0, submitted: 0, graded: 0, pending: 0 }; });
      projects.forEach((p) => {
        const t = tMap[p.teacherId];
        if (!t) return;
        t.totalProjects++;
        t.totalStudents += p.totalStudents || 0;
        t.submitted += p.submitted || 0;
        t.graded += p.graded || 0;
        t.pending += Math.max((p.submitted || 0) - (p.graded || 0), 0);
      });

      setData({
        stats,
        projects,
        departments: Object.values(deptMap).sort((a, b) => b.students - a.students),
        teachers: Object.values(tMap).sort((a, b) => b.totalStudents - a.totalStudents),
        students
      });
    } catch (e) {
      console.error(e);
      setData({ stats: {}, projects: [], departments: [], teachers: [], students: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileSnapshot = async () => {
    try {
      const res = await api.get('/profile/me');
      const nextUser = res.data?.user;
      if (!nextUser) return;
      setProfilePhoto(nextUser.profilePhoto || '');
      setProfileName(nextUser.name || user?.name || 'Director');
    } catch (error) {
      console.error('Failed to fetch director profile snapshot:', error);
    }
  };

  useEffect(() => {
    void load();
    void fetchProfileSnapshot();
  }, []);

  const bySearch = useCallback((arr, keys) => {
    const q = search.trim().toLowerCase();
    if (!q) return arr;
    return arr.filter((item) => keys.some((k) => String(item[k] || '').toLowerCase().includes(q)));
  }, [search]);

  const deptOptions = useMemo(() => ['all', ...data.departments.map((d) => d.name)], [data.departments]);
  const chartData = useMemo(() => data.departments.map((d) => ({ label: d.name, value: d.totalProjects })).filter((d) => d.value > 0), [data.departments]);
  const pieSegments = useMemo(() => {
    const colors = ['#b55323', '#1f6feb', '#2f9e44', '#d9480f', '#7b2cbf', '#0b7285', '#495057'];
    const total = chartData.reduce((s, d) => s + d.value, 0) || 1;
    let start = 0;
    return chartData.map((d, i) => {
      const pctVal = (d.value / total) * 100;
      const end = start + pctVal;
      const row = { ...d, color: colors[i % colors.length], start, end };
      start = end;
      return row;
    });
  }, [chartData]);
  const pieGradient = useMemo(
    () => pieSegments.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(', '),
    [pieSegments]
  );

  const teachers = useMemo(() => bySearch(
    department === 'all' ? data.teachers : data.teachers.filter((t) => (t.department || 'Unassigned') === department),
    ['name', 'email', 'department', 'id', 'rollNo', 'rollNumber', 'registrationNo']
  ), [bySearch, data.teachers, department]);

  const students = useMemo(() => bySearch(
    department === 'all' ? data.students : data.students.filter((s) => (s.department || 'Unassigned') === department),
    ['name', 'email', 'department', 'id', 'rollNo', 'rollNumber', 'registrationNo']
  ), [bySearch, data.students, department]);

  const projects = useMemo(() => {
    let rows = data.projects;
    if (status !== 'all') rows = rows.filter((p) => p.status === status);
    if (department !== 'all') rows = rows.filter((p) => (p.department || 'Unassigned') === department);
    if (chartDept !== 'all') rows = rows.filter((p) => (p.department || 'Unassigned') === chartDept);
    return bySearch(rows, ['title', 'teacherName', 'department', 'status', 'subject', 'id', 'teacherId']);
  }, [bySearch, chartDept, data.projects, department, status]);

  const totals = useMemo(() => {
    const totalAssignments = data.projects.reduce((s, p) => s + (p.totalStudents || 0), 0);
    const totalSubmitted = data.projects.reduce((s, p) => s + (p.submitted || 0) + (p.graded || 0), 0);
    const totalGraded = data.projects.reduce((s, p) => s + (p.graded || 0), 0);
    return { totalAssignments, totalSubmitted, totalGraded };
  }, [data.projects]);

  const exportReport = () => {
    if (active === 'teachers') {
      downloadCsv('teachers_report.csv', teachers.map((t) => ({
        name: t.name, email: t.email, department: t.department || 'Unassigned', projects: t.totalProjects,
        students: t.totalStudents, pending: t.pending, efficiency: pct(t.graded, t.totalStudents)
      })));
      return;
    }
    if (active === 'students') {
      downloadCsv('students_report.csv', students.map((s) => ({
        name: s.name, email: s.email, department: s.department || 'Unassigned', joined: s.createdAt || ''
      })));
      return;
    }
    if (active === 'projects') {
      downloadCsv('projects_report.csv', projects.map((p) => ({
        title: p.title, teacher: p.teacherName || '', department: p.department || 'Unassigned', status: p.status,
        dueDate: p.dueDate || '', students: p.totalStudents || 0, submitted: pct((p.submitted || 0) + (p.graded || 0), p.totalStudents || 0)
      })));
      return;
    }
    downloadCsv('overview_report.csv', [{
      totalProjects: data.projects.length, totalTeachers: data.teachers.length, totalStudents: data.students.length,
      totalAssignments: totals.totalAssignments, pendingReviews: data.stats.pendingReviews || 0,
      submissionRate: pct(totals.totalSubmitted, totals.totalAssignments), gradingRate: pct(totals.totalGraded, totals.totalAssignments)
    }]);
  };

  return (
    <>
      <style>{styles}</style>
      <div className={`dir-shell ${theme}`}>
        <Sidebar
          active={active}
          setActive={setActive}
          user={{ ...user, profilePhoto: profilePhoto || user?.profilePhoto }}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={authService.logout}
          onOpenProfile={() => setShowProfile(true)}
        />
        <main className="dir-main">
          <header className="dir-header">
            <h1>{active[0].toUpperCase() + active.slice(1)}</h1>
            <div>
              {['teachers', 'students', 'projects'].includes(active) && (
                <input
                  className="dir-input"
                  placeholder="Search name, email, roll no, or ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              )}
              <button onClick={exportReport}>Generate Report</button>
              <button onClick={load}>Refresh</button>
              <button className="dir-avatar-btn" onClick={() => setShowProfile(true)} title="Open profile">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={profileName} className="dir-avatar-image" />
                ) : (
                  <span className="dir-avatar-fallback">{(profileName || 'D').charAt(0).toUpperCase()}</span>
                )}
              </button>
            </div>
          </header>
          {['teachers', 'students', 'projects'].includes(active) && (
            <section className="filters">
              <label>Department</label>
              <select className="dir-input" value={department} onChange={(e) => setDepartment(e.target.value)}>
                {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {active === 'projects' && (
                <>
                  <label>Status</label>
                  <select className="dir-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {['all', 'active', 'completed', 'draft', 'archived'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </>
              )}
            </section>
          )}

          {loading && (
            <div className="dir-loader">
              <LogoLoader compact />
            </div>
          )}

          {!loading && active === 'overview' && (
            <>
              <section className="cards">
                <article><p>Total Projects</p><h3>{fmt(data.projects.length)}</h3></article>
                <article><p>Teachers</p><h3>{fmt(data.teachers.length)}</h3></article>
                <article><p>Students</p><h3>{fmt(data.students.length)}</h3></article>
                <article><p>Assignments</p><h3>{fmt(totals.totalAssignments)}</h3></article>
                <article><p>Pending Reviews</p><h3>{fmt(data.stats.pendingReviews || 0)}</h3></article>
                <article><p>Grading Rate</p><h3>{pct(totals.totalGraded, totals.totalAssignments)}%</h3></article>
              </section>

              <section className="chart">
                <div className="chart-head">
                  <h3>Projects by Department</h3>
                  <div>
                    <button className={chartType === 'bar' ? 'active' : ''} onClick={() => setChartType('bar')}>Bar Chart</button>
                    <button className={chartType === 'pie' ? 'active' : ''} onClick={() => setChartType('pie')}>Pie Chart</button>
                    <button onClick={() => { setChartDept('all'); setDepartment('all'); }}>Clear</button>
                  </div>
                </div>
                {chartData.length === 0 && <Empty msg="No data for chart." />}
                {chartData.length > 0 && chartType === 'bar' && (
                  <BarChart
                    items={chartData}
                    selected={chartDept}
                    onSelect={(d) => { setChartDept(d); setDepartment(d); setActive('projects'); }}
                  />
                )}
                {chartData.length > 0 && chartType === 'pie' && (
                  <div className="pie-layout">
                    <div className="pie-visual" style={{ background: `conic-gradient(${pieGradient})` }} />
                    <ul className="pie-list">
                      {pieSegments.map((d) => (
                        <li key={d.label}>
                          <button className={chartDept === d.label ? 'active' : ''} onClick={() => { setChartDept(d.label); setDepartment(d.label); setActive('projects'); }}>
                            <span><i style={{ background: d.color }} />{d.label}</span><strong>{d.value}</strong>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </>
          )}

          {!loading && active === 'departments' && (
            <section className="table">
              <header><span>Department</span><span>Students</span><span>Teachers</span><span>Projects</span><span>Submission</span><span>Graded</span></header>
              {data.departments.length === 0 && <Empty msg="No department data available." />}
              {data.departments.map((d) => (
                <div key={d.name}>
                  <span>{d.name}</span>
                  <span>{fmt(d.students)}</span>
                  <span>{fmt(d.teachers)}</span>
                  <span>{fmt(d.totalProjects)}</span>
                  <span>{pct(d.submitted + d.graded, d.totalAssignments)}%</span>
                  <span>{pct(d.graded, d.totalAssignments)}%</span>
                </div>
              ))}
            </section>
          )}

          {!loading && active === 'teachers' && (
            <section className="table">
              <header><span>Name</span><span>Department</span><span>Projects</span><span>Students</span><span>Pending</span><span>Efficiency</span><span>Details</span></header>
              {teachers.length === 0 && <Empty msg="No teachers found." />}
              {teachers.map((t) => (
                <div key={t.id}>
                  <span>{t.name}</span>
                  <span>{t.department || 'Unassigned'}</span>
                  <span>{fmt(t.totalProjects)}</span>
                  <span>{fmt(t.totalStudents)}</span>
                  <span>{fmt(t.pending)}</span>
                  <span>{pct(t.graded, t.totalStudents)}%</span>
                  <span><button onClick={() => setTeacherDetail(t)}>View</button></span>
                </div>
              ))}
            </section>
          )}

          {!loading && active === 'projects' && (
            <section className="table">
              <header><span>Project</span><span>Teacher</span><span>Department</span><span>Status</span><span>Due</span><span>Students</span><span>Submitted</span></header>
              {projects.length === 0 && <Empty msg="No projects found." />}
              {projects.map((p) => (
                <div key={p.id}>
                  <span>{p.title}</span>
                  <span>{p.teacherName || '-'}</span>
                  <span>{p.department || 'Unassigned'}</span>
                  <span>{p.status}</span>
                  <span>{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '-'}</span>
                  <span>{fmt(p.totalStudents || 0)}</span>
                  <span>{pct((p.submitted || 0) + (p.graded || 0), p.totalStudents || 0)}%</span>
                </div>
              ))}
            </section>
          )}

          {!loading && active === 'students' && (
            <section className="table student">
              <header><span>Name</span><span>Email</span><span>Department</span><span>Joined</span><span>Details</span></header>
              {students.length === 0 && <Empty msg="No students found." />}
              {students.map((s) => (
                <div key={s.id}>
                  <span>{s.name}</span>
                  <span>{s.email}</span>
                  <span>{s.department || 'Unassigned'}</span>
                  <span>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-'}</span>
                  <span><button onClick={() => setStudentDetail(s)}>View</button></span>
                </div>
              ))}
            </section>
          )}

          {!loading && active === 'users' && (
            <section>
              <UserManagement onSuccess={load} />
            </section>
          )}

          {teacherDetail && (
            <Modal
              title={`Teacher: ${teacherDetail.name}`}
              rows={[
                { label: 'ID', value: teacherDetail.id ?? '-' },
                { label: 'Roll No', value: teacherDetail.rollNo || teacherDetail.rollNumber || teacherDetail.registrationNo || '-' },
                { label: 'Email', value: teacherDetail.email },
                { label: 'Department', value: teacherDetail.department || 'Unassigned' },
                { label: 'Projects', value: teacherDetail.totalProjects },
                { label: 'Students', value: teacherDetail.totalStudents },
                { label: 'Pending Reviews', value: teacherDetail.pending },
                { label: 'Efficiency', value: `${pct(teacherDetail.graded, teacherDetail.totalStudents)}%` }
              ]}
              onClose={() => setTeacherDetail(null)}
            />
          )}
          {studentDetail && (
            <Modal
              title={`Student: ${studentDetail.name}`}
              rows={[
                { label: 'ID', value: studentDetail.id ?? '-' },
                { label: 'Roll No', value: studentDetail.rollNo || studentDetail.rollNumber || studentDetail.registrationNo || '-' },
                { label: 'Email', value: studentDetail.email },
                { label: 'Department', value: studentDetail.department || 'Unassigned' },
                { label: 'Joined', value: studentDetail.createdAt ? new Date(studentDetail.createdAt).toLocaleString() : '-' }
              ]}
              onClose={() => setStudentDetail(null)}
            />
          )}

          {showProfile && (
            <div className="dir-profile-layer">
              <DirectorProfile
                onClose={() => {
                  setShowProfile(false);
                  void fetchProfileSnapshot();
                }}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            </div>
          )}
        </main>
      </div>
    </>
  );
}

const styles = `
  .dir-shell {
    --bg: #0a0e27;
    --bg-2: #141835;
    --surface: rgba(20, 24, 53, 0.86);
    --soft: rgba(30, 36, 69, 0.82);
    --ink: #e8eaed;
    --muted: #9ca3af;
    --border: rgba(255, 255, 255, 0.12);
    --accent: #0066ff;
    --danger: #ff7b84;
    min-height: 100vh;
    display: grid;
    grid-template-columns: 260px 1fr;
    background:
      radial-gradient(circle at 8% 4%, rgba(110, 93, 255, 0.28), transparent 36%),
      radial-gradient(circle at 92% 10%, rgba(90, 162, 255, 0.22), transparent 42%),
      linear-gradient(150deg, var(--bg), var(--bg-2) 50%, #060b14 100%);
    color: var(--ink);
    font-family: "Outfit", sans-serif;
  }

  .dir-shell.dark {
    --bg: #0a0e27;
  }

  .dir-sidebar {
    padding: 18px;
    border-right: 1px solid var(--border);
    background: rgba(10, 14, 39, 0.72);
    display: grid;
    gap: 10px;
    align-content: start;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: auto;
  }

  .dir-sidebar h2 { margin: 0; font: 700 24px "Syne", serif; }
  .dir-sidebar p { margin: 0; color: var(--muted); font-size: 12px; }

  .dir-user {
    display: flex;
    gap: 8px;
    align-items: center;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 10px 0;
  }

  .dir-user > span {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--accent);
    color: #081320;
    font-weight: 700;
    overflow: hidden;
  }

  .dir-user-avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dir-user strong,
  .dir-user small { display: block; }

  .dir-sidebar nav { display: grid; gap: 6px; }

  .dir-sidebar button {
    border: 1px solid var(--border);
    background: var(--soft);
    color: var(--ink);
    border-radius: 10px;
    padding: 9px 10px;
    cursor: pointer;
    text-align: left;
    font-weight: 600;
  }

  .dir-sidebar .active {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }

  .dir-sidebar .danger {
    border-color: var(--danger);
    color: var(--danger);
  }

  .dir-main { padding: 22px; }

  .dir-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .dir-header h1 {
    margin: 0;
    font: 700 30px "Syne", serif;
  }

  .dir-header > div {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .dir-header button {
    border: 1px solid var(--border);
    background: var(--soft);
    color: var(--ink);
    border-radius: 10px;
    padding: 8px 10px;
    cursor: pointer;
    font-weight: 600;
  }

  .dir-avatar-btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    padding: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .dir-avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dir-avatar-fallback {
    font-family: "Syne", serif;
    font-size: 16px;
    font-weight: 700;
  }

  .dir-input {
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--ink);
    border-radius: 10px;
    padding: 8px 10px;
    min-width: 180px;
  }

  .filters {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 10px 0 12px;
    flex-wrap: wrap;
  }

  .filters label { font-size: 12px; color: var(--muted); }

  .cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 12px;
  }

  .cards article {
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
    padding: 12px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
  }

  .cards p { margin: 0; color: var(--muted); font-size: 12px; }
  .cards h3 { margin: 6px 0 0; font: 700 24px "Syne", serif; }

  .chart {
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
    padding: 12px;
  }

  .chart-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
  }

  .chart-head h3 { margin: 0; font: 700 22px "Syne", serif; }
  .chart-head > div { display: flex; gap: 8px; flex-wrap: wrap; }

  .chart-head button {
    border: 1px solid var(--border);
    background: var(--soft);
    color: var(--ink);
    border-radius: 10px;
    padding: 6px 10px;
    cursor: pointer;
  }

  .chart-head .active { border-color: var(--accent); }

  .bars {
    display: flex;
    align-items: end;
    gap: 10px;
    padding-top: 10px;
    overflow: auto;
  }

  .bars button {
    border: 0;
    background: transparent;
    color: var(--ink);
    display: grid;
    gap: 4px;
    min-width: 90px;
    text-align: center;
    cursor: pointer;
  }

  .bars button div {
    width: 38px;
    margin: 0 auto;
    border-radius: 8px 8px 4px 4px;
    background: linear-gradient(180deg, #4da0ff, #ff3366);
  }

  .pie-layout {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 10px;
    align-items: center;
  }

  .pie-visual {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    margin: 0 auto;
    border: 1px solid var(--border);
    box-shadow: inset 0 0 0 24px var(--surface);
  }

  .pie-list {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }

  .pie-list button {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid var(--border);
    background: var(--soft);
    color: var(--ink);
    border-radius: 10px;
    padding: 7px 10px;
    cursor: pointer;
  }

  .pie-list button span { display: flex; align-items: center; gap: 7px; }
  .pie-list button i { display: inline-block; width: 10px; height: 10px; border-radius: 999px; }
  .pie-list .active { border-color: var(--accent); }

  .table {
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
    overflow: auto;
  }

  .table header,
  .table > div {
    min-width: 860px;
    display: grid;
    grid-template-columns: repeat(7, minmax(100px, 1fr));
    gap: 8px;
    padding: 10px;
    border-bottom: 1px solid var(--border);
    align-items: center;
  }

  .table.student header,
  .table.student > div {
    min-width: 680px;
    grid-template-columns: 1.2fr 1.8fr 1fr 1fr 90px;
  }

  .table header {
    background: var(--soft);
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 700;
  }

  .table button {
    border: 1px solid var(--border);
    background: var(--soft);
    color: var(--ink);
    border-radius: 8px;
    padding: 4px 8px;
    cursor: pointer;
  }

  .empty { padding: 14px; color: var(--muted); }

  .dir-loader {
    min-height: 240px;
    display: grid;
    place-items: center;
  }

  .modal-bg {
    position: fixed;
    inset: 0;
    background: rgba(1, 5, 12, 0.62);
    display: grid;
    place-items: center;
    z-index: 40;
  }

  .modal {
    width: min(520px, 92vw);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    color: var(--ink);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.34);
  }

  .modal header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid var(--border);
    background: var(--soft);
  }

  .modal header h3 { margin: 0; font: 700 20px "Syne", serif; }

  .modal header button {
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--ink);
    border-radius: 8px;
    padding: 6px 10px;
    cursor: pointer;
  }

  .modal div p {
    margin: 0;
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .modal div p:nth-child(even) { background: var(--soft); }

  .dir-profile-layer {
    position: fixed;
    inset: 0;
    z-index: 45;
    overflow: auto;
    background: linear-gradient(160deg, var(--bg), var(--bg-2));
  }

  @media (max-width: 1040px) {
    .dir-shell { grid-template-columns: 1fr; }
    .dir-sidebar {
      border-right: 0;
      border-bottom: 1px solid var(--border);
      position: static;
      height: auto;
      background: rgba(10, 16, 28, 0.75);
    }
    .dir-sidebar nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cards { grid-template-columns: 1fr 1fr; }
    .dir-main { padding: 16px; }
    .dir-header { flex-direction: column; align-items: flex-start; }
    .dir-header > div { width: 100%; }
    .dir-input { min-width: 0; width: 100%; }
    .pie-layout { grid-template-columns: 1fr; }
  }

  @media (max-width: 700px) {
    .cards { grid-template-columns: 1fr; }
    .dir-sidebar nav { grid-template-columns: 1fr; }
    .chart-head { flex-direction: column; align-items: flex-start; }
  }
`;



