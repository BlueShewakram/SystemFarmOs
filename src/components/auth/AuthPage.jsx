import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tractor, ArrowRight, User, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullname: ''
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });

    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (loginError) throw loginError;
        navigate('/dashboard');
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullname,
            },
          },
        });
        if (signUpError) throw signUpError;

        // Automatically create a worker entry
        const names = formData.fullname.split(' ');
        const first_name = names[0];
        const last_name = names.slice(1).join(' ') || 'User';

        const { error: workerError } = await supabase
          .from('workers')
          .insert([
            {
              email: formData.email,
              first_name,
              last_name,
              status: 'Active',
            },
          ]);

        if (workerError) {
          console.error('Error creating worker record:', workerError);
          // We don't throw here to avoid discouraging sign-up, but log it
        }

        if (data?.session) {
          navigate('/dashboard');
        } else {
          setError('Signup successful! Please check your email for verification.');
          setLoading(false);
        }
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.email) {
      setError('Enter your email address first so we can send a reset link.');
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (resetError) throw resetError;
      setError('Password reset link sent. Please check your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-bg">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
        <div className="auth-grid-bg"></div>
      </div>

      <div className="auth-card glass fade-up">

        <div className="auth-top">
          <div className="auth-logo-ring">
            <Tractor size={28} />
          </div>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>
            {isLogin
              ? 'Sign in to manage your farm operations'
              : 'Get started with FarmOS today'}
          </p>
        </div>

        {error && (
          <div className={`auth-error-msg ${error.includes('successful') ? 'success' : ''}`}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="fullname">Full Name</label>
              <div className="auth-input-wrap">
                <User size={18} className="auth-input-icon" />
                <input
                  id="fullname"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  required
                  value={formData.fullname}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email Address</label>
            <div className="auth-input-wrap">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="email"
                type="email"
                placeholder="you@farm.com"
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrap">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                value={formData.password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="auth-extras">
              <label className="auth-remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#reset-password" className="auth-forgot" onClick={handlePasswordReset}>Forgot password?</a>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button
            type="button"
            className="auth-switch-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
