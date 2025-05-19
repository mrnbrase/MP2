// server/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Country  = require('./models/Country');
const UnitType = require('./models/UnitType');
const Resource = require('./models/Resource');

async function runSeed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB for seeding');

  // 1. Seed UnitTypes (won’t duplicate if you use upsert below)
  const units = [
    { name: 'Infantry', costCents: 1000,  attack: 5,  defense: 5,  speed: 10, hp: 20 },
    { name: 'Tank',      costCents: 10000, attack: 20, defense: 20, speed: 5,  hp: 100 },
    { name: 'Plane',     costCents: 20000, attack: 30, defense: 10, speed: 20, hp: 50 },
    { name: 'Missile',   costCents: 50000, attack: 80, defense: 0,  speed: 50, hp: 1  },
    { name: 'Nuke',      costCents:100000, attack:200, defense: 0,  speed:100, hp: 1  }
  ];
  for (const u of units) {
    await UnitType.updateOne(
      { name: u.name },
      { $set: u },
      { upsert: true }
    );
  }
  console.log('🛡️ UnitTypes seeded');

  // 2. Seed Resources for each country
  const countries = await Country.find();
  for (const c of countries) {
    await Resource.updateOne(
      { country: c._id },
      {
        $setOnInsert: {
          country:             c._id,
          moneyCentsPerSecond: 277,   // $2.77/sec ≈ $10000/hr
          oilUnitsPerSecond:   1
        }
      },
      { upsert: true }
    );
  }
  console.log('💰 Resources seeded for', countries.length, 'countries');

  process.exit(0);
}

runSeed().catch(err => {
  console.error(err);
  process.exit(1);
});
