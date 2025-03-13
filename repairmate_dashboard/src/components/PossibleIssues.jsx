// Match Issue component for troubleshoot details
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { matchIssues } from '../services/api';
import './PossibleIssues.css';

function PossibleIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { machineId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const description = location.state?.description || '';

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        const response = await matchIssues(machineId, description);
        setIssues(response.data);
      } catch (err) {
        setError('Failed to fetch possible issues');
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [machineId, description]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="possible-issues">
      <h2>Possible Issues</h2>
      <button className="back-button" onClick={() => navigate(-1)}>Go Back</button>
      {issues.length === 0 ? (
        <p className="no-issues">No matching issues found. Please try describing your problem differently.</p>
      ) : (
        <ul className="issues-list">
          {issues.map((issue) => (
            <li key={issue.id} className="issue-item">
              <h3>{issue.code}: {issue.problem_description}</h3>
              <p><strong>Possible Solutions:</strong> {issue.possible_solutions}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PossibleIssues;