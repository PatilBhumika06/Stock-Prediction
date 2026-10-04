const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/watchlist/add', authMiddleware, authController.addToWatchlist);
router.post('/watchlist/remove', authMiddleware, authController.removeFromWatchlist);
router.get('/watchlist', authMiddleware, authController.getWatchlist);

// Stock data routes (require authentication)
router.post('/stock/save', authMiddleware, authController.saveStockData);
router.get('/stock/:symbol', authMiddleware, authController.getStockData);

module.exports = router;