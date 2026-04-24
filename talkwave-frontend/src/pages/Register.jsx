import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { setCredentials } from '../store/authSlice.js';
import Spinner from '../components/common/Spinner.jsx';
import { validateEmail, validatePassword, getPasswordStrength } from '../utils/validators.js';

export const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (formData.username.length < 3 || formData.username.length > 20) {
      newErrors.username = 'Username must be 3-20 characters';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        passwordHash: formData.password,
        displayName: formData.displayName || formData.username
      });
      const { user, accessToken, refreshToken } = response.data.data;
      dispatch(setCredentials({ user, token: accessToken, refreshToken }));
      toast.success('Account created successfully!');
      navigate('/chat');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      toast.error(message);
      if (err.response?.data?.param) {
        setErrors({ [err.response.data.param]: message });
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = {
    'Weak': 'bg-red-500',
    'Fair': 'bg-orange-500',
    'Good': 'bg-yellow-500',
    'Strong': 'bg-lime-500',
    'Very Strong': 'bg-green-500'
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand to-cyan-400 bg-clip-text text-transparent">
              TalkWave
            </h1>
            <p className="text-muted text-sm mt-2">Create a new account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg focus:outline-none focus:border-brand transition"
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg focus:outline-none focus:border-brand transition"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Display Name (optional)</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg focus:outline-none focus:border-brand transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg focus:outline-none focus:border-brand transition"
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strengthColors[passwordStrength] || 'bg-gray-600'}`}
                        style={{ width: `${(Object.keys(strengthColors).indexOf(passwordStrength) + 1) * 20}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted">{passwordStrength}</span>
                  </div>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg focus:outline-none focus:border-brand transition"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-brand text-white rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Spinner size="sm" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            Already have an account?{' '}
            <a href="/login" className="text-brand hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
