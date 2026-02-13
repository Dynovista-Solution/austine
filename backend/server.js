const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { optionalAuth } = require('./middleware/auth');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/database');
const fs = require('fs');
const payuConfig = require('./config/payu');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Configure CORS to allow frontend URL(s)
const isProduction = process.env.NODE_ENV === 'production';
const defaultFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';

// In production, only allow real site origins (no localhost/LAN).
// In development, also allow localhost + local LAN for easier testing.
const productionOrigins = [
  defaultFrontend,
  'https://austinelifestyle.com',
  'https://www.austinelifestyle.com'
];
const developmentOrigins = [
  defaultFrontend,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
];

const localNet = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.[0-9]{1,3}\.[0-9]{1,3})(:[0-9]{2,5})?$/;

const allowedOrigins = isProduction ? productionOrigins : developmentOrigins;
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow non-browser requests
  if (allowedOrigins.includes(origin)) return true;
  if (!isProduction && localNet.test(origin)) return true;
  return false;
};

// PayU calls your backend callbacks server-to-server and may include an Origin header.
// We must not block these callbacks, otherwise users see a CORS error instead of the failure page.
const strictCors = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin), and any origin in the allowlist
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Also allow local network via regex (http://192.168.x.x:5173)
    if (!isProduction && localNet.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
});

const openCorsForPayUCallbacks = cors({
  origin: true,
  credentials: true,
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/orders/payment/')) {
    return openCorsForPayUCallbacks(req, res, next);
  }
  return strictCors(req, res, next);
});
// Handle preflight
// Note: Preflight requests are handled by CORS middleware above; no explicit app.options route needed
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - new Date()) / 1000);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter
    });
  }
});
// Apply rate limiter with admin bypass
app.use('/api/', optionalAuth, (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    return next(); // bypass limiter for admins
  }
  apiLimiter(req, res, next);
});

// Static files for uploads with proper headers for video streaming
const staticUploadsDir = path.join(__dirname, 'uploads');
try { fs.mkdirSync(staticUploadsDir, { recursive: true }); } catch {}
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for uploads
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range');
  res.header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(staticUploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/content', require('./routes/content'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/lookbook', require('./routes/lookbook'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`PayU: ${payuConfig?.isLive ? 'LIVE' : 'TEST'} (${payuConfig?.paymentUrl || 'no paymentUrl'})`);
});