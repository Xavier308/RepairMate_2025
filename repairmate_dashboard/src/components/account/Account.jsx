import React, { useState, useEffect } from 'react';
import { fetchUserProfile, updateUserProfile } from '@/services/api'
import './Account.css';


const roleOptions = [
  'TECHNICIAN',
  'MECHANIC',
  'HOBBYIST',
  'SUPERVISOR',
  'ADMINISTRATOR',
  'REGULAR'
];

// Component for Profile Tab
const ProfileTab = ({ user, isEditing, editedUser, handleInputChange, handleSubmit, setIsEditing }) => (
  <div className="tab-content">
    {isEditing ? (
      <form className="edit-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="first_name">First Name:</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={editedUser.first_name || ''}
            onChange={handleInputChange}
            disabled={user.account_type === 'PRO_MEMBER' || user.account_type === 'ENTERPRISE_MEMBER'}
          />
        </div>
        <div className="form-group">
          <label htmlFor="last_name">Last Name:</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={editedUser.last_name || ''}
            onChange={handleInputChange}
            disabled={user.account_type === 'PRO_MEMBER' || user.account_type === 'ENTERPRISE_MEMBER'}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={editedUser.email || ''}
            onChange={handleInputChange}
            disabled={user.account_type === 'PRO_MEMBER' || user.account_type === 'ENTERPRISE_MEMBER'}
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">Role:</label>
          <select
            id="role"
            name="role"
            value={editedUser.role || ''}
            onChange={handleInputChange}
            required
            disabled={user.account_type === 'PRO_MEMBER' || user.account_type === 'ENTERPRISE_MEMBER'}
          >
            {roleOptions.map(role => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <button type="submit" className="btn btn-primary">Save Changes</button>
          <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      </form>
    ) : (
      <div className="account-info">
        <p><strong>Name:</strong> {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}</p>
        <p><strong>Email:</strong> {user.email || 'N/A'}</p>
        <p><strong>Role:</strong> {user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()) : 'N/A'}</p>
        <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
      </div>
    )}
  </div>
);

// Subscription component Tab
const SubscriptionTab = ({ user }) => {
  const getFeaturesList = () => {
    if (!user.subscription_plan_details?.features) return [];
    return Object.entries(user.subscription_plan_details.features)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key.replace(/_/g, ' '));
  };

  if (user.account_type === 'PRO_MEMBER' || user.account_type === 'ENTERPRISE_MEMBER') {
    return (
      <div className="tab-content">
        <div className="subscription-info">
          <p className="info-message">Subscription details are managed by your team administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="subscription-info">
        <h3>
          Current Plan
          <span className="current-plan">{user.subscription_plan_details?.name || 'N/A'}</span>
        </h3>
        <div className="plan-details">
          <p><strong>Maximum Machines:</strong> {user.subscription_plan_details?.max_machines || 0}</p>
          <p><strong>Maximum Team Members:</strong> {user.subscription_plan_details?.max_team_members || 0}</p>
          <div className="features-list">
            <h4>Features Included:</h4>
            <ul>
              {getFeaturesList().map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Team component Tab
const TeamsTab = ({ user }) => {
  if (user.account_type === 'PRO_MEMBER' || user.account_type === 'ENTERPRISE_MEMBER') {
    return (
      <div className="tab-content">
        <div className="teams-info">
          <p className="info-message">Team management is only available for administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="teams-management">
        <h3>Team Management</h3>
        <div className="team-members">
          <h4>Current Team Members ({user.team_members_count || 0})</h4>
          {/* List of members */}
        </div>
        {/* The button is blocked until the feature is ready */}
        {/*<button className="btn btn-primary">Add Team Member</button>*/}
      </div>
    </div>
  );
};

function Account() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');


  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await fetchUserProfile();
      setUser(userData);
      setEditedUser(userData);
    } catch (err) {
      setError('Failed to load user profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await updateUserProfile(editedUser);
      setUser(updatedUser);
      setEditedUser(updatedUser);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    }
  };

  if (isLoading) return <div className="account">Loading...</div>;
  if (error) return <div className="account error-message">{error}</div>;
  if (!user) return <div className="account">No user data available.</div>;

  return (
    <div className="account">
      <h1>Account</h1>
      {successMessage && <p className="success-message">{successMessage}</p>}
      
      <div className="account-tabs1">
        <div className="tabs-header">
          <button 
            className={`tab-button1 ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          {/*<button 
            className={`tab-button ${activeTab === 'subscription' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscription')}
          >
            Subscription
          </button>
          <button 
            className={`tab-button ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            Teams
          </button>*/}
        </div>

        <div className="tab-content-container">
          {activeTab === 'profile' && (
            <ProfileTab 
              user={user}
              isEditing={isEditing}
              editedUser={editedUser}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              setIsEditing={setIsEditing}
            />
          )}
          {activeTab === 'subscription' && <SubscriptionTab user={user} />}
          {activeTab === 'teams' && <TeamsTab user={user} />}
        </div>
      </div>
    </div>
  );
}

export default Account;
