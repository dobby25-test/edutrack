import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const parseDepartment = (department) => {
  if (!department || typeof department !== 'string') {
    return { stream: 'Unspecified Stream', batch: 'Unspecified Batch' };
  }

  const parts = department
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return { stream: parts[0], batch: parts.slice(1).join(' - ') };
  }

  return { stream: department.trim(), batch: 'General Batch' };
};

function StudentSelector({ projectId, onAssign, onClose }) {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStream, setSelectedStream] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setError('');
      const response = await api.get('/auth/students');
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setError(error.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const streamOptions = useMemo(() => {
    const streams = new Set();

    students.forEach((student) => {
      const { stream } = parseDepartment(student.department);
      streams.add(stream);
    });

    return ['all', ...Array.from(streams).sort((a, b) => a.localeCompare(b))];
  }, [students]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const { stream } = parseDepartment(student.department);
        const matchesStream = selectedStream === 'all' || stream === selectedStream;

        if (!matchesStream) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          student.name.toLowerCase().includes(normalizedSearch) ||
          student.email.toLowerCase().includes(normalizedSearch) ||
          student.department?.toLowerCase().includes(normalizedSearch)
        );
      }),
    [students, selectedStream, normalizedSearch]
  );

  const filteredStudentIds = useMemo(
    () => filteredStudents.map((student) => student.id),
    [filteredStudents]
  );

  const visibleSelectedCount = useMemo(() => {
    const visibleSet = new Set(filteredStudentIds);
    return selectedStudents.filter((id) => visibleSet.has(id)).length;
  }, [filteredStudentIds, selectedStudents]);

  const handleToggleStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssign = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setAssigning(true);
    try {
      await onAssign(projectId, selectedStudents);
    } finally {
      setAssigning(false);
    }
  };

  const handleSelectVisible = () => {
    setSelectedStudents((prev) => {
      const merged = new Set(prev);
      filteredStudentIds.forEach((id) => merged.add(id));
      return [...merged];
    });
  };

  const handleClearVisible = () => {
    const visibleSet = new Set(filteredStudentIds);
    setSelectedStudents((prev) => prev.filter((id) => !visibleSet.has(id)));
  };

  const handleAssignVisibleStudents = async () => {
    if (filteredStudentIds.length === 0) {
      alert('No students available in the current filter');
      return;
    }

    setAssigning(true);
    try {
      await onAssign(projectId, filteredStudentIds);
    } finally {
      setAssigning(false);
    }
  };

  const groupedStudents = useMemo(() => {
    const groups = {};

    filteredStudents.forEach((student) => {
      const { stream, batch } = parseDepartment(student.department);
      const groupKey = `${stream}||${batch}`;

      if (!groups[groupKey]) {
        groups[groupKey] = { key: groupKey, stream, batch, students: [] };
      }

      groups[groupKey].students.push(student);
    });

    return Object.values(groups)
      .sort((a, b) => {
        const streamCompare = a.stream.localeCompare(b.stream);
        if (streamCompare !== 0) return streamCompare;
        return a.batch.localeCompare(b.batch);
      })
      .map((group) => ({
        ...group,
        students: group.students.sort((a, b) => a.name.localeCompare(b.name))
      }));
  }, [filteredStudents]);

  const handleSelectGroup = (groupStudentIds) => {
    setSelectedStudents((prev) => {
      const merged = new Set(prev);
      groupStudentIds.forEach((id) => merged.add(id));
      return [...merged];
    });
  };

  return (
    <div className="td-modal-overlay">
      <div className="td-modal">
        <div className="td-modal-header">
          <div>
            <h2 className="td-card-title">Assign to Students</h2>
            <p className="td-card-subtitle">
              {selectedStudents.length} selected | {visibleSelectedCount} in current view
            </p>
          </div>
          <button onClick={onClose} className="td-button ghost">
            Close
          </button>
        </div>

        <div className="td-form">
          <div className="td-student-filter-row">
            <input
              type="text"
              placeholder="Search students by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="td-input td-student-filter-search"
            />

            <div className="td-student-filter-stream">
              <label className="td-help" htmlFor="stream-filter">
                Stream
              </label>
              <select
                id="stream-filter"
                className="td-select"
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
              >
                <option value="all">All Streams</option>
                {streamOptions
                  .filter((stream) => stream !== 'all')
                  .map((stream) => (
                    <option key={stream} value={stream}>
                      {stream}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <p className="td-card-subtitle">
            Showing {filteredStudents.length} of {students.length} students
            {selectedStream !== 'all' ? ` in ${selectedStream}` : ''}
          </p>

          {error && (
            <div className="td-card" style={{ padding: 12 }}>
              <p className="td-card-subtitle" style={{ color: '#ff9b86' }}>
                {error}
              </p>
            </div>
          )}

          <div className="td-list-item" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="td-button ghost"
              onClick={handleSelectVisible}
              disabled={loading || filteredStudents.length === 0}
            >
              Select Visible
            </button>
            <button
              type="button"
              className="td-button ghost"
              onClick={handleClearVisible}
              disabled={visibleSelectedCount === 0}
            >
              Clear Visible
            </button>
          </div>

          {loading ? (
            <div className="td-card">
              <p className="td-card-subtitle">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="td-card">
              <p className="td-card-subtitle">No students found.</p>
            </div>
          ) : (
            <div className="td-group-list">
              {groupedStudents.map((group) => {
                const groupIds = group.students.map((student) => student.id);
                const selectedCount = groupIds.filter((id) =>
                  selectedStudents.includes(id)
                ).length;

                return (
                  <div key={group.key} className="td-group-card">
                    <div className="td-list-item">
                      <div>
                        <div className="td-card-title" style={{ fontSize: 16 }}>
                          {group.stream}
                        </div>
                        <div className="td-card-subtitle">
                          Batch: {group.batch} | {selectedCount}/{group.students.length} selected
                        </div>
                      </div>
                      <button
                        type="button"
                        className="td-button ghost"
                        onClick={() => handleSelectGroup(groupIds)}
                        disabled={selectedCount === group.students.length}
                      >
                        Select Group
                      </button>
                    </div>
                    <div className="td-list">
                      {group.students.map((student) => {
                        const { batch } = parseDepartment(student.department);
                        return (
                          <div
                            key={student.id}
                            className="td-list-item td-student-row"
                            onClick={() => handleToggleStudent(student.id)}
                          >
                            <div>
                              <div className="td-card-title" style={{ fontSize: 15 }}>
                                {student.name}
                              </div>
                              <div className="td-card-subtitle">{student.email}</div>
                              <div className="td-help">{batch}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleToggleStudent(student.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="td-modal-footer">
          <button onClick={onClose} className="td-button ghost">
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={assigning || selectedStudents.length === 0}
            className="td-button"
          >
            {assigning ? 'Assigning...' : `Assign ${selectedStudents.length} Students`}
          </button>
          <button
            onClick={handleAssignVisibleStudents}
            disabled={assigning || filteredStudents.length === 0}
            className="td-button ghost"
          >
            {assigning ? 'Assigning...' : `Assign Visible (${filteredStudents.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentSelector;
