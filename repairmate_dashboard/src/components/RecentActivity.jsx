import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  FaTools, FaWrench, FaPlus, FaPencilAlt, 
  FaEye, FaCheckCircle, FaExclamationCircle 
} from 'react-icons/fa';
import { fetchActivityLogs } from '../services/api';

// Component to display an appropriate icon based on the activity type
const ActivityIcon = ({ type }) => {
    switch (type) {
      case 'MACHINE_CREATE':
        return <FaPlus className="activity-icon create" />;
      case 'MACHINE_UPDATE':
        return <FaPencilAlt className="activity-icon update" />;
      case 'MACHINE_VIEW':
        return <FaEye className="activity-icon view" />;
      case 'ISSUE_CREATE':
        return <FaExclamationCircle className="activity-icon issue" />;
      case 'ISSUE_UPDATE':
        return <FaWrench className="activity-icon fix" />;
      case 'SOLUTION_CREATE':
      case 'SOLUTION_UPDATE':
        return <FaCheckCircle className="activity-icon solution" />;
      default:
        return <FaTools className="activity-icon default" />;
    }
  };

// Main component to display recent activity logs
const RecentActivity = () => {
  const [activities, setActivities] = useState([]); // Stores the list of activities
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error message

  // Effect to load recent activity logs on component mount
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setIsLoading(true);
        const response = await fetchActivityLogs(); // Fetch activity logs from the API
        setActivities(response.data.slice(0, 10)); // Limit to the 10 most recent logs
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Unable to load recent activities');
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, []);

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <div className="activity-section">
        <h2>Recent Activity</h2>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Display error message if there was a problem loading activities
  if (error) {
    return (
      <div className="activity-section">
        <h2>Recent Activity</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  // Formats the description to include the machine name if it's not already part of the description
  const formatDescription = (description, machineName) => {
    if (description.includes(machineName)) {
      return description;
    }
    return `${description}${machineName ? ` (${machineName})` : ''}`;
  };

  return (
    <div className="activity-section">
      <h2>Recent Activity</h2>
      <div className="activity-list">
        {!activities || activities.length === 0 ? (
          <p className="no-activity">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <ActivityIcon type={activity.activity_type} />
              <div className="activity-content">
                <p className="activity-description">
                  {activity.description}
                  {activity.machine_name && !activity.description.includes(activity.machine_name) && 
                    <span className="machine-name"> ({activity.machine_name})</span>
                  }
                </p>
                <span className="activity-time">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
