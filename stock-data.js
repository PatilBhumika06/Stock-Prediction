// Stock data for Indian and Global stocks
const stockData = {
  // Add 50 popular stocks that provide real live data from Twelve Data API
  liveData: [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "MSFT", name: "Microsoft Corp." },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "TSLA", name: "Tesla Inc." },
    { symbol: "META", name: "Meta Platforms, Inc. Class A" },
    { symbol: "NVDA", name: "NVIDIA Corporation" },
    { symbol: "NFLX", name: "Netflix Inc." },
    { symbol: "BLK", name: "BlackRock Inc." },
    { symbol: "SCHW", name: "Charles Schwab Corporation" },
    { symbol: "AXP", name: "American Express Co." },
    { symbol: "MA", name: "Mastercard Inc." },
    { symbol: "V", name: "Visa Inc." },
    { symbol: "COF", name: "Capital One Financial Corporation" },
    { symbol: "SYF", name: "Synchrony Financial" },
    { symbol: "JPM", name: "JPMorgan Chase & Co." },
    { symbol: "BAC", name: "Bank of America Corp." },
    { symbol: "WFC", name: "Wells Fargo & Company" },
    { symbol: "C", name: "Citigroup Inc." },
    { symbol: "GS", name: "Goldman Sachs Group, Inc." },
    { symbol: "PYPL", name: "PayPal Holdings, Inc." },
    { symbol: "SQ", name: "Block, Inc." },
    { symbol: "ADBE", name: "Adobe Inc." },
    { symbol: "CRM", name: "Salesforce, Inc." },
    { symbol: "ORCL", name: "Oracle Corporation" },
    { symbol: "IBM", name: "International Business Machines Corp." },
    { symbol: "INTC", name: "Intel Corporation" },
    { symbol: "AMD", name: "Advanced Micro Devices, Inc." },
    { symbol: "DIS", name: "The Walt Disney Company" },
    { symbol: "CMCSA", name: "Comcast Corporation" },
    { symbol: "T", name: "AT&T Inc." },
    { symbol: "VZ", name: "Verizon Communications Inc." },
    { symbol: "KO", name: "The Coca-Cola Company" },
    { symbol: "PEP", name: "PepsiCo, Inc." },
    { symbol: "MCD", name: "McDonald's Corporation" },
    { symbol: "NKE", name: "NIKE, Inc." },
    { symbol: "SBUX", name: "Starbucks Corporation" },
    { symbol: "WMT", name: "Walmart Inc." },
    { symbol: "COST", name: "Costco Wholesale Corporation" },
    { symbol: "HD", name: "The Home Depot, Inc." },
    { symbol: "LOW", name: "Lowe's Companies, Inc." },
    { symbol: "BA", name: "The Boeing Company" },
    { symbol: "CAT", name: "Caterpillar Inc." },
    { symbol: "GE", name: "General Electric Company" },
    { symbol: "GM", name: "General Motors Company" },
    { symbol: "F", name: "Ford Motor Company" },
    { symbol: "XOM", name: "Exxon Mobil Corporation" },
    { symbol: "CVX", name: "Chevron Corporation" },
    { symbol: "JNJ", name: "Johnson & Johnson" },
    { symbol: "PFE", name: "Pfizer Inc." }
  ]
};

// Function to populate the stock dropdown
function populateStockDropdown() {
  console.log('populateStockDropdown called');
  const stockDropdown = document.getElementById('stockDropdown');
  console.log('stockDropdown element:', stockDropdown);
  
  if (!stockDropdown) {
    console.error('stockDropdown element not found!');
    return;
  }
  
  // Clear existing options except the first one
  while (stockDropdown.children.length > 1) {
    stockDropdown.removeChild(stockDropdown.lastChild);
  }
  
  console.log('stockData:', stockData);
  console.log('Indian stocks:', stockData && stockData.indian ? stockData.indian.length : 0);
  console.log('Global stocks:', stockData && stockData.global ? stockData.global.length : 0);
  
  // Add Live Data stocks group
  const liveDataGroup = document.createElement('optgroup');
  liveDataGroup.label = "Data Stocks";
  console.log('Creating Live Data stocks group');
  if (stockData && stockData.liveData) {
    console.log('Adding Live Data stocks, count:', stockData.liveData.length);
    stockData.liveData.forEach((stock, index) => {
      const option = document.createElement('option');
      option.value = stock.symbol;
      option.textContent = stock.name + ' (' + stock.symbol + ')';
      liveDataGroup.appendChild(option);
      // Limit logging to first 5 items to avoid console spam
      if (index < 5) {
        console.log('Added Live Data stock:', stock.symbol, stock.name);
      }
    });
  }
  stockDropdown.appendChild(liveDataGroup);
  console.log('Added Live Data stocks group');
  console.log('Total options in dropdown:', stockDropdown.children.length);
  
  // Log the first few options to verify they were added
  const options = Array.from(stockDropdown.options);
  console.log('First 5 options in dropdown:', options.slice(0, 5).map(opt => opt.text));
}