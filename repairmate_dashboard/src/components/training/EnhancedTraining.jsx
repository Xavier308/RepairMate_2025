// EnhancedTraining.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaFileUpload, FaTrash, FaEdit } from 'react-icons/fa';
import api from '@/services/api';
import { fetchWorkspaces, createWorkspace } from '@/services/api';
import { format } from 'date-fns';
import './EnhancedTraining.css';


function EnhancedTraining() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddWorkspace, setShowAddWorkspace] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    title: '',
    description: '',
    is_public: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const response = await fetchWorkspaces();
      setWorkspaces(response.data);
    } catch (error) {
      setError('Failed to load training workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      const response = await createWorkspace(newWorkspace);
      setWorkspaces([...workspaces, response.data]);
      setShowAddWorkspace(false);
      setNewWorkspace({ title: '', description: '', is_public: false });
    } catch (error) {
      setError('Failed to create workspace');
    }
  };

  const handleFileUpload = async (workspaceId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    try {
      await api.post(`/api/training/workspaces/${workspaceId}/upload_document/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      loadWorkspaces(); // Reload to get updated documents
    } catch (error) {
      setError('Failed to upload document');
    }
  };

  const handleWorkspaceClick = (workspaceId) => {
    navigate(`/training/workspace/${workspaceId}`);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="training-container">
      <div className="training-header">
        <h1>Workspaces</h1>
        <button 
          className="add-workspace-button"
          onClick={() => setShowAddWorkspace(true)}
        >
          <FaPlus /> Create Workspace
        </button>
      </div>

      {showAddWorkspace && (
        <div className="add-workspace-form">
          <h2>Create New Workspace</h2>
          <form onSubmit={handleCreateWorkspace}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={newWorkspace.title}
                onChange={(e) => setNewWorkspace({...newWorkspace, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newWorkspace.description}
                onChange={(e) => setNewWorkspace({...newWorkspace, description: e.target.value})}
                required
              />
            </div>
            {/*<div className="checkbox-group">
              <input
                type="checkbox"
                id="is_public"
                checked={newWorkspace.is_public}
                onChange={(e) => setNewWorkspace({...newWorkspace, is_public: e.target.checked})}
              />
              <label htmlFor="is_public">Make Public</label>
            </div> */}
            <div className="form-actions">
              <button type="button" className="btn-secondary3" onClick={() => setShowAddWorkspace(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">Create</button>
            </div>
          </form>
        </div>
      )}

        <div className="workspaces-grid">
        {workspaces.map(workspace => (
            <div 
            key={workspace.id} 
            className="workspace-card"
            onClick={() => handleWorkspaceClick(workspace.id)}
            >
            <img
                src="https://img.perceptpixel.com/bibawdef/RepairMate/defaultWorkspaceImage.jpg"
                alt={workspace.title}
                className="workspace-image"
            />
            <div className="workspace-content">
                <div className="workspace-header">
                <h3>{workspace.title}</h3>
                {workspace.is_public && <span className="public-badge">Public</span>}
                </div>
                <p className="workspace-description">{workspace.description}</p>
                <p className="workspace-creation-date">
                Created: {format(new Date(workspace.created_at), 'MMM d, yyyy')}
                </p>
            </div>
            </div>
        ))}
        </div>
    </div>
  );
}

export default EnhancedTraining;