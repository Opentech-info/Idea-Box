const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/db');

const router = express.Router();

// Submit contact form
router.post('/', [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5 and 200 characters'),
    body('message').trim().isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10 and 5000 characters'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array(),
                message: 'Validation failed'
            });
        }

        const { name, email, phone, subject, message, priority = 'medium' } = req.body;

        // Get client IP and user agent
        const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
        const user_agent = req.headers['user-agent'];

        // Insert contact message
        const result = await executeQuery(
            `INSERT INTO contact_messages (
                name, email, phone, subject, message, priority, 
                ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, phone, subject, message, priority, ip_address, user_agent]
        );

        const messageId = result.insertId;

        // Send auto-reply email (in a real application, you would implement this)
        console.log(`Auto-reply email would be sent to ${email}`);

        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully! We\'ll get back to you soon.',
            message_id: messageId
        });

    } catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
});

// Get all contact messages (admin only)
router.get('/', async (req, res) => {
    try {
        // In a real application, you would add authentication middleware here
        const messages = await executeQuery(`
            SELECT cm.*, 
                   CASE 
                       WHEN cm.priority = 'urgent' THEN 1
                       WHEN cm.priority = 'high' THEN 2
                       WHEN cm.priority = 'medium' THEN 3
                       WHEN cm.priority = 'low' THEN 4
                       ELSE 5
                   END as priority_order
            FROM contact_messages cm
            ORDER BY priority_order ASC, cm.created_at DESC
        `);

        res.json({
            success: true,
            messages: messages
        });

    } catch (error) {
        console.error('Get contact messages error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to retrieve messages'
        });
    }
});

// Get single contact message
router.get('/:id', async (req, res) => {
    try {
        const messageId = req.params.id;

        const messages = await executeQuery(
            'SELECT * FROM contact_messages WHERE id = ?',
            [messageId]
        );

        if (messages.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: messages[0]
        });

    } catch (error) {
        console.error('Get contact message error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to retrieve message'
        });
    }
});

// Update message status
router.put('/:id/status', [
    body('status').isIn(['new', 'read', 'replied', 'archived']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array()
            });
        }

        const messageId = req.params.id;
        const { status } = req.body;

        const result = await executeQuery(
            'UPDATE contact_messages SET status = ? WHERE id = ?',
            [status, messageId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: 'Message status updated successfully'
        });

    } catch (error) {
        console.error('Update message status error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update message status'
        });
    }
});

// Update message priority
router.put('/:id/priority', [
    body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array()
            });
        }

        const messageId = req.params.id;
        const { priority } = req.body;

        const result = await executeQuery(
            'UPDATE contact_messages SET priority = ? WHERE id = ?',
            [priority, messageId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: 'Message priority updated successfully'
        });

    } catch (error) {
        console.error('Update message priority error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update message priority'
        });
    }
});

// Delete contact message
router.delete('/:id', async (req, res) => {
    try {
        const messageId = req.params.id;

        const result = await executeQuery(
            'DELETE FROM contact_messages WHERE id = ?',
            [messageId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });

    } catch (error) {
        console.error('Delete contact message error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete message'
        });
    }
});

// Get contact statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const [totalMessages] = await executeQuery('SELECT COUNT(*) as count FROM contact_messages');
        
        const [newMessages] = await executeQuery('SELECT COUNT(*) as count FROM contact_messages WHERE status = "new"');
        
        const [readMessages] = await executeQuery('SELECT COUNT(*) as count FROM contact_messages WHERE status = "read"');
        
        const [repliedMessages] = await executeQuery('SELECT COUNT(*) as count FROM contact_messages WHERE status = "replied"');
        
        const [urgentMessages] = await executeQuery('SELECT COUNT(*) as count FROM contact_messages WHERE priority = "urgent"');
        
        const [highPriorityMessages] = await executeQuery('SELECT COUNT(*) as count FROM contact_messages WHERE priority = "high"');
        
        const [recentMessages] = await executeQuery(`
            SELECT COUNT(*) as count 
            FROM contact_messages 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);

        res.json({
            success: true,
            stats: {
                total: totalMessages.count,
                new: newMessages.count,
                read: readMessages.count,
                replied: repliedMessages.count,
                urgent: urgentMessages.count,
                high_priority: highPriorityMessages.count,
                recent_week: recentMessages.count
            }
        });

    } catch (error) {
        console.error('Get contact statistics error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to retrieve statistics'
        });
    }
});

// Search contact messages
router.get('/search', async (req, res) => {
    try {
        const { q, status, priority, date_from, date_to } = req.query;

        let query = 'SELECT * FROM contact_messages WHERE 1=1';
        const params = [];

        if (q) {
            query += ' AND (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (priority) {
            query += ' AND priority = ?';
            params.push(priority);
        }

        if (date_from) {
            query += ' AND created_at >= ?';
            params.push(date_from);
        }

        if (date_to) {
            query += ' AND created_at <= ?';
            params.push(date_to);
        }

        query += ' ORDER BY created_at DESC';

        const messages = await executeQuery(query, params);

        res.json({
            success: true,
            messages: messages
        });

    } catch (error) {
        console.error('Search contact messages error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to search messages'
        });
    }
});

module.exports = router;
