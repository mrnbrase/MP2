const mongoose = require('mongoose');
// MONGO_URL is set by @shelf/jest-mongodb
// Or, if not using the preset directly for connection:
// const { MongoMemoryServer } = require('mongodb-memory-server');
// let mongoServer;

beforeAll(async () => {
  // If not using the preset's auto-connection or needing more control:
  // mongoServer = await MongoMemoryServer.create();
  // const mongoUri = mongoServer.getUri();
  // process.env.MONGO_URI_TEST = mongoUri; // Store for access in tests if needed

  // The preset @shelf/jest-mongodb should set process.env.MONGO_URL
  // If it doesn't, or if you need to customize, you might need to manually set it up.
  // For now, assume process.env.MONGO_URL is available from the preset.
  if (!process.env.MONGO_URL) {
    console.warn("MONGO_URL not set by @shelf/jest-mongodb preset. Tests might fail to connect to DB.");
    // Fallback or error if necessary, for now, we proceed and hope the preset handles it.
  }

  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB for testing:', err);
    process.exit(1); // Exit if DB connection fails, as tests will be useless
  }
});

afterEach(async () => {
  // Clean up the database after each test to ensure test isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  // If manually started MongoMemoryServer:
  // if (mongoServer) {
  //   await mongoServer.stop();
  // }
});
