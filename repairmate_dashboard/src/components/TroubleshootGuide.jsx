/* TroubleshootGuide.js */
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { fetchTroubleshootingGuide } from '../services/api';
import './TroubleshootGuide.css';

function TroubleshootGuide() {
  const { machineId, guideId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGuide = async () => {
      try {
        const response = await fetchTroubleshootingGuide(machineId, guideId);
        setGuide(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load troubleshooting guide');
        setLoading(false);
      }
    };

    loadGuide();
  }, [machineId, guideId]);

  if (loading) return <div>Loading guide...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="troubleshoot-guide">
      <h2>{location.state?.issueTitle || 'Troubleshooting Guide'}</h2>
      {guide && (
        <div>
          <h3>{guide.problem_description}</h3>
          <p>{guide.possible_solutions}</p>
          {/* Add more guide details as needed */}
        </div>
      )}
      <button onClick={() => navigate(-1)}>Back to Machine</button>
    </div>
  );
}

export default TroubleshootGuide;