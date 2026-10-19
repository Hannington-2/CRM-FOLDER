// backend/src/controllers/authController.js
const User = require('../models/User');
const Organization = require('../models/Organization');
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
const isProductionEnvironment = () =>
    process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

// ===== COOKIE HELPERS =====
const getCookieOptions = (remember = false) => {
    const isProd = isProductionEnvironment();
    const maxAge = remember
        ? 7 * 24 * 60 * 60 * 1000
        : 60 * 60 * 1000;

    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge,
        path: '/'
    };
};

const getCsrfCookieOptions = () => {
    const isProd = isProductionEnvironment();
    return {
        httpOnly: false,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
    };
};

// ============================================
// @desc    Register is DISABLED — only 2 users exist
// @route   POST /api/auth/register
// @access  Public
// ============================================
exports.register = async (req, res) => {
    const name = String(req.body.name || '').trim();
    const organizationName = String(req.body.organizationName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password;

    if (!name || !organizationName || !email || !password) {
        return res.status(400).json({
            message: 'Name, organization name, email and password are required'
        });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
        return res.status(400).json({
            message: 'Password does not meet the security requirements',
            errors: passwordCheck.errors
        });
    }

    try {
        const existingUser = await User.findOne({ email })
            .setOptions({ organizationScopeBypass: true });
        if (existingUser) {
            return res.status(409).json({
                message: 'An account with this email already exists. Please sign in instead.'
            });
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const slugBase = organizationName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 40) || 'workspace';
        let organization;

        try {
            organization = await Organization.create({
                name: organizationName,
                slug: `${slugBase}-${crypto.randomBytes(5).toString('hex')}`,
                type: 'company'
            });

            const user = await User.create({
                name,
                email,
                password: passwordHash,
                role: 'admin',
                organization: organization._id
            });

            await logSecurity({
                event: 'register',
                user: user._id,
                email: user.email,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                details: { organization: organization._id, role: user.role }
            });

            return res.status(201).json({
                message: 'Account created successfully. Please sign in.',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    organization: {
                        id: organization._id,
                        name: organization.name,
                        slug: organization.slug
                    }
                }
            });
        } catch (error) {
            if (organization) {
                await Organization.deleteOne({ _id: organization._id }).catch(() => {});
            }
            if (error.code === 11000) {
                return res.status(409).json({
                    message: 'An account with this email already exists. Please sign in instead.'
                });
            }
            throw error;
        }
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Registration failed. Please try again.' });
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

        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .setOptions({ organizationScopeBypass: true })
            .select('+password')
            .populate('organization', 'name slug type');

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
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        if (!user.organization) {
            console.error('⚠️ User has no organization:', user.email);
            return res.status(403).json({
                message: 'Your account is not assigned to an organization. Contact admin.'
            });
        }

        if (user.isLocked()) {
            const minutesLeft = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
            return res.status(423).json({
                message: `Account is locked. Try again in ${minutesLeft} minutes.`
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            const newAttempts = (user.failedLoginAttempts || 0) + 1;
            const update = { failedLoginAttempts: newAttempts };

            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
                update.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
                update.failedLoginAttempts = 0;
            }

            await User.findByIdAndUpdate(user._id, update)
                .setOptions({ organizationScopeBypass: true });

            const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
            return res.status(401).json({
                message: remaining > 0
                    ? `${GENERIC_ERROR}. ${remaining} attempts remaining.`
                    : `Account locked for 30 minutes.`
            });
        }

        // Successful login
        await User.findByIdAndUpdate(user._id, {
            failedLoginAttempts: 0,
            lockoutUntil: null,
            lastLogin: new Date(),
            lastLoginIP: ip
        }).setOptions({ organizationScopeBypass: true });

        const expiresIn = remember
            ? (process.env.JWT_EXPIRE_REMEMBER || '7d')
            : (process.env.JWT_EXPIRE || '1h');

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                organization: user.organization._id
            },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions(remember));

        const csrfToken = crypto.randomBytes(32).toString('hex');
        res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());

        await logSecurity({
            event: 'login_success',
            user: user._id,
            email: user.email,
            ip, userAgent,
            details: {
                role: user.role,
                org: user.organization.slug,
                remember: !!remember
            }
        });

        res.status(200).json({
            message: 'Login successful',
            expiresIn,
            remember: !!remember,
            csrfToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: {
                    id: user.organization._id,
                    name: user.organization.name,
                    slug: user.organization.slug,
                    type: user.organization.type
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
};

// ============================================
// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
// ============================================
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -failedLoginAttempts -lockoutUntil')
            .populate('organization', 'name slug type');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization ? {
                id: user.organization._id,
                name: user.organization.name,
                slug: user.organization.slug,
                type: user.organization.type
            } : null
        });
    } catch (error) {
        console.error('getMe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// @desc    Refresh CSRF token
// @route   GET /api/auth/csrf
// ============================================
exports.refreshCsrf = (req, res) => {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());
    res.json({ csrfToken });
};

// ============================================
// @desc    Logout
// @route   POST /api/auth/logout
// ============================================
exports.logout = async (req, res) => {
    try {
        const isProd = isProductionEnvironment();
        const clearCookieOptions = {
            path: '/',
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax'
        };
        res.clearCookie(AUTH_COOKIE_NAME, clearCookieOptions);
        res.clearCookie(CSRF_COOKIE_NAME, clearCookieOptions);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// @desc    Promote user to admin (kept for compat)
// @route   POST /api/auth/promote-me
// ============================================
exports.promoteMeToAdmin = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { role: 'admin' },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({
            message: 'You are now an admin',
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};