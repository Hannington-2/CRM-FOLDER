const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Placeholder — returns empty history until providers are wired up
router.get('/history', async (req, res) => {
    try {
        res.json([]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Placeholder — send email
router.post('/send', async (req, res) => {
    res.status(503).json({
        message: 'Communications pending provider verification. Please try again later.'
    });
});

module.exports = router;