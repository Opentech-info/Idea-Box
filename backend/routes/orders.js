const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/db');
const { authenticateToken, logActivity } = require('../middleware/auth');

const router = express.Router();

// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-6)}${random}`;
};

// Create new order
router.post('/', authenticateToken, [
    body('items').isArray().withMessage('Items must be an array'),
    body('customer_name').notEmpty().withMessage('Customer name is required'),
    body('customer_email').isEmail().withMessage('Valid email is required'),
    body('customer_phone').optional().isMobilePhone(),
    body('customer_address').optional().isLength({ min: 10 }),
    body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { items, customer_name, customer_email, customer_phone, customer_address, notes } = req.body;
        const userId = req.user.id;

        // Calculate total amount
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += item.price * item.quantity;
        }

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Create order
        const orderResult = await executeQuery(
            `INSERT INTO orders (
                user_id, order_number, total_amount, customer_name, 
                customer_email, customer_phone, customer_address, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, orderNumber, totalAmount, customer_name, customer_email, customer_phone, customer_address, notes]
        );

        const orderId = orderResult.insertId;

        // Create order items
        for (const item of items) {
            await executeQuery(
                `INSERT INTO order_items (
                    order_id, project_id, project_name, price, quantity
                ) VALUES (?, ?, ?, ?, ?)`,
                [orderId, item.project_id, item.project_name, item.price, item.quantity]
            );
        }

        // Log activity
        await logActivity(userId, 'CREATE_ORDER', `Created order ${orderNumber} with total $${totalAmount}`);

        res.status(201).json({
            message: 'Order created successfully',
            order: {
                id: orderId,
                order_number: orderNumber,
                total_amount: totalAmount,
                status: 'pending',
                payment_status: 'pending'
            }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user orders
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const orders = await executeQuery(`
            SELECT o.*, 
                   JSON_ARRAYAGG(
                       JSON_OBJECT(
                           'id', oi.id,
                           'project_id', oi.project_id,
                           'project_name', oi.project_name,
                           'price', oi.price,
                           'quantity', oi.quantity
                       )
                   ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `, [userId]);

        // Parse JSON items
        orders.forEach(order => {
            try {
                order.items = JSON.parse(order.items);
            } catch (e) {
                order.items = [];
            }
        });

        res.json(orders);
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;

        const orders = await executeQuery(`
            SELECT o.*, 
                   JSON_ARRAYAGG(
                       JSON_OBJECT(
                           'id', oi.id,
                           'project_id', oi.project_id,
                           'project_name', oi.project_name,
                           'price', oi.price,
                           'quantity', oi.quantity
                       )
                   ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = ? AND o.user_id = ?
            GROUP BY o.id
        `, [orderId, userId]);

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orders[0];
        try {
            order.items = JSON.parse(order.items);
        } catch (e) {
            order.items = [];
        }

        // Get payment information
        const payments = await executeQuery(
            'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC',
            [orderId]
        );

        order.payments = payments;

        res.json(order);
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Process payment (simulated)
router.post('/:id/pay', authenticateToken, [
    body('payment_method').isIn(['credit_card', 'paypal', 'bank_transfer', 'mobile_money']),
    body('amount').isFloat({ gt: 0 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const orderId = req.params.id;
        const userId = req.user.id;
        const { payment_method, amount } = req.body;

        // Verify order exists and belongs to user
        const orders = await executeQuery(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orders[0];

        // Verify amount matches order total
        if (parseFloat(amount) !== parseFloat(order.total_amount)) {
            return res.status(400).json({ message: 'Payment amount does not match order total' });
        }

        // Simulate payment processing
        const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const paymentSuccess = Math.random() > 0.1; // 90% success rate

        // Create payment record
        const paymentData = {
            transaction_id: transactionId,
            gateway_response: paymentSuccess ? 'Payment successful' : 'Payment failed',
            card_last4: payment_method === 'credit_card' ? '****' + Math.floor(Math.random() * 10000).toString().padStart(4, '0') : null
        };

        await executeQuery(
            `INSERT INTO payments (
                order_id, payment_method, amount, transaction_id, 
                status, payment_data
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                orderId, 
                payment_method, 
                amount, 
                transactionId,
                paymentSuccess ? 'completed' : 'failed',
                JSON.stringify(paymentData)
            ]
        );

        // Update order status
        const newStatus = paymentSuccess ? 'completed' : 'cancelled';
        const newPaymentStatus = paymentSuccess ? 'paid' : 'failed';

        await executeQuery(
            'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
            [newStatus, newPaymentStatus, orderId]
        );

        // Log activity
        await logActivity(userId, 'PROCESS_PAYMENT', `Processed payment for order ${order.order_number} - ${paymentSuccess ? 'Success' : 'Failed'}`);

        if (paymentSuccess) {
            res.json({
                message: 'Payment processed successfully',
                payment: {
                    transaction_id: transactionId,
                    status: 'completed',
                    amount: amount
                }
            });
        } else {
            res.status(400).json({
                message: 'Payment processing failed',
                payment: {
                    transaction_id: transactionId,
                    status: 'failed',
                    amount: amount
                }
            });
        }

    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel order
router.put('/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;

        // Verify order exists and belongs to user
        const orders = await executeQuery(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orders[0];

        // Check if order can be cancelled
        if (order.status === 'completed' || order.status === 'cancelled') {
            return res.status(400).json({ message: 'Order cannot be cancelled' });
        }

        // Update order status
        await executeQuery(
            'UPDATE orders SET status = ? WHERE id = ?',
            ['cancelled', orderId]
        );

        // Log activity
        await logActivity(userId, 'CANCEL_ORDER', `Cancelled order ${order.order_number}`);

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Download purchased project
router.get('/:orderId/download/:projectId', authenticateToken, async (req, res) => {
    try {
        const { orderId, projectId } = req.params;
        const userId = req.user.id;

        // Verify order exists and belongs to user
        const orders = await executeQuery(
            'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ?',
            [orderId, userId, 'completed']
        );

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found or not completed' });
        }

        // Verify project is in the order
        const orderItems = await executeQuery(
            'SELECT * FROM order_items WHERE order_id = ? AND project_id = ?',
            [orderId, projectId]
        );

        if (orderItems.length === 0) {
            return res.status(404).json({ message: 'Project not found in order' });
        }

        // Get project download link
        const projects = await executeQuery(
            'SELECT download_link, name FROM projects WHERE id = ?',
            [projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const project = projects[0];

        if (!project.download_link) {
            return res.status(404).json({ message: 'Download link not available' });
        }

        // Log activity
        await logActivity(userId, 'DOWNLOAD_PROJECT', `Downloaded project ${project.name} from order ${orderId}`);

        // In a real application, you would stream the file
        // For now, return the download link
        res.json({
            message: 'Download link generated',
            download_url: project.download_link,
            project_name: project.name
        });

    } catch (error) {
        console.error('Download project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
