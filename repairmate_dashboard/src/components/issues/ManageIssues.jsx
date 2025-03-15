import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMachineDetails, createIssue, createSolution } from '@/services/api';
import './ManageIssues.css';

function ManageIssues() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(null);
  const [newIssue, setNewIssue] = useState({ 
    title: '', 
    description: '', 
    error_code: '',
    solutions: ['']
  });
  const [justCreatedIssue, setJustCreatedIssue] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMachineDetails = async () => {
      try {
        setLoading(true);
        const response = await fetchMachineDetails(machineId);
        setMachine(response.data);
      } catch (error) {
        console.error('Error loading machine details:', error);
        setError('Failed to load machine details');
      } finally {
        setLoading(false);
      }
    };

    loadMachineDetails();
  }, [machineId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewIssue(prev => ({ ...prev, [name]: value }));
  };

  const handleSolutionChange = (index, value) => {
    setNewIssue(prev => {
      const updatedSolutions = [...prev.solutions];
      updatedSolutions[index] = value;
      return { ...prev, solutions: updatedSolutions };
    });
  };

  const handleRemoveSolution = (index) => {
    setNewIssue(prev => ({
      ...prev,
      solutions: prev.solutions.filter((_, i) => i !== index)
    }));
  };

  const handleAddSolution = () => {
    setNewIssue(prev => ({
      ...prev,
      solutions: [...prev.solutions, '']
    }));
  };

  const handleAllIssues = () => {
    navigate(`/all-issues/${machineId}`);
  };

  const handleAddIssue = async (e) => {
    e.preventDefault();
    try {
      // Create the issue first
      const issueResponse = await createIssue(machineId, {
        title: newIssue.title,
        description: newIssue.description,
        error_code: newIssue.error_code
      });

      // Create solutions for the issue
      if (issueResponse.data && issueResponse.data.id) {
        const solutionPromises = newIssue.solutions
          .filter(solution => solution.trim())
          .map(solution => createSolution(issueResponse.data.id, {
            description: solution
          }));
        
        await Promise.all(solutionPromises);

        // Store the newly created issue with its solutions
        setJustCreatedIssue({
          ...issueResponse.data,
          solutions: newIssue.solutions.filter(s => s.trim()).map(s => ({ description: s }))
        });

        // Reset form and show success message
        setNewIssue({ 
          title: '', 
          description: '', 
          error_code: '',
          solutions: ['']
        });
        setSuccessMessage('Issue created successfully');

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating issue:', error);
      setError('Failed to add issue');
    }
  };

  if (loading) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="manage-issues-container">
      <div className="manage-issues-content">
        <div className="manage-issues-header">
          <h2 className="manage-issues-title">
            Create Issue & Solution for {machine?.name || `Machine ${machineId}`}
          </h2>
          <button className="all-issues-button" onClick={handleAllIssues}>
            All Issues
          </button>
        </div>

        <div className="manage-issues-card">
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
          
          <form onSubmit={handleAddIssue} className="issue-form">
            <input
              type="text"
              name="title"
              value={newIssue.title}
              onChange={handleInputChange}
              placeholder="Issue Title"
              required
              className="form-input"
            />
            <textarea
              name="description"
              value={newIssue.description}
              onChange={handleInputChange}
              placeholder="Issue Description"
              required
              className="form-input form-textarea"
            />
            <input
              type="text"
              name="error_code"
              value={newIssue.error_code}
              onChange={handleInputChange}
              placeholder="Error Code (Optional)"
              className="form-input"
            />
            
            <h4>Solutions:</h4>
            {newIssue.solutions.map((solution, index) => (
              <div key={index} className="solution-input-group">
                <textarea
                  value={solution}
                  onChange={(e) => handleSolutionChange(index, e.target.value)}
                  placeholder={`Solution ${index + 1}`}
                />
                {newIssue.solutions.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveSolution(index)}
                    className="remove-solution-btn"
                  >
                    Remove Solution
                  </button>
                )}
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={handleAddSolution}
              className="add-solution-btn"
            >
              Add Another Solution
            </button>

            <div className="button-group">
              <button type="submit" className="primary-button">
                Save Issue
              </button>
              <button 
                type="button" 
                onClick={() => navigate(`/machines/${machineId}`)}
                className="primary-button secondary-button"
              >
                Back to Machine Details
              </button>
            </div>
          </form>

          {justCreatedIssue && (
            <div className="new-issue-item">
              <h3>Just Created:</h3>
              <p><strong>Title:</strong> {justCreatedIssue.title}</p>
              <p><strong>Description:</strong> {justCreatedIssue.description}</p>
              {justCreatedIssue.error_code && (
                <p><strong>Error Code:</strong> {justCreatedIssue.error_code}</p>
              )}
              {justCreatedIssue.solutions && justCreatedIssue.solutions.length > 0 && (
                <>
                  <h4>Solutions:</h4>
                  {justCreatedIssue.solutions.map((solution, index) => (
                    <p key={index} className="solution-item">
                      {solution.description}
                    </p>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageIssues;