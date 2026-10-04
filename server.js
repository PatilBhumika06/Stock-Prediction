const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Import routes
const authRoutes = require('./routes/auth');

const app = express();

// Enable CORS with options - More permissive for development
app.use(cors({
    origin: true, // Reflect the request origin
    credentials: true, // Include credentials
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow methods
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'] // Explicitly allow headers
}));

// Body parsing middleware - MUST be before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add detailed request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// API Routes - MUST be placed BEFORE static file serving to avoid conflicts
console.log('Loading auth routes...');
app.use('/api/auth', authRoutes);
console.log('Auth routes loaded successfully');

// MongoDB connection with enhanced error handling and connection events
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stockprediction';

console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', MONGO_URI.replace(/\/\/(.*?):(.*?)@/, '//****:****@')); // Hide credentials in logs

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    
    // Test the connection by checking if we can access the User model
    const User = require('./models/User');
    User.countDocuments()
      .then(count => {
        console.log(`📊 Found ${count} users in the database`);
      })
      .catch(err => {
        console.log('⚠️  Could not count users, but connection is established:', err.message);
      });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.error('Please check your MongoDB connection string and ensure MongoDB is running');
  });

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔄 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔄 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔄 Mongoose disconnected from MongoDB');
});

// Gracefully close MongoDB connection when Node.js process ends
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔄 Mongoose connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Simple stock prediction endpoint
app.post('/predict', async (req, res) => {
    const { symbol } = req.body;
    // Dummy prediction logic (replace with real model/API)
    if (!symbol) return res.status(400).json({ error: 'Stock symbol required.' });
    // Example: random prediction
    const prediction = (Math.random() * 1000).toFixed(2);
    res.json({ prediction });
});

// Twelve Data API endpoints
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '0523589945d34a05b140f7b8a59af593';
const TWELVE_DATA_NEWS_API_KEY = process.env.TWELVE_DATA_NEWS_API_KEY || '28040875452f471d89ada3620ee91f92';
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'your_newsapi_key_here';

// Endpoint to get stock quote
app.get('/stock/quote/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        console.log(`Fetching stock quote for: ${symbol}`);
        
        // Updated to use the correct endpoint based on Twelve Data documentation
        const response = await axios.get(`https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`);
        console.log(`API response for ${symbol}: Status ${response.status}`, response.data);
        
        // Check if the response contains an error (like rate limiting)
        // BUT only treat it as an error if the code exists and is NOT 200
        if (response.data && response.data.code && response.data.code !== 200) {
            console.error('API Error for', symbol, ':', response.data.message, '(Code:', response.data.code, ')');
            // Return sample data if API fails
            const sampleData = {
                "symbol": symbol,
                "name": symbol + " Corporation",
                "exchange": "NASDAQ",
                "currency": "USD",
                "datetime": new Date().toISOString(),
                "open": "172.10000",
                "high": "173.50000",
                "low": "171.80000",
                "close": "172.35000",
                "volume": "45200000",
                "previous_close": "171.50000",
                "change": "0.85000",
                "percent_change": "0.50",
                "average_volume": "58500000",
                "fifty_two_week": {
                    "low": "124.17000",
                    "high": "198.23000",
                    "low_change": "48.18000",
                    "high_change": "-25.88000",
                    "low_change_percent": "38.80",
                    "high_change_percent": "-13.06",
                    "range": "124.17000 - 198.23000"
                },
                "market_cap": "2700000000000",
                "pe_ratio": "28.50",
                "beta": "1.25",
                "eps": "6.05000"
            };
            return res.json(sampleData);
        }
        
        // NEW: Additional validation to ensure we're sending real data
        // Log if we detect sample data patterns
        if (response.data && 
            response.data.open === "172.10000" && 
            response.data.high === "173.50000" && 
            response.data.low === "171.80000" && 
            response.data.close === "172.35000") {
            console.warn(`WARNING: Detected sample data being returned from Twelve Data API for ${symbol}`);
        }
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching stock quote for', symbol, ':', error.message);
        // Return sample data if API fails
        const sampleData = {
            "symbol": symbol || "AAPL",
            "name": (symbol || "AAPL") + " Corporation",
            "exchange": "NASDAQ",
            "currency": "USD",
            "datetime": new Date().toISOString(),
            "open": "172.10000",
            "high": "173.50000",
            "low": "171.80000",
            "close": "172.35000",
            "volume": "45200000",
            "previous_close": "171.50000",
            "change": "0.85000",
            "percent_change": "0.50",
            "average_volume": "58500000",
            "fifty_two_week": {
                "low": "124.17000",
                "high": "198.23000",
                "low_change": "48.18000",
                "high_change": "-25.88000",
                "low_change_percent": "38.80",
                "high_change_percent": "-13.06",
                "range": "124.17000 - 198.23000"
            },
            "market_cap": "2700000000000",
            "pe_ratio": "28.50",
            "beta": "1.25",
            "eps": "6.05000"
        };
        res.json(sampleData);
    }
});

// Endpoint to get stock time series data
app.get('/stock/time-series/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { interval = '1day', outputsize = 30 } = req.query;
        // Updated to use the correct endpoint based on Twelve Data documentation
        const response = await axios.get(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching time series data:', error.message);
        // Return sample data if API fails
        const sampleData = {
            "meta": {
                "symbol": "AAPL",
                "interval": "1day",
                "currency": "USD",
                "exchange_timezone": "America/New_York"
            },
            "values": [
                {"datetime": "2023-06-15", "open": "172.10000", "high": "173.50000", "low": "171.80000", "close": "172.35000", "volume": "45200000"},
                {"datetime": "2023-06-14", "open": "171.50000", "high": "172.80000", "low": "170.90000", "close": "172.10000", "volume": "51200000"},
                {"datetime": "2023-06-13", "open": "169.80000", "high": "171.50000", "low": "169.20000", "close": "171.50000", "volume": "48900000"},
                {"datetime": "2023-06-12", "open": "170.20000", "high": "171.00000", "low": "169.50000", "close": "169.80000", "volume": "42300000"},
                {"datetime": "2023-06-09", "open": "168.50000", "high": "170.20000", "low": "168.10000", "close": "170.20000", "volume": "55600000"},
                {"datetime": "2023-06-08", "open": "167.80000", "high": "169.50000", "low": "167.20000", "close": "168.50000", "volume": "49800000"},
                {"datetime": "2023-06-07", "open": "169.20000", "high": "169.80000", "low": "167.90000", "close": "167.80000", "volume": "52300000"}
            ],
            "status": "ok"
        };
        res.json(sampleData);
    }
});

// Endpoint to get company profile
app.get('/stock/profile/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        // Updated to use the correct endpoint based on Twelve Data documentation
        const response = await axios.get(`https://api.twelvedata.com/profile?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching company profile:', error.message);
        // Return sample data if API fails
        const sampleData = {
            "symbol": "AAPL",
            "name": "Apple Inc",
            "exchange": "NASDAQ",
            "currency": "USD",
            "country": "USA",
            "type": "Common Stock",
            "industry": "Consumer Electronics",
            "sector": "Technology",
            "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, a line of smartphones; Mac, a line of personal computers; iPad, a line of multi-purpose tablets; and wearables, home and accessories comprising AirPods, Apple TV, Apple Watch, Beats products, and HomePod. It also provides AppleCare support services; cloud services store services; and operates various platforms, including the App Store, that allow customers to discover and download applications and digital content, such as books, music, video, games, and podcasts. In addition, the company offers various services, such as Apple Arcade, Apple Card, Apple News+, Apple Fitness+, Apple Music, Apple TV+, iCloud, Apple Pay, and Apple Books. Further, it sells its products through its retail and online stores, and direct sales force; and third-party cellular network carriers, wholesalers, retailers, and resellers. The company was formerly known as Apple Computer, Inc. and changed its name to Apple Inc. in January 2007. Apple Inc. was founded in 1976 and is headquartered in Cupertino, California.",
            "logo": "https://twelvedata.com/logo/apple.png",
            "market_cap": "2700000000000",
            "pe_ratio": "28.50",
            "beta": "1.25",
            "eps": "6.05000",
            "dividend_yield": "0.55",
            "employees": "164000",
            "url": "https://www.apple.com",
            "ipo_date": "1980-12-12",
            "status": "ok"
        };
        res.json(sampleData);
    }
});

// Test endpoint to verify routing is working
app.get('/test-news', async (req, res) => {
    console.log('=== TEST NEWS ENDPOINT CALLED ===');
    res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

// Endpoint to get stock news (now using NewsAPI.org)
app.get('/stock/news', async (req, res) => {
    console.log('=== NEWS ENDPOINT CALLED ===');
    console.log('Request query params:', req.query);
    console.log('Request headers:', req.headers);
    
    try {
        const { symbol, limit = 10 } = req.query;
        
        console.log('News API request received with params:', { symbol, limit });
        console.log('NEWS_API_KEY from env:', NEWS_API_KEY);
        
        // Build query for NewsAPI.org
        let query = 'stock market';
        if (symbol) {
            query = `${symbol} stock`;
        }
        
        // NewsAPI.org endpoint with additional parameters for better results
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}&language=en&apiKey=${NEWS_API_KEY}`;
        
        console.log(`Fetching news from NewsAPI.org: ${url}`);
        
        const response = await axios.get(url);
        console.log(`NewsAPI.org response status: ${response.status}`);
        console.log(`NewsAPI.org response data keys:`, Object.keys(response.data));
        
        // Check if the response contains an error
        if (response.data && response.data.status !== 'ok') {
            console.error('NewsAPI.org Error:', response.data.message, '(Code:', response.data.code, ')');
            throw new Error(`API Error: ${response.data.message}`);
        }
        
        // Log the first article to see if it's real data
        if (response.data.articles && response.data.articles.length > 0) {
            console.log('First article date:', response.data.articles[0].publishedAt);
        }
        
        // Transform NewsAPI.org response to match our expected format
        const transformedData = {
            data: response.data.articles.map(article => ({
                title: article.title,
                description: article.description,
                source: article.source.name,
                date: article.publishedAt,
                url: article.url,
                // For stock symbols, we would need to extract them from the article content
                symbols: symbol ? [symbol] : []
            })),
            status: response.data.status,
            totalResults: response.data.totalResults
        };
        
        console.log('Sending transformed data with', transformedData.data.length, 'articles');
        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching stock news:', error.message);
        if (error.response) {
            console.error('Error response data:', error.response.data);
        }
        // Return sample data if API fails
        const sampleData = {
            "data": [
                {
                    "title": "Apple Announces Breakthrough in Battery Technology",
                    "description": "Apple Inc. has unveiled a new battery technology that could significantly extend the life of its devices, potentially revolutionizing the smartphone industry.",
                    "source": "Tech News Daily",
                    "date": "2023-06-15",
                    "url": "https://technewsdaily.com/apple-battery-breakthrough",
                    "symbols": ["AAPL"]
                },
                {
                    "title": "Tech Stocks Rally Amid Positive Earnings Reports",
                    "description": "Major technology stocks surged today as investors reacted positively to recent earnings reports from leading companies in the sector.",
                    "source": "Financial Times",
                    "date": "2023-06-14",
                    "url": "https://financialtimes.com/tech-stocks-rally",
                    "symbols": ["AAPL", "MSFT", "GOOGL"]
                },
                {
                    "title": "Federal Reserve Policy Uncertainty Eases",
                    "description": "Recent comments from Federal Reserve officials suggesting a more cautious approach to interest rate hikes have led to a rally in tech stocks.",
                    "source": "Bloomberg",
                    "date": "2023-06-14",
                    "url": "https://bloomberg.com/fed-policy-eases",
                    "symbols": ["AAPL", "TSLA", "AMZN"]
                },
                {
                    "title": "Global Markets React to Inflation Data",
                    "description": "Markets showed mixed reactions as fresh inflation data suggested that price pressures may be easing, potentially influencing central bank decisions.",
                    "source": "MarketWatch",
                    "date": "2023-06-13",
                    "url": "https://marketwatch.com/inflation-data-impact",
                    "symbols": ["SPY", "QQQ"]
                },
                {
                    "title": "Energy Sector Sees Surge in Investment",
                    "description": "Renewable energy companies are attracting record investments as governments worldwide increase focus on sustainability and carbon neutrality goals.",
                    "source": "Reuters",
                    "date": "2023-06-12",
                    "url": "https://reuters.com/energy-investment-surge",
                    "symbols": ["XOM", "CVX", "TSLA"]
                }
            ],
            "status": "ok"
        };
        res.json(sampleData);
    }
});

// Endpoint to get API usage info (for connectivity check)
app.get('/api/usage', async (req, res) => {
    try {
        const response = await axios.get(`https://api.twelvedata.com/apiusage?apikey=${TWELVE_DATA_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching API usage:', error.message);
        // Return sample data if API fails
        const sampleData = {
            "plan": "Basic",
            "current_usage": 500,
            "plan_limit": 1000,
            "reset_date": "2023-07-01",
            "status": "ok"
        };
        res.json(sampleData);
    }
});

// New endpoint to get stocks with live data
app.get('/stock/live-stocks', async (req, res) => {
    try {
        // Load the rotated live stocks data file
        const fs = require('fs');
        const path = require('path');
        
        // Check if the rotated live stocks list file exists
        const liveStocksFilePath = path.join(__dirname, '../rotated-live-stocks.json');
        
        if (fs.existsSync(liveStocksFilePath)) {
            const liveStocksData = JSON.parse(fs.readFileSync(liveStocksFilePath, 'utf8'));
            
            // Return the data
            return res.json({
                timestamp: liveStocksData.timestamp,
                set: liveStocksData.set,
                liveStocks: liveStocksData.stocks,
                count: liveStocksData.stocks.length,
                source: 'rotated'
            });
        }
        
        // If no data file exists, return empty array
        res.json({
            timestamp: new Date().toISOString(),
            set: 0,
            liveStocks: [],
            count: 0,
            source: 'none'
        });
    } catch (error) {
        console.error('Error fetching live stocks:', error.message);
        res.status(500).json({ error: 'Failed to fetch live stocks data' });
    }
});

// New route to serve the comprehensive live stocks list
app.get('/comprehensive-live-stocks-list.json', (req, res) => {
    console.log('[DEBUG] Serving comprehensive-live-stocks-list.json');
    const filePath = path.join(__dirname, '../comprehensive-live-stocks-list.json');
    res.sendFile(filePath);
});

// Serve static files from frontend - MUST be AFTER API routes
app.use(express.static(path.join(__dirname, '../frontend')));

// Also serve static files from root directory to access our new HTML file
app.use(express.static(path.join(__dirname, '..')));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`[DEBUG] Static file request: ${req.method} ${req.path}`);
    next();
});

// Fallback to index.html for SPA
app.get('/', (req, res) => {
    console.log('[DEBUG] Serving index.html for root path');
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Handle other specific routes
app.get('/stock-details', (req, res) => {
    console.log('[DEBUG] Serving stock-details.html');
    res.sendFile(path.join(__dirname, '../frontend', 'stock-details.html'));
});

app.get('/simple-stock-details', (req, res) => {
    console.log('[DEBUG] Serving simple-stock-details.html');
    res.sendFile(path.join(__dirname, '../frontend', 'simple-stock-details.html'));
});

app.get('/news', (req, res) => {
    console.log('[DEBUG] Serving news.html');
    res.sendFile(path.join(__dirname, '../frontend', 'news.html'));
});

app.get('/about', (req, res) => {
    console.log('[DEBUG] Serving about.html');
    res.sendFile(path.join(__dirname, '../frontend', 'about.html'));
});

app.get('/login', (req, res) => {
    console.log('[DEBUG] Serving login.html');
    res.sendFile(path.join(__dirname, '../frontend', 'login.html'));
});

app.get('/signup', (req, res) => {
    console.log('[DEBUG] Serving signup.html');
    res.sendFile(path.join(__dirname, '../frontend', 'signup.html'));
});

app.get('/afterlogin', (req, res) => {
    console.log('[DEBUG] Serving afterlogin.html');
    res.sendFile(path.join(__dirname, '../frontend', 'afterlogin.html'));
});

// New route for error reporter
app.get('/error-reporter', (req, res) => {
    console.log('[DEBUG] Serving error-reporter.html');
    res.sendFile(path.join(__dirname, '../frontend', 'error-reporter.html'));
});

// New route for live news page
app.get('/live-news', (req, res) => {
    console.log('[DEBUG] Serving live-news.html');
    res.sendFile(path.join(__dirname, '../live-news.html'));
});

// New route for all twelve data live stocks page
app.get('/all-twelve-data-live-stocks', (req, res) => {
    console.log('[DEBUG] Serving all-twelve-data-live-stocks.html');
    res.sendFile(path.join(__dirname, '../all-twelve-data-live-stocks.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🎉 Server running on port ${PORT}`);
    console.log(`🏠 Access the application at: http://localhost:${PORT}`);
    console.log(`📝 Login page: http://localhost:${PORT}/login.html`);
    console.log(`📝 Signup page: http://localhost:${PORT}/signup.html`);
    console.log(`📝 Error reporter: http://localhost:${PORT}/error-reporter.html`);
    console.log(`\n⚠️  IMPORTANT: For authentication to work properly:`);
    console.log(`   - Always access the app from http://localhost:${PORT}`);
    console.log(`   - Do NOT use other ports like 5500 or different origins`);
    console.log(`\n🔧 Press Ctrl+C to stop the server\n`);
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
        console.log('✅ MongoDB is connected and ready to use');
    } else {
        console.log('⚠️  MongoDB connection status:', mongoose.connection.readyState);
    }
});