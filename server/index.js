require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const { scheduleWeeklyElections, scheduleResourceGeneration } = require('./utils/schedule');

const authRoutes      = require('./routes/auth');
const countryRoutes   = require('./routes/countries');
const electionRoutes  = require('./routes/elections');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes     = require('./routes/admin');
const unitTypeRoutes  = require('./routes/unitTypes');
const resourceRoutes  = require('./routes/resources');
const usersRoutes = require('./routes/users');
const diplomacyRoutes = require('./routes/diplomacy');

const authenticate = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ——— MIDDLEWARE —————————————————————————————————————
app.use(cors());
app.use(express.json());

// ——— PUBLIC ROUTES ——————————————————————————————————
app.use('/api/auth', authRoutes);

// ——— PROTECTED ROUTES ————————————————————————————
app.use('/api/countries',   authenticate, countryRoutes);
app.use('/api/elections',   authenticate, electionRoutes);
app.use('/api/dashboard',   authenticate, dashboardRoutes);
app.use('/api/admin',       authenticate, adminRoutes);
app.use('/api/unit-types',  authenticate, unitTypeRoutes);
app.use('/api/resources',   authenticate, resourceRoutes);
app.use('/api/users', authenticate, usersRoutes);
app.use('/api/diplomacy', authenticate, diplomacyRoutes);

// ——— GLOBAL ERROR HANDLER ————————————————————————
app.use(errorHandler);

// ——— HEALTH CHECK ———————————————————————————
app.get('/health', (req, res) => res.send('OK'));


// ——— DATABASE + SCHEDULER + SERVER START ——————————
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    scheduleWeeklyElections();
    scheduleResourceGeneration();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

module.exports = app; // Export the app for testing
