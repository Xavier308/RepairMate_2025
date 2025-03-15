import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { 
  fetchMachineDetails, fetchIssuesForMachine, fetchIssueSolutions,
  fetchSolutionGuide, createSolutionGuide, updateSolutionGuide
} from '@/services/api';

import './StepGuide.css';

function StepGuide() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(null);
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [guide, setGuide] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMachineAndIssues = async () => {
      try {
        setLoading(true);
        const [machineData, issuesData] = await Promise.all([
          fetchMachineDetails(machineId),
          fetchIssuesForMachine(machineId)
        ]);
        setMachine(machineData);
        setIssues(issuesData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading machine and issues:', error);
        setError('Failed to load machine and issues');
        setLoading(false);
      }
    };

    loadMachineAndIssues();
  }, [machineId]);

  useEffect(() => {
    if (selectedIssue) {
      const loadSolutions = async () => {
        try {
          const solutionsData = await fetchIssueSolutions(selectedIssue.id);
          setSolutions(solutionsData);
          // Reset selected solution when new solutions are loaded
          setSelectedSolution(null);
          setGuide(null);
          setSteps([]);
        } catch (error) {
          console.error('Error loading solutions:', error);
          setError('Failed to load solutions');
        }
      };

      loadSolutions();
    }
  }, [selectedIssue]);

  useEffect(() => {
    if (selectedSolution) {
      const loadGuide = async () => {
        try {
          const guideData = await fetchSolutionGuide(selectedSolution.id);
          setGuide(guideData || { title: '', steps: [] });
          setSteps(guideData ? guideData.steps : []);
        } catch (error) {
          console.error('Error loading guide:', error);
          // If there's an error (like 404 Not Found), initialize with empty data
          setGuide({ title: '', steps: [] });
          setSteps([]);
        }
      };

      loadGuide();
    }
  }, [selectedSolution]);

  const handleIssueSelect = (event) => {
    const issueId = parseInt(event.target.value);
    const issue = issues.find(i => i.id === issueId);
    setSelectedIssue(issue);
  };

  const handleSolutionSelect = (event) => {
    const solutionId = parseInt(event.target.value);
    const solution = solutions.find(s => s.id === solutionId);
    setSelectedSolution(solution);
  };

  const handleGuideChange = (e) => {
    setGuide({ ...guide, [e.target.name]: e.target.value });
  };

  const handleStepChange = (index, field, value) => {
    const updatedSteps = steps.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    );
    setSteps(updatedSteps);
  };

  const handleAddStep = () => {
    setSteps([...steps, { 
      step_number: steps.length + 1, 
      description: '',
      image_urls: [],
      video_urls: []
    }]);
  };

  const handleRemoveStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedSolution) {
      setError('Please select a solution before saving the guide.');
      return;
    }

    try {
      const guideData = {
        title: guide?.title || `Guide for ${selectedSolution.description}`,
        steps: steps.filter(step => step.description.trim() !== '')
      };
      
      if (guide?.id) {
        await updateSolutionGuide(guide.id, guideData);
      } else {
        await createSolutionGuide(selectedSolution.id, guideData);
      }
      
      navigate(`/machines/${machineId}`);
    } catch (error) {
      console.error('Failed to save guide:', error);
      setError('Failed to save guide. Please try again.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="step-guide">
      <h1>Edit Step Guide for {machine?.name}</h1>
      <div className="selection-area">
        <select onChange={handleIssueSelect} value={selectedIssue?.id || ''}>
          <option value="">Select an Issue</option>
          {issues.map(issue => (
            <option key={issue.id} value={issue.id}>{issue.title}</option>
          ))}
        </select>
        {selectedIssue && (
          <select onChange={handleSolutionSelect} value={selectedSolution?.id || ''}>
            <option value="">Select a Solution</option>
            {solutions.map(solution => (
              <option key={solution.id} value={solution.id}>{solution.description}</option>
            ))}
          </select>
        )}
      </div>
      {selectedSolution && (
        <>
          <input
            name="title"
            value={guide?.title || ''}
            onChange={handleGuideChange}
            placeholder="Guide Title"
          />
          {steps.map((step, index) => (
            <div key={index} className="step">
              <input
                value={step.step_number}
                onChange={(e) => handleStepChange(index, 'step_number', e.target.value)}
                placeholder="Step Number"
              />
              <textarea
                value={step.description}
                onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                placeholder="Step Description"
              />
              <button onClick={() => handleRemoveStep(index)}>Remove Step</button>
            </div>
          ))}
          <button onClick={handleAddStep}>Add Step</button>
          <button onClick={handleSave}>Save Guide</button>
        </>
      )}
      <button onClick={() => navigate(`/machines/${machineId}`)}>Cancel</button>
    </div>
  );
}

export default StepGuide;
