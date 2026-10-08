require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const connectDB = require('./src/config/db');
const { sanitizeInput } = require('./src/middleware/security');
const { apiLimiter } = require('./src/middleware/rateLimiter');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const receiptRoutes = require('./src/routes/receiptRoutes');
const communicationRoutes = require('./src/routes/communicationRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const pushRoutes = require('./src/routes/pushRoutes');
const creditNoteRoutes = require('./src/routes/creditNoteRoutes');

const app = express();
const server = http.createServer(app);

// ===== ALLOWED ORIGINS =====
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:5174',
    'http://127.0.0.1:4173',
    'http://192.168.1.118:5173',
    'http://192.168.1.118:4173'
];

// ===== SOCKET.IO =====
const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

const connectedUsers = new Map();

// Socket.IO authentication via cookie
const jwt = require('jsonwebtoken');
io.use((socket, next) => {
    try {
        // Parse cookies from the socket handshake
        const cookieHeader = socket.handshake.headers.cookie || '';
        const cookies = Object.fromEntries(
            cookieHeader.split('; ').map(c => {
                const [key, ...v] = c.split('=');
                return [key, v.join('=')];
            })
        );
        const token = cookies['nf_token'];

        if (!token) {
            return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        next();
    } catch (err) {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id, '— User:', socket.userId);

    // Auto-register from authenticated socket
    if (socket.userId) {
        connectedUsers.set(String(socket.userId), socket.id);
        console.log(`👤 User ${socket.userId} auto-registered with socket ${socket.id}`);
    }

    // Legacy register event (kept for compatibility)
    socket.on('register', (userId) => {
        connectedUsers.set(String(userId), socket.id);
        console.log(`👤 User ${userId} registered with socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                console.log(`👋 User ${userId} disconnected`);
                break;
            }
        }
    });
});

global.sendNotificationToUser = (userId, notification) => {
    const socketId = connectedUsers.get(String(userId));
    if (socketId) {
        io.to(socketId).emit('notification', notification);
        return true;
    }
    return false;
};

global.broadcastNotification = (notification) => {
    io.emit('notification', notification);
};

// ===== DATABASE =====
connectDB();

// ===== SECURITY HEADERS =====
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://cdn.jsdelivr.net",
                "https://unpkg.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "data:"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https:"
            ],
            connectSrc: [
                "'self'",
                ...ALLOWED_ORIGINS,
                "http://localhost:5000",
                "ws://localhost:5000",
                "http://192.168.1.118:5000",
                "ws://192.168.1.118:5000"
            ],
            mediaSrc: ["'self'", "blob:", "data:"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' }
}));

// Additional custom headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    next();
});

// ===== CORS =====
app.use(cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token']
}));

// ===== BODY PARSERS =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== COOKIE PARSER =====
app.use(cookieParser());

// ===== SECURITY MIDDLEWARE =====
app.use(hpp());
app.use(sanitizeInput);
app.set('trust proxy', 1);

// ===== GLOBAL RATE LIMITING =====
app.use('/api', apiLimiter);

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/credit-notes', creditNoteRoutes);

// ===== HEALTH CHECK =====
app.get('/', (req, res) => {
    res.send('Nairobi Forensics Backend API is running...');
});

// ===== 404 =====
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
    console.error('💥 Error:', err.message);

    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation error', errors: err.message });
    }
    if (err.code === 11000) {
        return res.status(400).json({ message: 'Duplicate entry' });
    }
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
    }

    res.status(err.statusCode || 500).json({
        message: process.env.NODE_ENV === 'production'
            ? 'Something went wrong'
            : err.message
    });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔒 Security: Headers ✅ | Rate limiting ✅ | CSP ✅ | Cookie auth ✅`);
    console.log(`🌐 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});