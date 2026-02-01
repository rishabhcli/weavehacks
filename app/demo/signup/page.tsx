'use client';

import { useState } from 'react';

interface UserData {
  name: string;
  email: string;
  preferences?: {
    newsletter: boolean;
    notifications: boolean;
  };
}

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      // Simulate API call
      const userData: UserData = {
        name: formData.name,
        email: formData.email,
        // BUG 3: preferences is undefined, but we try to access it below
        preferences: undefined,
      };

      // BUG 3: This will throw "Cannot read properties of undefined (reading 'newsletter')"
      // because userData.preferences is undefined
      const prefs = (userData as { preferences?: { newsletter?: boolean } }).preferences;
      const welcomeMessage = `Welcome ${userData.name}! Newsletter subscription: ${prefs!.newsletter ?? false}`;

      // eslint-disable-next-line no-console
      console.log(welcomeMessage);
      setSuccess(true);
    } catch (err) {
      setError('Signup failed. Please try again.');
      console.error('Signup error:', err);
    }
  };

  if (success) {
    return (
      <div className="card" style={{ maxWidth: '400px' }}>
        <h2>Welcome!</h2>
        <p className="success">Account created successfully!</p>
        <a href="/demo">
          <button>Start Shopping</button>
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px' }}>
      <h2>Create Account</h2>

      <form onSubmit={handleSubmit} className="card">
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px' }}>
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" style={{ width: '100%', marginTop: '15px' }}>
          Create Account
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Already have an account? <a href="/demo">Sign in</a>
      </p>
    </div>
  );
}
