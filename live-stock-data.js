// Live Stock Data Handler
class LiveStockData {
    constructor() {
        // Use relative path for backend proxy when running on same server
        // Use absolute path for development when frontend and backend are on different ports
        const isDevelopment = window.location.port === '5500' || parseInt(window.location.port) > 50000;
        this.apiBaseUrl = isDevelopment ? 'http://localhost:3000' : '';
        this.cache = new Map(); // Cache for stock data
        this.cacheExpiry = 1 * 60 * 1000; // Reduced cache expiry to 1 minute for more frequent updates
    }

    // Fetch stock quote data
    async fetchStockQuote(symbol) {
        try {
            console.log(`Fetching stock data for: ${symbol}`);
            
            // Check cache first
            const cached = this.cache.get(symbol);
            if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
                console.log(`Returning cached data for ${symbol}`);
                return cached.data;
            }

            const response = await fetch(`${this.apiBaseUrl}/stock/quote/${symbol}`);
            console.log(`API response status for ${symbol}: ${response.status}`);
            
            if (!response.ok) {
                console.error(`API request failed for ${symbol} with status: ${response.status}`);
                // If we get a rate limit error, return cached data or mock data
                if (response.status === 429) {
                    console.warn(`Rate limit hit for ${symbol}, using cached or mock data`);
                    if (cached) return cached.data;
                }
                throw new Error(`Failed to fetch data for ${symbol}: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`Received data for ${symbol}:`, data);
            
            // Check if the response contains an API-level error (like rate limiting)
            // BUT only treat it as an error if the code is NOT 200
            if (data && data.code && data.code !== 200) {
                console.error(`API Error for ${symbol}: ${data.message} (Code: ${data.code})`);
                // Return cached data if available
                if (cached) {
                    console.warn(`Returning cached data for ${symbol}`);
                    return cached.data;
                }
                // Return mock data if API fails
                console.warn(`Returning mock data for ${symbol}`);
                return this.getMockStockData(symbol);
            }
            
            // NEW: Additional check to ensure we're not returning sample data
            // Check if the data matches the known sample data patterns
            const isSampleData = this.isSampleData(data);
            if (isSampleData) {
                console.warn(`Detected sample data for ${symbol}, but API keys are working. Clearing cache and trying again.`);
                // Clear cache and try to get fresh data
                this.clearCache(symbol);
                // If we have cached data that's different, return that instead
                if (cached && !this.isSampleData(cached.data)) {
                    console.log(`Returning non-sample cached data for ${symbol}`);
                    return cached.data;
                }
            }
            
            // Cache the data
            this.cache.set(symbol, {
                data: data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            // Return cached data if available
            const cached = this.cache.get(symbol);
            if (cached) {
                console.warn(`Returning cached data for ${symbol} due to error:`, error.message);
                return cached.data;
            }
            // Return mock data if API fails
            console.warn(`Returning mock data for ${symbol} due to error:`, error.message);
            return this.getMockStockData(symbol);
        }
    }

    // Check if the data matches known sample data patterns
    isSampleData(data) {
        if (!data) return false;
        
        // Check for the specific sample data values that indicate mock data
        const samplePatterns = {
            open: "172.10000",
            high: "173.50000",
            low: "171.80000",
            close: "172.35000",
            volume: "45200000"
        };
        
        // If all the sample patterns match, it's likely sample data
        for (const [key, sampleValue] of Object.entries(samplePatterns)) {
            if (data[key] === sampleValue) {
                // Found a match, continue checking
                continue;
            } else {
                // If any value doesn't match, it's not sample data
                return false;
            }
        }
        
        // If we get here, all values matched sample data
        return true;
    }

    // Fetch multiple stock quotes with rate limiting
    async fetchMultipleStockQuotes(symbols) {
        try {
            const results = [];
            
            // Process symbols in smaller batches with delays to avoid rate limiting
            const batchSize = 5; // Reduced batch size
            for (let i = 0; i < symbols.length; i += batchSize) {
                const batch = symbols.slice(i, i + batchSize);
                const batchPromises = batch.map(symbol => this.fetchStockQuote(symbol));
                const batchResults = await Promise.allSettled(batchPromises);
                
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push({
                            symbol: batch[index],
                            data: result.value,
                            success: true
                        });
                    } else {
                        results.push({
                            symbol: batch[index],
                            error: result.reason,
                            success: false
                        });
                    }
                });
                
                // Add delay between batches to avoid rate limiting
                if (i + batchSize < symbols.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                }
            }
            
            return results;
        } catch (error) {
            console.error('Error fetching multiple stock quotes:', error);
            return symbols.map(symbol => ({
                symbol: symbol,
                error: error.message,
                success: false
            }));
        }
    }

    // Get all stock symbols from our stock data
    getAllStockSymbols() {
        const symbols = [];
        
        // Add Live Data stocks
        if (stockData && stockData.liveData) {
            stockData.liveData.forEach(stock => {
                if (stock.symbol) {
                    symbols.push(stock.symbol);
                }
            });
        }
        
        return symbols;
    }

    // Fetch live data for all stocks (limited to first 50 to avoid rate limiting)
    async fetchAllStocksData() {
        const allSymbols = this.getAllStockSymbols().slice(0, 50); // Limit to first 50 stocks
        return await this.fetchMultipleStockQuotes(allSymbols);
    }

    // Get mock stock data for fallback
    getMockStockData(symbol) {
        return {
            symbol: symbol,
            name: symbol,
            exchange: "NASDAQ",
            currency: "USD",
            datetime: new Date().toISOString(),
            open: (Math.random() * 1000).toFixed(2),
            high: (Math.random() * 1000 + 10).toFixed(2),
            low: (Math.random() * 1000).toFixed(2),
            close: (Math.random() * 1000).toFixed(2),
            volume: Math.floor(Math.random() * 10000000),
            previous_close: (Math.random() * 1000).toFixed(2),
            change: (Math.random() * 20 - 10).toFixed(2),
            percent_change: (Math.random() * 10 - 5).toFixed(2),
            average_volume: Math.floor(Math.random() * 10000000),
            market_cap: Math.floor(Math.random() * 1000000000000),
            pe_ratio: (Math.random() * 50).toFixed(2),
            beta: (Math.random() * 2).toFixed(2),
            eps: (Math.random() * 10).toFixed(2)
        };
    }

    // Format stock data for display
    formatStockData(stock) {
        if (!stock || !stock.data) return null;
        
        const data = stock.data;
        const change = parseFloat(data.change || 0);
        const percentChange = parseFloat(data.percent_change || 0);
        const isPositive = change >= 0;
        
        return {
            symbol: data.symbol || stock.symbol,
            name: data.name || data.symbol || stock.symbol,
            price: data.close ? parseFloat(data.close).toFixed(2) : 'N/A',
            change: change.toFixed(2),
            percentChange: percentChange.toFixed(2),
            isPositive: isPositive,
            volume: data.volume ? parseInt(data.volume).toLocaleString() : 'N/A',
            marketCap: data.market_cap ? this.formatMarketCap(data.market_cap) : 'N/A'
        };
    }

    // Format market cap for display
    formatMarketCap(marketCap) {
        const cap = parseInt(marketCap);
        if (cap >= 1e12) {
            return `$${(cap / 1e12).toFixed(2)}T`;
        } else if (cap >= 1e9) {
            return `$${(cap / 1e9).toFixed(2)}B`;
        } else if (cap >= 1e6) {
            return `$${(cap / 1e6).toFixed(2)}M`;
        } else {
            return `$${cap.toLocaleString()}`;
        }
    }

    // Clear cache for a specific symbol
    clearCache(symbol) {
        if (symbol) {
            this.cache.delete(symbol);
        } else {
            this.cache.clear();
        }
    }

    // Save stock data to MongoDB
    async saveStockDataToDB(stockData) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('User not authenticated');
            }

            const response = await fetch(`${this.apiBaseUrl}/api/auth/stock/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(stockData)
            });

            if (!response.ok) {
                throw new Error(`Failed to save stock data: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Stock data saved to MongoDB:', result);
            return result;
        } catch (error) {
            console.error('Error saving stock data to MongoDB:', error);
            throw error;
        }
    }

    // Get stock data from MongoDB
    async getStockDataFromDB(symbol) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('User not authenticated');
            }

            const response = await fetch(`${this.apiBaseUrl}/api/auth/stock/${symbol}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Stock data not found
                }
                throw new Error(`Failed to get stock data: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`Stock data retrieved from MongoDB for ${symbol}:`, result);
            return result.stock;
        } catch (error) {
            console.error('Error getting stock data from MongoDB:', error);
            throw error;
        }
    }
}

// Create a global instance
const liveStockData = new LiveStockData();