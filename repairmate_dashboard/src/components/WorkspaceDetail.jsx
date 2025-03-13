// WorkspaceDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFileUpload, FaArrowLeft, FaTrash, FaEllipsisV } from 'react-icons/fa';
import { getWorkspace, uploadWorkspaceDocument, deleteWorkspaceDocument, deleteWorkspace } from '../services/api';
import { format } from 'date-fns';
import './WorkspaceDetail.css';

// Component to display and manage the details of a workspace, including its documents
function WorkspaceDetail() {
  const { workspaceId } = useParams(); // Extract workspace ID from URL parameters
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // State to handle error messages
  const [uploading, setUploading] = useState(false);  // State to indicate if a file is being uploaded
  const [showOptions, setShowOptions] = useState(false); // State to toggle options menu

  // Effect to load workspace details when the component mounts or when workspaceId changes
  useEffect(() => {
    loadWorkspaceDetails();
  }, [workspaceId]);

  // Function to load workspace details from the API
  const loadWorkspaceDetails = async () => {
    try {
      const response = await getWorkspace(workspaceId);
      setWorkspace(response.data);
    } catch (error) {
      setError('Failed to load workspace details');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if the file is a PDF
    if (!file.type.includes('pdf')) {
      setError('Only PDF files are allowed');
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // Append file to the form data
    formData.append('title', file.name); // Append file name as title

    setUploading(true); // Set uploading state to true
    try {
      await uploadWorkspaceDocument(workspaceId, formData);
      loadWorkspaceDetails(); // Reload workspace to get updated documents
    } catch (error) {
      setError('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  // Function to handle the deletion of a document
  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await deleteWorkspaceDocument(workspaceId, documentId);
      loadWorkspaceDetails();
    } catch (error) {
      setError('Failed to delete document');
    }
  };

  // Function to handle the deletion of the entire workspace
  const handleDeleteWorkspace = async () => {
    if (!window.confirm('Are you sure you want to delete this workspace? All documents will be permanently deleted.')) {
      return;
    }

    try {
      await deleteWorkspace(workspaceId);
      navigate('/training', { 
        state: { message: 'Workspace deleted successfully' }
      });
    } catch (error) {
      setError('Failed to delete workspace');
    }
  };

  // Show loading message if data is being loaded
  if (loading) return <div className="loading">Loading...</div>;
  // Show error message if there's an error
  if (error) return <div className="error">{error}</div>;
  // Show message if workspace is not found
  if (!workspace) return <div className="error">Workspace not found</div>;

  return (
    <div className="workspace-detail-container">
      <div className="workspace-detail-header">
        <div className="header-actions2">
            <button 
            className="back-button3" 
            onClick={() => navigate('/training')}
            >
            <FaArrowLeft /> Back to Workspaces
            </button>
            <div className="options-container">
                <button 
                className="options-button3"
                onClick={() => setShowOptions(!showOptions)}
                >
                <FaEllipsisV />
                </button>
                {showOptions && (
                <div className="options-menu">
                    <button 
                    className="delete-workspace-button"
                    onClick={handleDeleteWorkspace}
                    >
                    <FaTrash /> Delete Workspace
                    </button>
                </div>
                )}
            </div>
        </div>
        <div className="workspace-info">
          <h1>{workspace.title}</h1>
          {workspace.is_public && <span className="public-badge">Public</span>}
        </div>
      </div>

      <div className="workspace-detail-content">
        <div className="workspace-metadata">
            <p className="workspace-description">Description: {workspace.description}</p>
            <p className="workspace-date">
                Created: {format(new Date(workspace.created_at), 'MMMM d, yyyy')}
            </p>
        </div>

        <div className="documents-section">
          <div className="documents-header">
            <h2>Documents</h2>
            <div className="upload-container">
              <input
                type="file"
                id="file-upload"
                accept=".pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label 
                htmlFor="file-upload" 
                className={`upload-button ${uploading ? 'uploading' : ''}`}
              >
                <FaFileUpload />
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </label>
            </div>
          </div>

          {workspace.documents.length === 0 ? (
            <p className="no-documents">No documents uploaded yet</p>
          ) : (
            <div className="documents-grid">
              {workspace.documents.map(document => (
                <div key={document.id} className="document-card">
                  <div className="document-info">
                    <h3>{document.title}</h3>
                    <p className="document-date">
                      Uploaded: {format(new Date(document.uploaded_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="document-actions">
                    <a 
                      href={document.file} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="view-button"
                    >
                      View PDF
                    </a>
                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      className="delete-button"
                      title="Delete document"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkspaceDetail;