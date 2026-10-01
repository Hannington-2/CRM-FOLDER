import { useState } from 'react';
import './login.css';
import { FaFacebookF, FaArrowLeft } from "react-icons/fa";
import { CiLinkedin } from "react-icons/ci";
import { VscTwitter } from "react-icons/vsc";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save to localStorage for persistence
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Update global auth context
        login(data.user, data.token);

        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      
      {/* LEFT SIDE: Welcome Text */}
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

      {/* RIGHT SIDE: Login Form */}
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
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required 
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" /> Remember Me
              </label>
            </div>

            {/* Error Message Display */}
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