import  { useState } from 'react';
import './register.css';
import { FaFacebookF,   FaArrowLeft } from "react-icons/fa";
import { CiLinkedin } from "react-icons/ci";
import { VscTwitter } from "react-icons/vsc";
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // 2. Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // 3. Send registration request to backend
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful — redirect to login page
        alert('Account created successfully! Please login.');
        navigate('/login');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      
      {/* LEFT SIDE: Brand Text */}
      <div className="register-left">
        <div className="register-left-content">
          <h1>Create <br/>Account</h1>
          <p>
            Create your account to access the Nairobi Forensics CRM. 
            Manage cases, clients, and reports with world-class forensic tools.
          </p>
          
          <div className="social-icons">
            <a href="#facebook" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#twitter" aria-label="Twitter"><VscTwitter /></a>
            <a href="#LinkedIn" aria-label="LinkedIn"><CiLinkedin /></a>
            {/* <a href="#youtube" aria-label="YouTube"><FaYoutube /></a> */}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Register Form */}
      <div className="register-right">
        <Link to="/" className="back-home"><FaArrowLeft /> Back to Home</Link>

        <div className="register-form-wrapper">
          <h2>Create Account</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input 
                id="name"
                name="name"
                type="text" 
                value={formData.name}
                onChange={handleChange}
                placeholder="Forensics NBI"
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input 
                id="email"
                name="email"
                type="email" 
                value={formData.email}
                onChange={handleChange}
                placeholder="info@forensicsnbi.com"
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input 
                id="password"
                name="password"
                type="password" 
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input 
                id="confirmPassword"
                name="confirmPassword"
                type="password" 
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="role">Role</label>
              <select 
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                {/* <option value="client">Client</option> */}
              </select>
            </div>

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-register" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="login-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>

          <p className="terms-text">
            By creating an account you agree to <br />
            <a href="#terms">Terms of Service</a> | <a href="#privacy">Privacy Policy</a>
          </p>
        </div>
      </div>

    </div>
  );
}

export default Register;