import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import logo from '@/assets/images/repairmate_logo.png';
import './Auth.css';

// Component for user registration
function Register() {
  // State to handle form input values and errors
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState(''); // General error message
  const [fieldErrors, setFieldErrors] = useState({}); // Field-specific error messages
  const navigate = useNavigate(); // Hook to programmatically navigate to other routes

  // Handles input field changes and clears field-specific errors as the user types
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    setFieldErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  // Handles form submission and registration logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any existing general errors
    setFieldErrors({}); // Clear any existing field-specific errors

    // Basic validation checks for password and confirm password fields
    if (formData.password !== formData.confirm_password) {
      setFieldErrors({ confirm_password: "Passwords don't match" });
      return;
    }

    if (formData.password.length < 8) {
      setFieldErrors({ password: "Password must be at least 8 characters long" });
      return;
    }

    try {
      // Attempt to register the user by calling the API
      const response = await api.post('/api/register/', formData);
      console.log('Registration successful', response.data);
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error.response);
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          // Handle field-specific errors
          setFieldErrors(error.response.data);
        } else {
          // Handle general error message
          setError(error.response.data.message || 'Registration failed. Please try again.');
        }
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="logo-container">
          <img src={logo} alt="RepairMate Logo" className="auth-logo" />
        </div>
        <h2>Create Account</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group-login">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            {fieldErrors.username && <p className="field-error">{fieldErrors.username}</p>}
          </div>

          <div className="form-group-login">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>

          <div className="form-group-login">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
          </div>

          <div className="form-group-login">
            <label htmlFor="confirm_password">Confirm Password:</label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
            />
            {fieldErrors.confirm_password && <p className="field-error">{fieldErrors.confirm_password}</p>}
          </div>

          <button type="submit" className="auth-button">Register</button>
        </form>
        <p>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
