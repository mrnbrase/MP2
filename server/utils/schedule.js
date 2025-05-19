// server/utils/schedule.js

const cron     = require('node-cron');
const mongoose = require('mongoose');
const Election = require('../models/Election');
const Country  = require('../models/Country');
const Vote     = require('../models/Vote');
const User     = require('../models/User');
const Event    = require('../models/Event');
const Resource = require('../models/Resource');
const UnitType = require('../models/UnitType');

/**
 * Schedule a daily job at 00:00 UTC that:
 * 1. On Mondays, creates next week's elections
 * 2. Closes last week's elections and promotes presidents
 * 3. Resolves any due Event arrivals (attacks, spies, nukes)
 */
function scheduleWeeklyElections() {
  cron.schedule('0 0 * * *', async () => {
    const now = new Date();

    // 1. On Monday UTC, create next week's elections
    if (now.getUTCDay() === 1) {
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const countries = await Country.find();
      const ops = countries.map(c => ({
        country:   c._id,
        weekStart: now,
        weekEnd:   nextWeek
      }));
      try {
        await Election.insertMany(ops, { ordered: false });
        console.log('🗳️ Elections created for next week');
      } catch (err) {
        if (err.code !== 11000) console.error(err);
      }
      // Close last week's elections
      await resolveLastWeekElection();
    }

    // 2. Resolve any pending events (attacks, spies, nukes)
    await resolveEvents();
  }, { timezone: 'UTC' });
}

/**
 * Finds all elections that have ended but not yet closed,
 * marks them closed, resets any existing presidents to players,
 * and promotes the winner.
 */
async function resolveLastWeekElection() {
  const toClose = await Election.find({
    weekEnd: { $lte: new Date() },
    isClosed: false
  });

  for (const elect of toClose) {
    const [ winner ] = await Vote.aggregate([
      { $match: { election: elect._id } },
      { $group: { _id: '$candidate', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Mark election closed
      await Election.updateOne({ _id: elect._id }, { isClosed: true }, { session });
      // Revoke previous presidents in this country
      await User.updateMany(
        { country: elect.country, role: 'president' },
        { role: 'player' },
        { session }
      );
      // Promote the winner
      await User.updateOne(
        { _id: winner._id },
        { role: 'president' },
        { session }
      );
      await session.commitTransaction();
      console.log(`🏅 Election ${elect._id} closed; winner ${winner._id}`);
    } catch (err) {
      await session.abortTransaction();
      console.error('Error closing election', elect._id, err);
    } finally {
      session.endSession();
    }
  }
}

/**
 * Processes all Events whose arrival time has passed:
 * - For 'attack', deducts attacker power from defender's money rate
 * - For 'spy', could be extended to reveal info (no-op here)
 * - For 'nuke', zeroes out defender's money rate
 * Marks each event resolved.
 */
async function resolveEvents() {
  const now = new Date();
  const pending = await Event.find({ arrivesAt: { $lte: now }, resolved: false });

  for (const ev of pending) {
    try {
      const unit = await UnitType.findById(ev.unitType);
      const defenderRes = await Resource.findOne({ country: ev.toCountry });

      switch (ev.type) {
        case 'attack': {
          const damage = unit.attack * ev.quantity;
          const newRate = Math.max(0, defenderRes.moneyCentsPerSecond - damage);
          await Resource.updateOne(
            { country: ev.toCountry },
            { $set: { moneyCentsPerSecond: newRate } }
          );
          console.log(`⚔️ Attack event ${ev._id}: -${damage}¢/sec from country ${ev.toCountry}`);
          break;
        }
        case 'spy': {
          // You could log or notify here—left as a no-op
          console.log(`🕵️ Spy event ${ev._id} on country ${ev.toCountry}`);
          break;
        }
        case 'nuke': {
          await Resource.updateOne(
            { country: ev.toCountry },
            { $set: { moneyCentsPerSecond: 0 } }
          );
          console.log(`💥 Nuke event ${ev._id}: country ${ev.toCountry} economy destroyed`);
          break;
        }
      }

      ev.resolved = true;
      await ev.save();
    } catch (err) {
      console.error('Error resolving event', ev._id, err);
    }
  }
}

module.exports = {
  scheduleWeeklyElections,
  resolveLastWeekElection,
  resolveEvents
};
