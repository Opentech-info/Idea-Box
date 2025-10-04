
const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/db');
const { generateToken, logActivity } = require('../middleware/auth');

const router = express.Router();

// Download 2FA backup codes
router.get('/2fa/backup-codes/download', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const users = await executeQuery('SELECT two_factor_backup_codes FROM users WHERE id = ?', [userId]);
        if (!users[0] || !users[0].two_factor_backup_codes) return res.status(404).json({ message: 'No backup codes found' });
        const codes = JSON.parse(users[0].two_factor_backup_codes);
        res.setHeader('Content-Disposition', 'attachment; filename=backup-codes.txt');
        res.setHeader('Content-Type', 'text/plain');
        res.send(codes.join('\n'));
    } catch (error) {
        console.error('Download backup codes error:', error);
        res.status(500).json({ message: 'Failed to download backup codes' });
    }
});

// SMS 2FA dependencies
const twilio = require('twilio');
const sms2faCodes = new Map(); // In-memory store for demo; use Redis/DB for production

// Twilio config (set in .env)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;
const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

// SMS 2FA: Setup (save phone, send OTP)
router.post('/2fa/sms/setup', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: 'Phone number required' });
        // Save phone to user
        await executeQuery('UPDATE users SET phone_number = ? WHERE id = ?', [phone, userId]);
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        sms2faCodes.set(userId, { otp, expires: Date.now() + 5 * 60 * 1000 });
        // Send SMS
        if (twilioClient && twilioFrom) {
            await twilioClient.messages.create({
                body: `Your AZsubay.dev 2FA code is: ${otp}`,
                from: twilioFrom,
                to: phone
            });
        }
        res.json({ message: 'OTP sent to phone' });
    } catch (error) {
        console.error('SMS 2FA setup error:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
});

// SMS 2FA: Verify OTP and enable
router.post('/2fa/sms/verify', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { otp } = req.body;
        const record = sms2faCodes.get(userId);
        if (!record || Date.now() > record.expires) return res.status(400).json({ message: 'OTP expired' });
        if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        await executeQuery('UPDATE users SET two_factor_enabled = 1, two_factor_secret = NULL WHERE id = ?', [userId]);
        sms2faCodes.delete(userId);
        res.json({ message: 'SMS 2FA enabled' });
    } catch (error) {
        console.error('SMS 2FA verify error:', error);
        res.status(500).json({ message: 'Failed to verify OTP' });
    }
});

// SMS 2FA: Disable
router.post('/2fa/sms/disable', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await executeQuery('UPDATE users SET two_factor_enabled = 0, phone_number = NULL WHERE id = ?', [userId]);
        res.json({ message: 'SMS 2FA disabled' });
    } catch (error) {
        console.error('SMS 2FA disable error:', error);
        res.status(500).json({ message: 'Failed to disable SMS 2FA' });
    }
});
// 2FA dependencies
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
// 2FA: Setup (generate secret, QR, backup codes)
router.post('/2fa/setup', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Generate TOTP secret
        const secret = speakeasy.generateSecret({ name: `AZsubay.dev (${req.user.email})` });
        // Generate QR code
        const qr = await qrcode.toDataURL(secret.otpauth_url);
        // Generate backup codes
        const backupCodes = Array.from({length: 5}, () => Math.random().toString(36).slice(-8).toUpperCase());
        // Store secret and backup codes (as JSON)
        await executeQuery('UPDATE users SET two_factor_secret = ?, two_factor_backup_codes = ? WHERE id = ?', [secret.base32, JSON.stringify(backupCodes), userId]);
        res.json({ secret: secret.base32, qr, backupCodes });
    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ message: 'Failed to setup 2FA' });
    }
});

// 2FA: Enable (verify code and enable 2FA)
router.post('/2fa/enable', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;
        const users = await executeQuery('SELECT two_factor_secret FROM users WHERE id = ?', [userId]);
        if (!users[0] || !users[0].two_factor_secret) return res.status(400).json({ message: '2FA not setup' });
        const verified = speakeasy.totp.verify({
            secret: users[0].two_factor_secret,
            encoding: 'base32',
            token: code,
            window: 1
        });
        if (!verified) return res.status(400).json({ message: 'Invalid 2FA code' });
        await executeQuery('UPDATE users SET two_factor_enabled = 1 WHERE id = ?', [userId]);
        res.json({ message: '2FA enabled successfully' });
    } catch (error) {
        console.error('2FA enable error:', error);
        res.status(500).json({ message: 'Failed to enable 2FA' });
    }
});

// 2FA: Verify during login
router.post('/2fa/verify', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;
        const users = await executeQuery('SELECT two_factor_secret, two_factor_backup_codes FROM users WHERE id = ?', [userId]);
        if (!users[0] || !users[0].two_factor_secret) return res.status(400).json({ message: '2FA not setup' });
        // Check TOTP
        const verified = speakeasy.totp.verify({
            secret: users[0].two_factor_secret,
            encoding: 'base32',
            token: code,
            window: 1
        });
        // Check backup codes
        let backupUsed = false;
        let backupCodes = users[0].two_factor_backup_codes ? JSON.parse(users[0].two_factor_backup_codes) : [];
        if (!verified && backupCodes.includes(code)) {
            backupUsed = true;
            backupCodes = backupCodes.filter(c => c !== code);
            await executeQuery('UPDATE users SET two_factor_backup_codes = ? WHERE id = ?', [JSON.stringify(backupCodes), userId]);
        }
        if (!verified && !backupUsed) return res.status(400).json({ message: 'Invalid 2FA code' });
        res.json({ message: '2FA verified' });
    } catch (error) {
        console.error('2FA verify error:', error);
        res.status(500).json({ message: 'Failed to verify 2FA' });
    }
});

// 2FA: Disable
router.post('/2fa/disable', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;
        const users = await executeQuery('SELECT two_factor_secret FROM users WHERE id = ?', [userId]);
        if (!users[0] || !users[0].two_factor_secret) return res.status(400).json({ message: '2FA not setup' });
        const verified = speakeasy.totp.verify({
            secret: users[0].two_factor_secret,
            encoding: 'base32',
            token: code,
            window: 1
        });
        if (!verified) return res.status(400).json({ message: 'Invalid 2FA code' });
        await executeQuery('UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL, two_factor_backup_codes = NULL WHERE id = ?', [userId]);
        res.json({ message: '2FA disabled' });
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ message: 'Failed to disable 2FA' });
    }
});

// 2FA: Regenerate backup codes
router.post('/2fa/backup-codes', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Generate new backup codes
        const backupCodes = Array.from({length: 5}, () => Math.random().toString(36).slice(-8).toUpperCase());
        await executeQuery('UPDATE users SET two_factor_backup_codes = ? WHERE id = ?', [JSON.stringify(backupCodes), userId]);
        res.json({ backupCodes });
    } catch (error) {
        console.error('2FA backup codes error:', error);
        res.status(500).json({ message: 'Failed to regenerate backup codes' });
    }
});


// User Registration
router.post('/register', [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUsers = await executeQuery(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const result = await executeQuery(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        const userId = result.insertId;

        // Log activity
        await logActivity(userId, 'REGISTER', `New user registered: ${username}`);

        // Generate token
        const token = generateToken({ id: userId, username, role: 'user' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: userId, username, email, role: 'user' }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// User Login
router.post('/login', [
    body('login').notEmpty().withMessage('Username or email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { login, password } = req.body;

        // Find user by username or email
        const users = await executeQuery(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [login, login]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Log activity
        await logActivity(user.id, 'LOGIN', `User logged in: ${user.username}`);

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get user profile
router.get('/profile', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const users = await executeQuery(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for avatar uploads
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/avatars');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
    }
});
const uploadAvatar = multer({ storage: avatarStorage });

// Update user profile (username, email, phone, bio)
router.put('/profile', require('../middleware/auth').authenticateToken, [
    body('username').optional().trim().isLength({ min: 3 }),
    body('email').optional().isEmail(),
    body('phone').optional().isMobilePhone(),
    body('bio').optional().isString().isLength({ max: 500 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, phone, bio } = req.body;
        const userId = req.user.id;

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

        // Update user
        await executeQuery(
            'UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email), phone_number = COALESCE(?, phone_number), bio = COALESCE(?, bio) WHERE id = ?',
            [username, email, phone, bio, userId]
        );

        // Log activity
        await logActivity(userId, 'UPDATE', 'User profile updated');

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload avatar endpoint
router.post('/profile/avatar', require('../middleware/auth').authenticateToken, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        const userId = req.user.id;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const avatarPath = `/uploads/avatars/${req.file.filename}`;
        await executeQuery('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, userId]);
        await logActivity(userId, 'UPDATE', 'User avatar updated');
        res.json({ message: 'Avatar updated', avatar: avatarPath });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ message: 'Failed to upload avatar' });
    }
});

module.exports = router;
