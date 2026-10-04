const User = require('../models/User');
const Stock = require('../models/Stock');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Validate input
    if (!username || !email || !password || !firstName || !lastName) {
      console.log('Registration failed: Missing required fields');
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }
    
    // Check if user already exists
    console.log('Checking if user already exists:', { username, email });
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    console.log('Existing user lookup result:', existingUser ? `User found: ${existingUser.username}` : 'No existing user');
    
    if (existingUser) {
      console.log('Registration failed: User already exists');
      if (existingUser.email === email) {
        return res.status(400).json({ 
          error: 'Email already registered' 
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ 
          error: 'Username already taken' 
        });
      }
    }
    
    // Hash password
    console.log('Hashing password for user:', username);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');
    
    // Create new user
    console.log('Creating new user:', { username, email, firstName, lastName });
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      watchlist: []
    });
    
    // Save user to database
    console.log('Saving user to database');
    const savedUser = await user.save();
    console.log('User registered successfully:', savedUser.username);
    
    // Create JWT token
    console.log('Generating JWT token for user:', savedUser.username);
    const token = jwt.sign(
      { userId: savedUser._id },
      process.env.JWT_SECRET || 'stock_prediction_secret',
      { expiresIn: '7d' }
    );
    
    // Return user data (without password) and token
    const userData = {
      id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      watchlist: savedUser.watchlist
    };
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      token
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    // Send more detailed error information
    if (error.name === 'MongoError' || error.name === 'MongoNetworkError') {
      return res.status(500).json({ 
        error: 'Database connection error. Please try again later.' 
      });
    }
    res.status(500).json({ 
      error: 'Server error during registration' 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      console.log('Login failed: Missing username or password');
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }
    
    // Find user by username or email
    console.log('Looking up user for login:', username);
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });
    
    console.log('User lookup result:', user ? `User found: ${user.username}` : 'User not found');
    
    if (!user) {
      console.log('Login failed: User not found for username/email:', username);
      return res.status(400).json({ 
        error: 'Invalid username or password' 
      });
    }
    
    // Check password
    console.log('Checking password for user:', user.username);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for user:', user.username);
      return res.status(400).json({ 
        error: 'Invalid username or password' 
      });
    }
    
    // Update last login
    console.log('Updating last login for user:', user.username);
    user.lastLogin = new Date();
    await user.save();
    
    // Create JWT token
    console.log('Generating JWT token for user:', user.username);
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'stock_prediction_secret',
      { expiresIn: '7d' }
    );
    
    // Return user data (without password) and token
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      watchlist: user.watchlist || []
    };
    
    res.json({
      message: 'Login successful',
      user: userData,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error during login' 
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        watchlist: user.watchlist || [],
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add stock to watchlist
exports.addToWatchlist = async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }
    
    // Find user and add stock to watchlist
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if stock is already in watchlist
    if (user.watchlist && user.watchlist.includes(symbol)) {
      return res.status(400).json({ error: 'Stock already in watchlist' });
    }
    
    // Add stock to watchlist
    if (!user.watchlist) {
      user.watchlist = [];
    }
    user.watchlist.push(symbol.toUpperCase());
    await user.save();
    
    res.json({
      message: 'Stock added to watchlist',
      watchlist: user.watchlist
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Remove stock from watchlist
exports.removeFromWatchlist = async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }
    
    // Find user and remove stock from watchlist
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove stock from watchlist
    if (user.watchlist) {
      user.watchlist = user.watchlist.filter(item => item !== symbol.toUpperCase());
      await user.save();
    }
    
    res.json({
      message: 'Stock removed from watchlist',
      watchlist: user.watchlist
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user watchlist
exports.getWatchlist = async (req, res) => {
  try {
    // Find user and get watchlist
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      watchlist: user.watchlist || []
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Save stock data to database
exports.saveStockData = async (req, res) => {
  try {
    const stockData = req.body;
    
    if (!stockData.symbol) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }
    
    // Create or update stock data
    const stock = await Stock.findOneAndUpdate(
      { symbol: stockData.symbol.toUpperCase() },
      {
        ...stockData,
        symbol: stockData.symbol.toUpperCase(),
        lastUpdated: new Date()
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    res.json({
      message: 'Stock data saved successfully',
      stock
    });
  } catch (error) {
    console.error('Save stock data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get stock data from database
exports.getStockData = async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }
    
    // Find stock data
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock data not found' });
    }
    
    res.json({
      stock
    });
  } catch (error) {
    console.error('Get stock data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};