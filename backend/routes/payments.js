// Payment integration controller for Tanzanian mobile money and Stripe
const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/db');
const { authenticateToken, logActivity } = require('../middleware/auth');
const router = express.Router();

// Placeholder: Integrate with real payment SDKs/APIs in production
const supportedGateways = ['mpesa', 'tigopesa', 'airtelmoney', 'halopesa', 'ezypesa', 'stripe'];

// Simulate mobile money/Stripe payment
async function processMobilePayment({ method, amount, phone, orderId, userId }) {
    // TODO: Integrate with real APIs (e.g., Vodacom M-Pesa, Tigo Pesa, etc.)
    // For now, simulate success
    return {
        status: 'completed',
        transaction_id: `${method.toUpperCase()}-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        gateway_response: 'Simulated payment success',
        phone,
        amount
    };
}

// Unified payment endpoint
router.post('/pay', authenticateToken, [
    body('order_id').isInt(),
    body('payment_method').isIn(supportedGateways),
    body('amount').isFloat({ gt: 0 }),
    body('phone').optional().isMobilePhone()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { order_id, payment_method, amount, phone } = req.body;
    const userId = req.user.id;

    // Check order exists and belongs to user
    const orders = await executeQuery('SELECT * FROM orders WHERE id = ? AND user_id = ?', [order_id, userId]);
    if (orders.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
    }
    const order = orders[0];
    if (parseFloat(amount) !== parseFloat(order.total_amount)) {
        return res.status(400).json({ message: 'Payment amount does not match order total' });
    }

    // Simulate payment
    let paymentResult;
    try {
        paymentResult = await processMobilePayment({ method: payment_method, amount, phone, orderId: order_id, userId });
    } catch (err) {
        return res.status(500).json({ message: 'Payment gateway error', error: err.message });
    }

    // Record payment
    await executeQuery(
        `INSERT INTO payments (order_id, payment_method, amount, transaction_id, status, payment_data) VALUES (?, ?, ?, ?, ?, ?)`,
        [order_id, payment_method, amount, paymentResult.transaction_id, paymentResult.status, JSON.stringify(paymentResult)]
    );
    await executeQuery('UPDATE orders SET status = ?, payment_status = ? WHERE id = ?', [paymentResult.status === 'completed' ? 'completed' : 'cancelled', paymentResult.status === 'completed' ? 'paid' : 'failed', order_id]);
    await logActivity(userId, 'PROCESS_PAYMENT', `Processed ${payment_method} payment for order ${order.order_number}`);

    res.json({
        message: paymentResult.status === 'completed' ? 'Payment successful' : 'Payment failed',
        payment: paymentResult
    });
});

module.exports = router;
