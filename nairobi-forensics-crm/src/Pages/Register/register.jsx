// src/Pages/Register/register.jsx
import { useState } from 'react';
import './register.css';
import { FaFacebookF, FaArrowLeft, FaEye, FaEyeSlash, FaCheck, FaTimes } from "react-icons/fa";
import { CiLinkedin } from "react-icons/ci";
import { VscTwitter } from "react-icons/vsc";
import { useNavigate, Link } from 'react-router-dom';
import { publicFetch } from '../../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear field errors when user starts typing
    if (fieldErrors.length) setFieldErrors([]);
  };

  // ====== Password strength checks (visual feedback) ======
  const checks = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  };
  const strengthScore = Object.values(checks).filter(Boolean).length;

  const strengthLabel =
    strengthScore === 0 ? '' :
    strengthScore === 1 ? 'Weak' :
    strengthScore === 2 ? 'Fair' :
    strengthScore === 3 ? 'Good' : 'Strong';

  const strengthClass =
    strengthScore <= 1 ? 'weak' :
    strengthScore === 2 ? 'fair' :
    strengthScore === 3 ? 'good' : 'strong';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors([]);

    // ====== Client-side validation ======
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!checks.upper || !checks.lower || !checks.number) {
      setError('Password must contain uppercase, lowercase, and a number');
      return;
    }

    setIsLoading(true);

    try {
      // publicFetch handles cookies + auto-detects hostname
      await publicFetch('/auth/register', {
        method: 'POST',
        body: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }
      });

      alert('Account created successfully! Please login.');
      navigate('/login');
    } catch (err) {
      // If backend returned field-level errors (weak password etc.)
      if (err.errors && Array.isArray(err.errors)) {
        setFieldErrors(err.errors);
      }
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* LEFT SIDE */}
      <div className="register-left">
        <div className="register-left-content">
          <h1>Create<br/>Account</h1>
          <p>
            Create your account to access the Nairobi Forensics CRM.
            Manage cases, clients, and reports with world-class forensic tools.
          </p>
          <div className="social-icons">
            <a href="#facebook" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#twitter" aria-label="Twitter"><VscTwitter /></a>
            <a href="#LinkedIn" aria-label="LinkedIn"><CiLinkedin /></a>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="register-right">
        <Link to="/" className="back-home"><FaArrowLeft /> Back to Home</Link>

        <div className="register-form-wrapper">
          <h2>Create Account</h2>

          <form onSubmit={handleSubmit} autoComplete="off">
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
                autoComplete="name"
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
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
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

              {/* ===== Password Strength Meter ===== */}
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div className={`strength-fill ${strengthClass}`} />
                  </div>
                  <div className="strength-label-row">
                    <span className={`strength-label ${strengthClass}`}>
                      {strengthLabel}
                    </span>
                  </div>

                  {/* Requirement checklist */}
                  <ul className="password-checks">
                    <li className={checks.length ? 'ok' : ''}>
                      {checks.length ? <FaCheck /> : <FaTimes />}
                      At least 8 characters
                    </li>
                    <li className={checks.upper ? 'ok' : ''}>
                      {checks.upper ? <FaCheck /> : <FaTimes />}
                      One uppercase letter (A-Z)
                    </li>
                    <li className={checks.lower ? 'ok' : ''}>
                      {checks.lower ? <FaCheck /> : <FaTimes />}
                      One lowercase letter (a-z)
                    </li>
                    <li className={checks.number ? 'ok' : ''}>
                      {checks.number ? <FaCheck /> : <FaTimes />}
                      One number (0-9)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Match indicator */}
              {formData.confirmPassword && (
                <div className={`password-match ${formData.password === formData.confirmPassword ? 'ok' : 'bad'}`}>
                  {formData.password === formData.confirmPassword
                    ? <><FaCheck /> Passwords match</>
                    : <><FaTimes /> Passwords do not match</>}
                </div>
              )}
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
              </select>
            </div>

            {/* ===== Error Display ===== */}
            {error && (
              <div className="error-message">
                <strong>{error}</strong>
                {fieldErrors.length > 0 && (
                  <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                    {fieldErrors.map((fe, i) => (
                      <li key={i} style={{ fontSize: '0.85em' }}>{fe}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn-register"
              disabled={isLoading || strengthScore < 4 || formData.password !== formData.confirmPassword}
            >
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