import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { setCredentials } from '../store/authSlice.js';
import Spinner from '../components/common/Spinner.jsx';
import { validateEmail, validatePassword } from '../utils/validators.js';

export const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', formData);
      const { user, accessToken, refreshToken } = response.data.data;
      dispatch(setCredentials({ user, token: accessToken, refreshToken }));
      toast.success('Logged in successfully!');
      navigate('/chat');
    } catch (err) {
      console.error('Login error details:', err.response?.data);
      const message = err.response?.data?.message || 'Login failed - check your email and password';
      toast.error(message);
      if (err.response?.data?.param) {
        setErrors({ [err.response.data.param]: message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand to-cyan-400 bg-clip-text text-transparent">
              TalkWave
            </h1>
            <p className="text-muted text-sm mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-surface2 border border-border rounded-lg focus:outline-none focus:border-brand transition"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-brand text-white rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Spinner size="sm" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-surface text-muted">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2 px-4 border border-border rounded-lg text-sm font-medium hover:bg-surface2 transition"
          >
            Sign in with Google
          </button>

          <p className="text-center text-sm text-muted">
            Don't have an account?{' '}
            <a href="/register" className="text-brand hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
