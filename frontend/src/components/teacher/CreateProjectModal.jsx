import { useState } from 'react';
import projectService from '../../services/projectService';

function CreateProjectModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    dueDate: '',
    maxMarks: 100,
    subject: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await projectService.createProject(formData);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="td-modal-overlay">
      <div className="td-modal">
        <div className="td-modal-header">
          <h2 className="td-card-title">Create New Project</h2>
          <button className="td-button ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="td-form">
          {error && <div className="td-card-subtitle">{error}</div>}

          <div>
            <label className="td-card-subtitle">Project Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="td-input"
              placeholder="e.g., Java Banking System"
            />
          </div>

          <div>
            <label className="td-card-subtitle">Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="td-input"
              placeholder="e.g., Java Programming"
            />
          </div>

          <div>
            <label className="td-card-subtitle">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="td-textarea"
              placeholder="Brief description of the project..."
            />
          </div>

          <div>
            <label className="td-card-subtitle">Requirements</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              className="td-textarea"
              placeholder="List project requirements, expected features, etc..."
            />
          </div>

          <div className="td-grid two">
            <div>
              <label className="td-card-subtitle">Due Date *</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="td-input"
              />
            </div>

            <div>
              <label className="td-card-subtitle">Maximum Marks *</label>
              <input
                type="number"
                name="maxMarks"
                value={formData.maxMarks}
                onChange={handleChange}
                required
                min={1}
                max={1000}
                className="td-input"
              />
            </div>
          </div>

          <div className="td-modal-footer">
            <button type="button" onClick={onClose} className="td-button ghost">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="td-button">
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;
