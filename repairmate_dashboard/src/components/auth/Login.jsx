import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/services/api'; // Absolute
import logo from '@/assets/images/repairmate_logo.png'; // absolute path
import './Auth.css';

// Component for handling user login
function Login({ onLogin }) {
  // State variables for form inputs and error messages
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handles form submission and authentication
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await login(username, password); // Calls the login API
      localStorage.setItem('token', response.data.token); // Stores the token in localStorage
      onLogin(response.data.token); // Calls the onLogin function with the token
      navigate('/'); // Redirects the user to the home page
    } catch (error) {
      console.error('Login error:', error); // Logs error for debugging
      // Sets an error message if login fails
      setError(error.response?.data?.detail || 'Invalid username or password');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="logo-container">
          <img src={logo} alt="RepairMate Logo" className="auth-logo" />
        </div>
        <h2>Welcome</h2>
        {error && (
          <div className="error">
            <span>⚠️ </span> {/* Emoji for visual emphasis */}
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="auth-form-login">
          <div className="form-group-login">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group-login">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button">Login</button>
        </form>
        <p>
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </div>
    </div>
  );
}

export default Login;