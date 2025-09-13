import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem('userName', name.trim());
      navigate('/inventory');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="app-title">Homi</h1>
        <p className="app-subtitle">Share What You Already Have</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="name">Enter your name to get started:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="name-input"
            />
          </div>

          <button type="submit" className="login-button">
            Enter Homi
          </button>
        </form>

        <div className="welcome-text">
          <p>Welcome to your shared kitchen inventory!</p>
          <p>See what your roommates have available to share.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;