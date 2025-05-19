// server/routes/elections.js
const router       = require('express').Router();
const authenticate = require('../middleware/auth');
const Election     = require('../models/Election');
const Vote         = require('../models/Vote');

// GET /api/elections/current
router.get(
  '/current',
  authenticate,
  async (req, res, next) => {
    try {
      // 1) Find open election for this user’s country
      const elect = await Election.findOne({
        country:  req.user.country,
        isClosed: false
      });

      if (!elect) {
        return res.json({ election: null, hasVoted: false });
      }

      // 2) Check if this user has already voted in it
      const existing = await Vote.findOne({
        election: elect._id,
        voter:    req.user.id
      });

      // 3) Return both
      res.json({
        election: elect,
        hasVoted: !!existing
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
