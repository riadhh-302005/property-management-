require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initPaymentScheduler } = require('./services/paymentScheduler');


// Import routes
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const paymentRoutes = require('./routes/payments');
const maintenanceRoutes = require('./routes/maintenance');
const leaseRoutes = require('./routes/leases');
const messageRoutes = require('./routes/messages');

const app = express();

// Connect to database
connectDB();

// Initialize payment scheduler (auto-generate monthly payments)
initPaymentScheduler();

// Middleware
app.use(cors({
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/messages', messageRoutes);
app.use("/api/users", require("./routes/users"));


// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PropertyHub API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to PropertyHub API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      properties: '/api/properties',
      payments: '/api/payments',
      maintenance: '/api/maintenance',
      leases: '/api/leases',
      messages: '/api/messages'
    }
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
