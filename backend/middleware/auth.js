const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/db');

// JWT Secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-azsubay-dev';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get user from database
        const users = await executeQuery(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Admin role middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Log activity
const logActivity = async (userId, action, description) => {
    try {
        await executeQuery(
            'INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
            [userId, action, description]
        );
    } catch (error) {
        console.error('Activity logging error:', error.message);
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    generateToken,
    logActivity,
    JWT_SECRET
};
