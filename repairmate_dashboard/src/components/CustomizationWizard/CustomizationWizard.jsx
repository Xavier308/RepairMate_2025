import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaCheck, FaChevronRight, FaFilePdf, FaPlus, FaTrash } from 'react-icons/fa';
import { createIssue, createSolution, createGuide, uploadMachineManual } from '@/services/api';
import './CustomizationWizard.css';

// Component for customizing a machine, including uploading manuals and adding issues with solutions and guides
const CustomizationWizard = ({ open, machineId, onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [manualFile, setManualFile] = useState(null);

  // State for issues, each with possible solutions and guides
  const [issues, setIssues] = useState([{
    title: '',
    description: '',
    error_code: '',
    solutions: [{
      description: '',
      guide: {
        title: '',
        steps: []
      }
    }]
  }]);
  
  // Index of the currently active issue
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);

  // Adds a new issue to the list
  const handleAddIssue = () => {
    setIssues(prev => [...prev, {
      title: '',
      description: '',
      error_code: '',
      solutions: [{
        description: '',
        guide: {
          title: '',
          steps: []
        }
      }]
    }]);
    setCurrentIssueIndex(issues.length);  // Set the new issue as active
  };

  // Updates the current issue with new data
  const handleIssueChange = (field, value) => {
    const updatedIssues = [...issues];
    updatedIssues[currentIssueIndex] = {
      ...updatedIssues[currentIssueIndex],
      [field]: value
    };
    setIssues(updatedIssues);
  };

  // Adds a new solution to the current issue
  const handleAddSolution = () => {
    const updatedIssues = [...issues];
    updatedIssues[currentIssueIndex].solutions.push({
      description: '',
      guide: {
        title: '',
        steps: []
      }
    });
    setIssues(updatedIssues);
  };

  // Removes a solution from the current issue
  const handleRemoveSolution = (solutionIndex) => {
    const updatedIssues = [...issues];
    updatedIssues[currentIssueIndex].solutions = 
      updatedIssues[currentIssueIndex].solutions.filter((_, index) => index !== solutionIndex);
    setIssues(updatedIssues);
  };

  // Updates the solution description or guide for a given solution
  const handleSolutionChange = (solutionIndex, field, value) => {
    const updatedIssues = [...issues];
    const solution = updatedIssues[currentIssueIndex].solutions[solutionIndex];
    solution[field] = value;
    setIssues(updatedIssues);
  };

  // Adds a new step to the guide for a specific solution
  const handleAddStep = (solutionIndex) => {
    const updatedIssues = [...issues];
    const solution = updatedIssues[currentIssueIndex].solutions[solutionIndex];
    solution.guide.steps.push({
      step_number: solution.guide.steps.length + 1,
      description: ''
    });
    setIssues(updatedIssues);
  };

  // Updates the description of a guide step
  const handleStepChange = (solutionIndex, stepIndex, value) => {
    const updatedIssues = [...issues];
    const step = updatedIssues[currentIssueIndex].solutions[solutionIndex].guide.steps[stepIndex];
    step.description = value;
    setIssues(updatedIssues);
  };

  // Handles manual file upload, ensuring it is a PDF
  const handleManualFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setManualFile(file);
      setError(null);
    } else {
      setError('Please select a PDF file');
    }
  };

  // Saves data and uploads files/records to the server
  const handleSaveData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Upload the manual file if provided
      if (manualFile) {
        const formData = new FormData();
        formData.append('manual', manualFile);
        await uploadMachineManual(machineId, formData);
      }

      // 2. Create each issue and its solutions/guides
      for (const issue of issues) {
        // skip empty issues
        if (!issue.title.trim()) continue;

        const issueResponse = await createIssue(machineId, {
          title: issue.title,
          description: issue.description,
          error_code: issue.error_code
        });

        if (issueResponse.data?.id) {
          // Create solutions for the issue
          for (const solution of issue.solutions) {
            if (!solution.description.trim()) continue;

            const solutionResponse = await createSolution(issueResponse.data.id, {
              description: solution.description
            });

            // Create a guide if there are steps with descriptions
            if (solution.guide?.title && solution.guide.steps.some(step => step.description.trim())) {
              await createGuide(solutionResponse.data.id, {
                title: solution.guide.title,
                steps: solution.guide.steps.filter(step => step.description.trim())
              });
            }
          }
        }
      }

      setSuccessMessage('Machine customization completed successfully!');
      setTimeout(() => {
        onClose();
        navigate(`/machines/${machineId}`);
      }, 1500);

    } catch (error) {
      console.error('Error saving data:', error);
      setError('Failed to save data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Renders content based on the current step in the wizard
  const renderStepContent = () => {
    switch (step) {
      case 1: // Manual Upload
        return (
          <div className="wizard-content">
            <h3>Add Machine Manual</h3>
            <div className="wizard-manual-upload">
              <FaFilePdf className="wizard-manual-upload-icon" />
              <label>
                {manualFile ? manualFile.name : 'Upload Manual (PDF)'}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleManualFileChange}
                  style={{ display: 'none' }}
                />
              </label>
              {manualFile && (
                <button
                  onClick={() => setManualFile(null)}
                  className="wizard-button remove"
                >
                  Remove Manual
                </button>
              )}
            </div>
          </div>
        );

      case 2: // Issues and Solutions
        return (
          <div className="wizard-content">
            <div className="current-issue-indicator">
                Currently editing Issue {currentIssueIndex + 1} of {issues.length}
            </div>
            <div className="issues-tabs">
              {issues.map((issue, index) => (
                <button
                  key={index}
                  className={`issue-tab ${currentIssueIndex === index ? 'active' : ''}`}
                  onClick={() => setCurrentIssueIndex(index)}
                >
                  {issue.title || `Issue ${index + 1}`}
                </button>
              ))}
              <button
                onClick={handleAddIssue}
                className="add-issue-button"
              >
                <FaPlus /> New Issue
              </button>
            </div>

            <div className="current-issue-form">
              <div className="wizard-form-group">
                <label>Issue Title</label>
                <input
                  type="text"
                  value={issues[currentIssueIndex].title}
                  onChange={(e) => handleIssueChange('title', e.target.value)}
                  placeholder="Issue Title"
                />
              </div>

              <div className="wizard-form-group">
                <label>Description</label>
                <textarea
                  value={issues[currentIssueIndex].description}
                  onChange={(e) => handleIssueChange('description', e.target.value)}
                  placeholder="Issue Description"
                />
              </div>

              <div className="wizard-form-group">
                <label>Error Code (Optional)</label>
                <input
                  type="text"
                  value={issues[currentIssueIndex].error_code}
                  onChange={(e) => handleIssueChange('error_code', e.target.value)}
                  placeholder="Error Code"
                />
              </div>

              <h4>Solutions:</h4>
              {issues[currentIssueIndex].solutions.map((solution, solutionIndex) => (
                <div key={solutionIndex} className="wizard-solution-group">
                  <div className="solution-header">
                    <h5>Solution {solutionIndex + 1}</h5>
                    {issues[currentIssueIndex].solutions.length > 1 && (
                      <button
                        onClick={() => handleRemoveSolution(solutionIndex)}
                        className="wizard-button remove"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={solution.description}
                    onChange={(e) => handleSolutionChange(solutionIndex, 'description', e.target.value)}
                    placeholder={`Solution ${solutionIndex + 1} description`}
                  />
                </div>
              ))}
              
              <button
                onClick={handleAddSolution}
                className="wizard-button secondary"
              >
                <FaPlus /> Add Another Solution
              </button>
            </div>
          </div>
        );

      case 3: // Step Guides
        return (
          <div className="wizard-content">
            <div className="current-issue-indicator">
                Adding guides for Issue {currentIssueIndex + 1} of {issues.length}
            </div>
            <div className="issues-tabs">
              {issues.map((issue, index) => (
                <button
                  key={index}
                  className={`issue-tab ${currentIssueIndex === index ? 'active' : ''}`}
                  onClick={() => setCurrentIssueIndex(index)}
                >
                  {issue.title || `Issue ${index + 1}`}
                </button>
              ))}
            </div>

            {issues[currentIssueIndex].solutions.map((solution, solutionIndex) => (
              <div key={solutionIndex} className="wizard-solution-guide">
                <h4>Guide for Solution {solutionIndex + 1}</h4>
                <div className="wizard-form-group">
                  <label>Guide Title</label>
                  <input
                    type="text"
                    value={solution.guide.title}
                    onChange={(e) => {
                      const updatedIssues = [...issues];
                      updatedIssues[currentIssueIndex].solutions[solutionIndex].guide.title = e.target.value;
                      setIssues(updatedIssues);
                    }}
                    placeholder="Guide Title"
                  />
                </div>

                {solution.guide.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="wizard-step-container">
                    <label>Step {step.step_number}</label>
                    <textarea
                      value={step.description}
                      onChange={(e) => handleStepChange(solutionIndex, stepIndex, e.target.value)}
                      placeholder={`Step ${step.step_number} description`}
                    />
                  </div>
                ))}

                <button
                  onClick={() => handleAddStep(solutionIndex)}
                  className="wizard-button secondary"
                >
                  <FaPlus /> Add Step
                </button>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    if (step === 3) {
      handleSaveData();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSkip = () => {
    const confirmSkip = window.confirm(
      "Are you sure you want to skip the customization? You can add these details later."
    );
    if (confirmSkip) {
      onClose();
      navigate(`/machines/${machineId}`);
    }
  };

  if (!open) return null;

  return (
    <div className="wizard-overlay">
      <div className="wizard-container">
        <div className="wizard-header">
          <h2>Customize Machine</h2>
          <button onClick={handleSkip} className="wizard-close-button">
            <FaTimes />
          </button>
        </div>
        
        <div className="wizard-progress">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="wizard-step">
              <div className={`wizard-step-circle ${
                stepNum === step ? 'current' : 
                stepNum < step ? 'completed' : 'pending'
              }`}>
                {stepNum < step ? <FaCheck /> : stepNum}
              </div>
              {stepNum < 3 && (
                <div className="wizard-step-divider" />
              )}
            </div>
          ))}
        </div>

        {error && <div className="wizard-error">{error}</div>}
        {successMessage && <div className="wizard-success">{successMessage}</div>}

        {renderStepContent()}

        <div className="wizard-footer">
          <button
            onClick={handleSkip}
            className="wizard-button skip"
            disabled={loading}
          >
            Skip for now
          </button>
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="wizard-button secondary"
                disabled={loading}
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="wizard-button primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : step === 3 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationWizard;
