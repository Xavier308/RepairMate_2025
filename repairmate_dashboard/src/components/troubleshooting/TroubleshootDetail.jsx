import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMachineDetails, submitTroubleshootingRequest, fetchIssuesForMachine, getMachineImages } from '@/services/api';
import { FaArrowUp, FaCog, FaMagic, FaBookmark, FaLock } from 'react-icons/fa';
import './TroubleshootDetail.css';


function TroubleshootDetail() {
    const { machineId } = useParams();
    const navigate = useNavigate();
    const [machine, setMachine] = useState(null);
    const [description, setDescription] = useState('');
    const [commonIssues, setCommonIssues] = useState([]);
    const [matchingIssues, setMatchingIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMachineModal, setShowMachineModal] = useState(false);
    const textareaRef = useRef(null);

    useEffect(() => {
        const loadMachineDetails = async () => {
            try {
                setLoading(true);
                const [machineResponse, issuesResponse] = await Promise.all([
                    fetchMachineDetails(machineId),
                    fetchIssuesForMachine(machineId)
                ]);

                if (machineResponse && machineResponse.data) {
                    const imagesResponse = await getMachineImages(machineId);
                    setMachine({
                        ...machineResponse.data,
                        image_url: imagesResponse.data.length > 0 ? imagesResponse.data[0].url : 'https://img.perceptpixel.com/bibawdef/RepairMate/default_machine.png'
                    });
                } else {
                    setError('Failed to load machine details');
                }
                
                if (Array.isArray(issuesResponse)) {
                    const issues = issuesResponse.slice(0, 3).map(issue => ({
                        id: issue.id,
                        title: issue.title,
                        guideId: issue.id
                    }));
                    setCommonIssues(issues);
                } else {
                    setCommonIssues([]);
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching machine details or issues:', error);
                setError('Failed to load machine details or issues');
                setLoading(false);
            }
        };

        loadMachineDetails();
    }, [machineId]);

    const handleIssueClick = (issue) => {
        if (issue && issue.id) {
            navigate(`/issue/${issue.id}`, { state: { machineId } });
        } else {
            console.error('Invalid issue object:', issue);
            setError('Error navigating to issue details');
        }
    };

    const handleSubmitIssue = async () => {
        try {
            const response = await submitTroubleshootingRequest(machineId, description);
            if (response && Array.isArray(response.matching_issues)) {
                setMatchingIssues(response.matching_issues);
            } else {
                console.error('Unexpected response format:', response);
                setMatchingIssues([]);
                setError('Unexpected response from server');
            }
        } catch (error) {
            console.error('Error submitting issue:', error);
            setMatchingIssues([]);
            setError('Failed to submit issue');
        }
    };
  
  const handleEditMachine = () => {
    navigate(`/edit-machine/${machineId}`);
  };

  const handleAllIssues = () => {
    navigate(`/all-issues/${machineId}`);
  };

  const handleTextareaChange = (e) => {
    setDescription(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitIssue();
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;


  return (
    <div className="troubleshoot-detail-container">
      
        <div className="troubleshoot-detail-content">
            <div className="troubleshoot-input-section">
            <h2 className="troubleshoot-title">Troubleshoot</h2>
                <div className="troubleshoot-input-container">
                    <textarea
                        ref={textareaRef}
                        className="troubleshoot-input"
                        placeholder="Describe your problem..."
                        value={description}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                    />
                    <button className="submit-button" onClick={handleSubmitIssue}>
                        <FaArrowUp />
                    </button>
                </div>
                {error && <div className="error-message">{error}</div>}
                
                {matchingIssues.length > 0 && (
                    <div className="matching-issues">
                        <h3>Matching Issues:</h3>
                        {matchingIssues.map(issue => (
                            <div 
                                key={issue.id} 
                                className="issue-item"
                                onClick={() => handleIssueClick(issue)}
                            >
                                <h4>{issue.title}</h4>
                                <p>{issue.description ? issue.description.substring(0, 100) : ''}...</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="common-issues-card">
                    <div className="common-issues-header">
                        <h2>Common Issues</h2>
                        <button className="all-issues-btn" onClick={handleAllIssues}>All Issues</button>
                    </div>
                    <ul className="common-issues-list">
                        {commonIssues.map(issue => (
                            <li key={issue.id} onClick={() => handleIssueClick(issue)}>
                                {issue.title}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="machine-info-section">
                <div className="machine-info-card" onClick={() => setShowMachineModal(true)}>
                    <div className="machine-header">
                        <FaMagic 
                            className="machine-header-icon icon-FaMagic" 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSubmitIssue();
                            }}
                            title="Repair It!"
                        />
                        <h3>{machine.name}</h3>
                        <FaBookmark className="machine-header-icon icon-bookmark" title="Feature coming soon" />
                        <FaLock className="machine-header-icon icon-lock" title="Feature coming soon" />
                    </div>
                    <div className="troubleshoot-machine-image">
                        <img src={machine.image_url} alt={machine.name} />
                    </div>
                    <div className="machine-info-content">                      
                        <p><span className="info-label">Model:</span> {machine.model}</p>
                        <p><span className="info-label">Description:</span> {machine.description}</p>
                    </div>
                </div>
            </div>
  
        {showMachineModal && (
          <div className="machine-modal">
            <div className="machine-modal-content">
              <span className="close" onClick={() => setShowMachineModal(false)}>&times;</span>
              <h2>{machine.name}</h2>
              <div className="machine-modal-image-container">
                <img src={machine.image_url} alt={machine.name} />
              </div>
              <div className="machine-info-grid">
                <div className="machine-info-item">
                  <strong>Model:</strong>
                  <span>{machine.model}</span>
                </div>
                <div className="machine-info-item">
                  <strong>Category:</strong>
                  <span>{machine.category || 'N/A'}</span>
                </div>
                <div className="machine-info-item">
                  <strong>Manufacturer:</strong>
                  <span>{machine.manufacturer || 'N/A'}</span>
                </div>
                <div className="machine-info-item">
                  <strong>Department:</strong>
                  <span>{machine.department || 'N/A'}</span>
                </div>
                <div className="machine-info-item">
                  <strong>Machine Type:</strong>
                  <span>{machine.machine_type || 'N/A'}</span>
                </div>
                <div className="machine-info-item">
                  <strong>Description:</strong>
                  <p>{machine.description}</p>
                </div>
                <button className="edit-button" onClick={handleEditMachine}>
                  <FaCog /> Edit Machine
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TroubleshootDetail;
