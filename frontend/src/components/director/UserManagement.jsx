import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const ROLE_OPTIONS = ['student', 'teacher'];

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'student',
  department: '',
  rollNo: '',
  employeeId: ''
};

function parseCsv(text) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 2) return [];

  const headers = rows[0].split(',').map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const values = row.split(',').map((v) => v.trim());
    return headers.reduce((acc, header, i) => {
      acc[header] = values[i] || '';
      return acc;
    }, {});
  });
}

function AddSingleUser({ onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const canSubmit = useMemo(() => {
    return form.name.trim() && form.email.trim() && form.password.length >= 6;
  }, [form]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
    setMessage('');
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let value = '';
    for (let i = 0; i < 12; i += 1) {
      value += chars[Math.floor(Math.random() * chars.length)];
    }
    update('password', value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!canSubmit) {
      setError('Name, email, and a 6+ char password are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        department: form.department.trim() || null,
        rollNo: form.role === 'student' ? (form.rollNo.trim() || null) : null,
        employeeId: form.role === 'teacher' ? (form.employeeId.trim() || null) : null
      };

      await api.post('/auth/create-user', payload);
      setMessage('User created successfully.');
      setForm(INITIAL_FORM);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="um-card" onSubmit={handleSubmit}>
      <div className="um-row">
        <label>
          Role
          <select value={form.role} onChange={(e) => update('role', e.target.value)}>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </label>
        <label>
          Department
          <input value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="Computer Science" />
        </label>
      </div>

      <div className="um-row">
        <label>
          Name
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        </label>
      </div>

      <div className="um-row">
        <label>
          Password
          <input value={form.password} onChange={(e) => update('password', e.target.value)} minLength={6} required />
        </label>
        <button type="button" className="um-secondary" onClick={generatePassword}>Generate Password</button>
      </div>

      {form.role === 'student' && (
        <label>
          Roll No
          <input value={form.rollNo} onChange={(e) => update('rollNo', e.target.value)} placeholder="CS21001" />
        </label>
      )}

      {form.role === 'teacher' && (
        <label>
          Employee ID
          <input value={form.employeeId} onChange={(e) => update('employeeId', e.target.value)} placeholder="EMP001" />
        </label>
      )}

      {error && <p className="um-error">{error}</p>}
      {message && <p className="um-success">{message}</p>}

      <button className="um-primary" type="submit" disabled={loading || !canSubmit}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}

function BulkImport({ onSuccess }) {
  const [fileName, setFileName] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCsv(String(e.target?.result || ''));
      setUsers(parsed);
      setFileName(file.name);
      setResult(null);
      setError(parsed.length ? '' : 'No rows found in file.');
    };
    reader.readAsText(file);
  };

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/bulk/template', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download template.');
    }
  };

  const runImport = async () => {
    if (!users.length) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/bulk/import-users', { users });
      setResult(res.data);
      if (res.data?.summary?.successful > 0) {
        onSuccess?.();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk import failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="um-card">
      <div className="um-actions">
        <button type="button" className="um-secondary" onClick={downloadTemplate}>Download CSV Template</button>
        <label className="um-secondary um-file">
          Upload CSV
          <input type="file" accept=".csv,.txt" onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
      </div>

      {fileName && <p className="um-muted">Loaded: {fileName} ({users.length} rows)</p>}

      {users.length > 0 && (
        <>
          <div className="um-preview">
            <table>
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th></tr>
              </thead>
              <tbody>
                {users.slice(0, 8).map((user, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{user.name || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>{user.role || '-'}</td>
                    <td>{user.department || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="um-primary" onClick={runImport} disabled={loading}>
            {loading ? 'Importing...' : `Import ${users.length} Users`}
          </button>
        </>
      )}

      {result?.summary && (
        <div className="um-result">
          <p>Created: {result.summary.successful}</p>
          <p>Skipped: {result.summary.skipped}</p>
          <p>Failed: {result.summary.failed}</p>
        </div>
      )}

      {error && <p className="um-error">{error}</p>}
    </div>
  );
}

function ExistingUsers({ onSuccess }) {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'student',
    department: '',
    rollNo: '',
    employeeId: ''
  });

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/auth/all-users');
      const rows = (res.data?.users || []).filter((u) => u.role !== 'director');
      setUsers(rows);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.name, u.email, u.role, u.rollNo, u.employeeId, u.department]
      .some((val) => String(val || '').toLowerCase().includes(q)));
  }, [users, query]);

  const startEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'student',
      department: user.department || '',
      rollNo: user.rollNo || '',
      employeeId: user.employeeId || ''
    });
    setError('');
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        department: form.department.trim() || null,
        rollNo: form.role === 'student' ? (form.rollNo.trim() || null) : null,
        employeeId: form.role === 'teacher' ? (form.employeeId.trim() || null) : null
      };
      await api.put(`/auth/users/${editingId}`, payload);
      setMessage('User updated successfully.');
      setEditingId(null);
      await loadUsers();
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user) => {
    const ok = window.confirm(`Delete ${user.name}? This will deactivate the account.`);
    if (!ok) return;

    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.delete(`/auth/users/${user.id}`);
      setMessage('User deleted successfully.');
      if (editingId === user.id) {
        setEditingId(null);
      }
      await loadUsers();
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="um-card">
      <div className="um-actions">
        <input
          className="um-search"
          value={query}
          placeholder="Search name, email, role, roll no"
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="um-secondary" onClick={loadUsers} disabled={loading || saving}>Refresh</button>
      </div>

      {loading && <p className="um-muted">Loading users...</p>}

      {!loading && (
        <div className="um-preview">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Roll/Employee</th><th>Department</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isEditing = editingId === user.id;
                return (
                  <tr key={user.id}>
                    <td>{isEditing ? <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /> : user.name}</td>
                    <td>{isEditing ? <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /> : user.email}</td>
                    <td>
                      {isEditing ? (
                        <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                          {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                        </select>
                      ) : user.role}
                    </td>
                    <td>
                      {isEditing ? (
                        form.role === 'student'
                          ? <input value={form.rollNo} onChange={(e) => setForm((p) => ({ ...p, rollNo: e.target.value }))} placeholder="Roll No" />
                          : <input value={form.employeeId} onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))} placeholder="Employee ID" />
                      ) : (user.rollNo || user.employeeId || '-')}
                    </td>
                    <td>{isEditing ? <input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} /> : (user.department || '-')}</td>
                    <td>
                      <div className="um-inline-actions">
                        {!isEditing && <button type="button" className="um-secondary" onClick={() => startEdit(user)} disabled={saving}>Edit</button>}
                        {isEditing && <button type="button" className="um-primary" onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>}
                        {isEditing && <button type="button" className="um-secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>}
                        <button type="button" className="um-danger" onClick={() => deleteUser(user)} disabled={saving}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredUsers.length === 0 && <p className="um-muted">No users found.</p>}
      {error && <p className="um-error">{error}</p>}
      {message && <p className="um-success">{message}</p>}
    </div>
  );
}

export default function UserManagement({ onSuccess }) {
  const [mode, setMode] = useState('single');

  return (
    <>
      <style>{`
        .um-wrap{display:grid;gap:16px}
        .um-tabs{display:flex;gap:8px;flex-wrap:wrap}
        .um-card{display:grid;gap:12px;border:1px solid #d6dbe3;border-radius:10px;padding:16px;background:#fff}
        .um-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .um-actions{display:flex;gap:8px;flex-wrap:wrap}
        .um-card label{display:grid;gap:6px;font-size:13px;color:#1f2937}
        .um-card input,.um-card select,.um-search{border:1px solid #c7cfdb;border-radius:8px;padding:9px 10px;font-size:14px}
        .um-search{min-width:260px;flex:1}
        .um-primary,.um-secondary,.um-danger{border:0;border-radius:8px;padding:10px 12px;cursor:pointer;font-weight:600}
        .um-primary{background:#0f172a;color:#fff}
        .um-secondary{background:#e5e7eb;color:#111827}
        .um-danger{background:#fee2e2;color:#991b1b}
        .um-secondary.um-file input{display:none}
        .um-error{color:#b91c1c;font-size:13px;margin:0}
        .um-success{color:#166534;font-size:13px;margin:0}
        .um-muted{color:#6b7280;font-size:13px;margin:0}
        .um-preview{overflow:auto;border:1px solid #e5e7eb;border-radius:8px}
        .um-preview table{width:100%;border-collapse:collapse;min-width:940px}
        .um-preview th,.um-preview td{border-bottom:1px solid #edf0f4;padding:8px 10px;text-align:left;font-size:12px;vertical-align:top}
        .um-inline-actions{display:flex;gap:6px;flex-wrap:wrap}
        .um-result{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
        .um-result p{margin:0;padding:8px;border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc;text-align:center}
        @media (max-width:720px){.um-row{grid-template-columns:1fr}.um-search{min-width:0;width:100%}}
      `}</style>

      <div className="um-wrap">
        <div className="um-tabs">
          <button type="button" className="um-secondary" onClick={() => setMode('single')}>Single User</button>
          <button type="button" className="um-secondary" onClick={() => setMode('bulk')}>Bulk Import</button>
          <button type="button" className="um-secondary" onClick={() => setMode('manage')}>Manage Users</button>
        </div>

        {mode === 'single' && <AddSingleUser onSuccess={onSuccess} />}
        {mode === 'bulk' && <BulkImport onSuccess={onSuccess} />}
        {mode === 'manage' && <ExistingUsers onSuccess={onSuccess} />}
      </div>
    </>
  );
}
