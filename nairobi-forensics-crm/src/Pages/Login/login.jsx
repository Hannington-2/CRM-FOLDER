// src/Pages/Login/login.jsx
import { useState } from 'react';
import './login.css';
import { FaFacebookF, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { CiLinkedin } from "react-icons/ci";
import { VscTwitter } from "react-icons/vsc";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { publicFetch } from '../../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Lazy initializer — reads logout reason once (no useEffect, no warnings)
  const [error, setError] = useState(() => {
    const reason = sessionStorage.getItem('logout_reason');
    if (reason) {
      sessionStorage.removeItem('logout_reason');
      return reason;
    }
    return '';
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await publicFetch('/auth/login', {
        method: 'POST',
        body: { email, password, remember }
      });

      // Server sets HTTP-only auth cookie + CSRF cookie.
      // We only store user object for UI.
      login(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <h1>Welcome<br/>Back</h1>
          <p>
            Sign in to access the Nairobi Forensics CRM Dashboard.
            Manage clients, cases, and forensic reports securely.
          </p>
          <div className="social-icons">
            <a href="#facebook" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#twitter" aria-label="Twitter"><VscTwitter /></a>
            <a href="#LinkedIn" aria-label="LinkedIn"><CiLinkedin /></a>
          </div>
        </div>
      </div>

      <div className="login-right">
        <Link to="/" className="back-home"><FaArrowLeft /> Back to Home</Link>

        <div className="login-form-wrapper">
          <h2>Sign in</h2>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@forensicsnbi.com"
                required
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                /> Remember Me for 7 days
              </label>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-login" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in now'}
            </button>
            <p className="register-link">
              Don't have an account? <Link to="/register">Create one</Link>
            </p>
            <a href="#forgot" className="forgot-password">Forgot your password?</a>
          </form>

          <p className="terms-text">
            By clicking on "Sign in now" you agree to <br />
            <a href="#terms">Terms of Service</a> | <a href="#privacy">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;