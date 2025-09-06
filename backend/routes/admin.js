const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/db');
const { authenticateToken, requireAdmin, logActivity } = require('../middleware/auth');

const router = express.Router();

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await executeQuery(`
            SELECT id, username, email, role, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single user
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await executeQuery(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user (Admin only)
router.put('/users/:id', authenticateToken, requireAdmin, [
    body('username').optional().trim().isLength({ min: 3 }),
    body('email').optional().isEmail(),
    body('role').optional().isIn(['user', 'admin'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, role } = req.body;
        const userId = req.params.id;

        // Check if user exists
        const users = await executeQuery('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if username or email already exists (excluding current user)
        if (username || email) {
            const existingUsers = await executeQuery(
                'SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?',
                [username || '', email || '', userId]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({ message: 'Username or email already exists' });
            }
        }

        await executeQuery(
            'UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email), role = COALESCE(?, role) WHERE id = ?',
            [username, email, role, userId]
        );

        // Log activity
        await logActivity(req.user.id, 'UPDATE_USER', `Updated user: ${users[0].username}`);

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user (Admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const users = await executeQuery('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent self-deletion
        if (userId == req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await executeQuery('DELETE FROM users WHERE id = ?', [userId]);

        // Log activity
        await logActivity(req.user.id, 'DELETE_USER', `Deleted user: ${users[0].username}`);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all ads
router.get('/ads', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const ads = await executeQuery(`
            SELECT * FROM ads 
            ORDER BY created_at DESC
        `);

        res.json(ads);
    } catch (error) {
        console.error('Get ads error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new ad
router.post('/ads', authenticateToken, requireAdmin, [
    body('title').notEmpty().withMessage('Ad title is required'),
    body('video_url').notEmpty().withMessage('Video URL is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, video_url, status } = req.body;

        const result = await executeQuery(
            'INSERT INTO ads (title, video_url, status) VALUES (?, ?, ?)',
            [title, video_url, status || 'active']
        );

        const adId = result.insertId;

        // Log activity
        await logActivity(req.user.id, 'CREATE_AD', `Created new ad: ${title}`);

        res.status(201).json({
            message: 'Ad created successfully',
            adId
        });
    } catch (error) {
        console.error('Create ad error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update ad
router.put('/ads/:id', authenticateToken, requireAdmin, [
    body('title').optional().notEmpty(),
    body('video_url').optional().notEmpty(),
    body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, video_url, status } = req.body;
        const adId = req.params.id;

        // Check if ad exists
        const ads = await executeQuery('SELECT * FROM ads WHERE id = ?', [adId]);
        if (ads.length === 0) {
            return res.status(404).json({ message: 'Ad not found' });
        }

        await executeQuery(
            'UPDATE ads SET title = COALESCE(?, title), video_url = COALESCE(?, video_url), status = COALESCE(?, status) WHERE id = ?',
            [title, video_url, status, adId]
        );

        // Log activity
        await logActivity(req.user.id, 'UPDATE_AD', `Updated ad: ${ads[0].title}`);

        res.json({ message: 'Ad updated successfully' });
    } catch (error) {
        console.error('Update ad error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete ad
router.delete('/ads/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const adId = req.params.id;

        // Check if ad exists
        const ads = await executeQuery('SELECT * FROM ads WHERE id = ?', [adId]);
        if (ads.length === 0) {
            return res.status(404).json({ message: 'Ad not found' });
        }

        await executeQuery('DELETE FROM ads WHERE id = ?', [adId]);

        // Log activity
        await logActivity(req.user.id, 'DELETE_AD', `Deleted ad: ${ads[0].title}`);

        res.json({ message: 'Ad deleted successfully' });
    } catch (error) {
        console.error('Delete ad error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get activity logs
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const logs = await executeQuery(`
            SELECT al.*, u.username 
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 100
        `);

        res.json(logs);
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get dashboard statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [userCount] = await executeQuery('SELECT COUNT(*) as count FROM users');
        const [projectCount] = await executeQuery('SELECT COUNT(*) as count FROM projects');
        const [cartCount] = await executeQuery('SELECT COUNT(*) as count FROM cart');
        const [activeAdsCount] = await executeQuery('SELECT COUNT(*) as count FROM ads WHERE status = "active"');

        const recentUsers = await executeQuery(`
            SELECT username, created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        const recentProjects = await executeQuery(`
            SELECT name, created_at 
            FROM projects 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        res.json({
            users: userCount.count,
            projects: projectCount.count,
            cartItems: cartCount.count,
            activeAds: activeAdsCount.count,
            recentUsers,
            recentProjects
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
