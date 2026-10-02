require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const receiptRoutes = require('./src/routes/receiptRoutes');
const pushRoutes = require('./src/routes/pushRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

const app = express();

// 1. Connect to Database
connectDB();

// 2. Middleware
app.use(cors());
app.use(express.json());

// 3. Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/notifications', notificationRoutes);

// 4. Basic Test Route
app.get('/', (req, res) => {
    res.send('Nairobi Forensics Backend API is running...');
});

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});