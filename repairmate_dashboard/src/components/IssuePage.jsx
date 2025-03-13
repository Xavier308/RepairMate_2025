// IssuePage.js lo dividimos en varios modulos para hacerlo mas manejable
// Ahora son IssuePage + SolutionEditor + ImageUploader
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchIssueDetails, fetchIssueSolutions, updateIssue } from '../services/api';
import SolutionEditor from './SolutionEditor.jsx';
import './IssuePage.css';

function IssuePage() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const machineId = location.state?.machineId;

  const [issue, setIssue] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedIssue, setEditedIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadIssueDetails();
  }, [issueId]);

  const loadIssueDetails = async () => {
    try {
      setLoading(true);
      const issueResponse = await fetchIssueDetails(issueId);
      setIssue(issueResponse);
      setEditedIssue({
        title: issueResponse.title,
        description: issueResponse.description,
      });

      const solutionsResponse = await fetchIssueSolutions(issueId);
      setSolutions(Array.isArray(solutionsResponse) ? solutionsResponse : []);

      setLoading(false);
    } catch (error) {
      console.error('Error loading issue details:', error);
      setError('Failed to load issue details');
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedIssue({
      title: issue.title,
      description: issue.description,
    });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedIssue(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const updatedIssueData = {
        title: editedIssue.title,
        description: editedIssue.description,
      };
      const response = await updateIssue(issueId, updatedIssueData);
      setIssue(response);
      setIsEditing(false);
      navigate(`/issue/${issueId}`, { 
        state: { 
          machineId, 
          successMessage: 'Issue updated successfully!' 
        } 
      });
    } catch (error) {
      console.error('Failed to update issue:', error);
      setError('Failed to update issue. Please try again.');
    }
  };

  if (loading) return <div className="issue-page">Loading...</div>;
  if (error) return <div className="issue-page error-message">{error}</div>;
  if (!issue) return <div className="issue-page">No issue found.</div>;

  return (
    <div className="issue-page">
      {location.state?.successMessage && (
        <div className="success-message">{location.state.successMessage}</div>
      )}
      <h1><strong>Issue:</strong> <span>{isEditing ? 'Edit Issue' : issue.title}</span></h1>
      {isEditing ? (
        <div className="edit-form">
          <input
            name="title"
            value={editedIssue.title}
            onChange={handleInputChange}
            placeholder="Issue Title"
          />
          <textarea
            name="description"
            value={editedIssue.description}
            onChange={handleInputChange}
            placeholder="Description"
          />
          <button onClick={handleSave} className="action-button primary-button">Save</button>
          <button onClick={handleCancel} className="action-button secondary-button">Cancel</button>
        </div>
      ) : (
        //
        <div className="issue-details">
          <div className="description-block">
            <h2>Description:</h2>
            <p>{issue.description}</p>
          </div>
          <SolutionEditor 
            solutions={solutions} 
            setSolutions={setSolutions}
            issueId={issueId}
          />
          <button onClick={handleEdit} className="action-button primary-button">Edit Issue</button>
        </div>
      )}
      <button onClick={() => navigate(`/troubleshoot/${machineId}`)} className="action-button secondary-button">Back to Machine</button>
    </div>
  );
}

export default IssuePage;