const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/db');
const { authenticateToken, logActivity } = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
    try {
        const projects = await executeQuery(`
            SELECT p.*, 
                   CASE WHEN c.user_id IS NOT NULL THEN true ELSE false END as in_cart
            FROM projects p
            LEFT JOIN cart c ON p.id = c.project_id AND c.user_id = ?
            ORDER BY p.created_at DESC
        `, [req.user ? req.user.id : null]);

        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single project
router.get('/:id', async (req, res) => {
    try {
        const projects = await executeQuery('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        
        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(projects[0]);
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add project to cart/wishlist
router.post('/:id/cart', authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.id;

        // Check if project exists
        const projects = await executeQuery('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if already in cart
        const existingCart = await executeQuery(
            'SELECT * FROM cart WHERE user_id = ? AND project_id = ?',
            [userId, projectId]
        );

        if (existingCart.length > 0) {
            return res.status(400).json({ message: 'Project already in cart' });
        }

        // Add to cart
        await executeQuery(
            'INSERT INTO cart (user_id, project_id) VALUES (?, ?)',
            [userId, projectId]
        );

        // Log activity
        await logActivity(userId, 'ADD_TO_CART', `Added project ${projects[0].name} to cart`);

        res.json({ message: 'Project added to cart successfully' });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove project from cart/wishlist
router.delete('/:id/cart', authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.id;

        const result = await executeQuery(
            'DELETE FROM cart WHERE user_id = ? AND project_id = ?',
            [userId, projectId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Project not found in cart' });
        }

        // Log activity
        await logActivity(userId, 'REMOVE_FROM_CART', `Removed project ${projectId} from cart`);

        res.json({ message: 'Project removed from cart successfully' });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's cart/wishlist
router.get('/cart/my', authenticateToken, async (req, res) => {
    try {
        const cartItems = await executeQuery(`
            SELECT p.*, c.created_at as added_at
            FROM cart c
            JOIN projects p ON c.project_id = p.id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        `, [req.user.id]);

        res.json(cartItems);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new project (Admin only)
router.post('/', authenticateToken, require('../middleware/auth').requireAdmin, [
    body('name').notEmpty().withMessage('Project name is required'),
    body('tech_stack').notEmpty().withMessage('Tech stack is required'),
    body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, tech_stack, description, folder_structure, github_link, preview_media } = req.body;

        const result = await executeQuery(
            'INSERT INTO projects (name, tech_stack, description, folder_structure, github_link, preview_media) VALUES (?, ?, ?, ?, ?, ?)',
            [name, tech_stack, description, folder_structure, github_link, preview_media]
        );

        const projectId = result.insertId;

        // Log activity
        await logActivity(req.user.id, 'CREATE_PROJECT', `Created new project: ${name}`);

        res.status(201).json({
            message: 'Project created successfully',
            projectId
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update project (Admin only)
router.put('/:id', authenticateToken, require('../middleware/auth').requireAdmin, [
    body('name').optional().notEmpty(),
    body('tech_stack').optional().notEmpty(),
    body('description').optional().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, tech_stack, description, folder_structure, github_link, preview_media } = req.body;
        const projectId = req.params.id;

        // Check if project exists
        const projects = await executeQuery('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await executeQuery(
            'UPDATE projects SET name = COALESCE(?, name), tech_stack = COALESCE(?, tech_stack), description = COALESCE(?, description), folder_structure = COALESCE(?, folder_structure), github_link = COALESCE(?, github_link), preview_media = COALESCE(?, preview_media) WHERE id = ?',
            [name, tech_stack, description, folder_structure, github_link, preview_media, projectId]
        );

        // Log activity
        await logActivity(req.user.id, 'UPDATE_PROJECT', `Updated project: ${projects[0].name}`);

        res.json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete project (Admin only)
router.delete('/:id', authenticateToken, require('../middleware/auth').requireAdmin, async (req, res) => {
    try {
        const projectId = req.params.id;

        // Check if project exists
        const projects = await executeQuery('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await executeQuery('DELETE FROM projects WHERE id = ?', [projectId]);

        // Log activity
        await logActivity(req.user.id, 'DELETE_PROJECT', `Deleted project: ${projects[0].name}`);

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
