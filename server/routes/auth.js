// server/routes/auth.js

const router       = require('express').Router();
const User         = require('../models/User');
const jwt          = require('jsonwebtoken');
const authenticate = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, country } = req.body;
    // lookup Country _id here if you’re using ObjectId refs…
    const user = new User({ email, password, country });
    await user.save();
    const token = jwt.sign(
      { id: user._id, role: user.role, country: user.country },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(201).json({ token });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Email already exists' });
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role, country: user.country },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/auth/me
router.patch(
  '/me',
  authenticate,
  async (req, res, next) => {
    try {
      const { country } = req.body;
      // Optional: validate that country exists
      const updated = await User.findByIdAndUpdate(
        req.user.id,
        { country },
        { new: true }
      ).select('-password');
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
