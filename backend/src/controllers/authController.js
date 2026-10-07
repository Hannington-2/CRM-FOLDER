const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validatePassword } = require('../utils/passwordValidator');
const { logSecurity } = require('../utils/securityLogger');

// ===== CONSTANTS =====
const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;

const AUTH_COOKIE_NAME = 'nf_token';
const CSRF_COOKIE_NAME = 'nf_csrf';

// ===== COOKIE HELPERS =====
const getCookieOptions = (remember = false) => {
    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = remember
        ? 7 * 24 * 60 * 60 * 1000   // 7 days
        : 60 * 60 * 1000;            // 1 hour

    return {
        httpOnly: true,               // ← JS CANNOT read this cookie
        secure: isProd,                // HTTPS only in production
        sameSite: isProd ? 'strict' : 'lax',
        maxAge,
        path: '/'
    };
};

const getCsrfCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: false,               // JS MUST read this to send in header
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,  // 24 hours
        path: '/'
    };
};

// ============================================
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// ============================================
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            return res.status(400).json({
                message: 'Password is too weak',
                errors: passwordCheck.errors
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            await logSecurity({
                event: 'suspicious_activity',
                email, ip, userAgent,
                details: { reason: 'Registration attempt with existing email' },
                severity: 'warning'
            });
            return res.status(400).json({
                message: 'Registration failed. Please try a different email or login.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: role === 'admin' ? 'admin' : 'staff'
        });

        await logSecurity({
            event: 'register',
            user: user._id,
            email: user.email,
            ip, userAgent,
            details: { role: user.role }
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Registration failed' });
    }
};

// ============================================
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ============================================
exports.login = async (req, res) => {
    const { email, password, remember } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const GENERIC_ERROR = 'Invalid email or password';

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!user) {
            await logSecurity({
                event: 'login_failed',
                email, ip, userAgent,
                details: { reason: 'User not found' },
                severity: 'warning'
            });
            return res.status(401).json({ message: GENERIC_ERROR });
        }

        if (user.isActive === false) {
            await logSecurity({
                event: 'login_failed',
                user: user._id, email, ip, userAgent,
                details: { reason: 'Account deactivated' },
                severity: 'warning'
            });
            return res.status(403).json({ message: 'Account is deactivated. Contact support.' });
        }

        if (user.isLocked()) {
            const minutesLeft = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
            await logSecurity({
                event: 'login_locked',
                user: user._id, email, ip, userAgent,
                details: { minutesLeft },
                severity: 'critical'
            });
            return res.status(423).json({
                message: `Account is locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            const newAttempts = (user.failedLoginAttempts || 0) + 1;
            const update = { failedLoginAttempts: newAttempts };

            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
                update.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
                update.failedLoginAttempts = 0;
                await logSecurity({
                    event: 'account_locked',
                    user: user._id, email, ip, userAgent,
                    details: { reason: 'Max failed attempts reached' },
                    severity: 'critical'
                });
            } else {
                await logSecurity({
                    event: 'login_failed',
                    user: user._id, email, ip, userAgent,
                    details: { attemptNumber: newAttempts },
                    severity: 'warning'
                });
            }

            await User.findByIdAndUpdate(user._id, update);

            const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
            return res.status(401).json({
                message: remaining > 0
                    ? `${GENERIC_ERROR}. ${remaining} attempts remaining before lockout.`
                    : `Account locked for 30 minutes due to too many failed attempts.`
            });
        }

        // Successful login — reset counters
        await User.findByIdAndUpdate(user._id, {
            failedLoginAttempts: 0,
            lockoutUntil: null,
            lastLogin: new Date(),
            lastLoginIP: ip
        });

        // Generate JWT
        const expiresIn = remember
            ? (process.env.JWT_EXPIRE_REMEMBER || '7d')
            : (process.env.JWT_EXPIRE || '1h');

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        // ✅ SET HTTP-ONLY COOKIE (instead of returning token in JSON)
        res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions(remember));

        // ✅ SET CSRF TOKEN (readable by JS)
        const csrfToken = crypto.randomBytes(32).toString('hex');
        res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());

        await logSecurity({
            event: 'login_success',
            user: user._id,
            email: user.email,
            ip, userAgent,
            details: { role: user.role, remember: !!remember }
        });

        // ✅ RESPONSE — NO TOKEN in body
        res.status(200).json({
            message: 'Login successful',
            expiresIn,
            remember: !!remember,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Login failed' });
    }
};

// ============================================
// @desc    Get current user (from cookie)
// @route   GET /api/auth/me
// @access  Private
// ============================================
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -failedLoginAttempts -lockoutUntil');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// @desc    Refresh CSRF token
// @route   GET /api/auth/csrf
// @access  Public
// ============================================
exports.refreshCsrf = (req, res) => {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());
    res.json({ csrfToken });
};

// ============================================
// @desc    Logout (clear cookies)
// @route   POST /api/auth/logout
// @access  Private
// ============================================
exports.logout = async (req, res) => {
    try {
        // Clear both cookies
        res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
        res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });

        if (req.user?.id) {
            await logSecurity({
                event: 'logout',
                user: req.user.id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};