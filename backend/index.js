const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { seedDefaultData } = require('./data/seedData');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const authRoutes = require('./routes/auth.routes');
const scrapRoutes = require('./routes/scrap.routes');
const serviceRoutes = require('./routes/service.routes');
const locationRoutes = require('./routes/location.routes');
const partnerRoutes = require('./routes/partner.routes');
const adminRoutes = require('./routes/admin.routes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/scrap', scrapRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/admin', adminRoutes);

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecoscrap').then(async () => {
  console.log('MongoDB connected');
  await seedDefaultData();
  console.log('Default locations, services, and scrap categories are ready');
})
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'EcoScrap Pro API is running' });
});

const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
