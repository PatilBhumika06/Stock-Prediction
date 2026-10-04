const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  exchange: {
    type: String,
    trim: true
  },
  currency: {
    type: String,
    trim: true
  },
  open: {
    type: Number
  },
  high: {
    type: Number
  },
  low: {
    type: Number
  },
  close: {
    type: Number
  },
  volume: {
    type: Number
  },
  previousClose: {
    type: Number
  },
  change: {
    type: Number
  },
  percentChange: {
    type: Number
  },
  marketCap: {
    type: Number
  },
  peRatio: {
    type: Number
  },
  beta: {
    type: Number
  },
  eps: {
    type: Number
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  history: [{
    date: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number
  }]
}, {
  timestamps: true
});

// Index for faster queries
stockSchema.index({ symbol: 1 });
stockSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('Stock', stockSchema);