import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';

const AuthPage = () => {
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (isRegister && (!formData.name || formData.name.trim().length < 2)) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError('');

    try {
      if (isRegister) {
        await register(formData.name.trim(), formData.email.trim(), formData.password);
      } else {
        await login(formData.email.trim(), formData.password);
      }
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong. Please try again.';
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
            <span className="text-2xl font-bold">
              <span className="text-primary">Cognitive</span> Campus
            </span>
          </div>
          <p className="text-muted text-sm">
            {isRegister ? 'Create your account to start learning' : 'Welcome back — continue your journey'}
          </p>
        </div>

        {/* Form card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gray-100"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {apiError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5">
                <p className="text-red-400 text-sm">{apiError}</p>
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isRegister ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isRegister ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            {isRegister ? (
              <>Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></>
            ) : (
              <>Don&apos;t have an account? <Link to="/register" className="text-primary hover:underline">Create one</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
