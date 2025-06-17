const request = require('supertest');
const app = require('../index'); // The exported Express app
const mongoose = require('mongoose');
const User = require('../models/User');
const Country = require('../models/Country');
const Diplomacy = require('../models/Diplomacy');

// Mock the authentication middleware
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    // Default mock user for general authenticated routes
    req.user = {
      id: new mongoose.Types.ObjectId().toString(),
      role: 'player',
      country: new mongoose.Types.ObjectId().toString()
    };
    next();
  }),
  presidentialRoleRequired: jest.fn((req, res, next) => {
    // This will be overridden in tests that need a president
    if (req.user && req.user.role === 'president') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Presidential role required.' });
    }
  }),
}));

// Helper function to override mock user for specific tests
const setMockUser = (user) => {
  const auth = require('../middleware/auth');
  auth.authenticate.mockImplementation((req, res, next) => {
    req.user = user;
    next();
  });
  auth.presidentialRoleRequired.mockImplementation((req, res, next) => {
    if (user && user.role === 'president') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Presidential role required.' });
    }
  });
};

describe('Diplomacy API', () => {
  let country1, country2, country3;
  let userPresident1, userPlayer1, userPresident2;

  beforeAll(async () => {
    // Create countries
    country1 = await Country.create({ name: 'CountryA', geojson: {} });
    country2 = await Country.create({ name: 'CountryB', geojson: {} });
    country3 = await Country.create({ name: 'CountryC', geojson: {} }); // For testing invalid target

    // Create users
    userPresident1 = await User.create({ email: 'pres1@test.com', password: 'password', country: country1._id, role: 'president' });
    userPlayer1 = await User.create({ email: 'player1@test.com', password: 'password', country: country1._id, role: 'player' });
    userPresident2 = await User.create({ email: 'pres2@test.com', password: 'password', country: country2._id, role: 'president' });
  });

  afterEach(async () => {
    // Clear diplomacy collection after each test
    await Diplomacy.deleteMany({});
    // Reset mocks if they were changed by setMockUser
     require('../middleware/auth').authenticate.mockClear();
     require('../middleware/auth').presidentialRoleRequired.mockClear();
    // Re-establish default mocks (important if a test changes the implementation)
    const auth = require('../middleware/auth');
    auth.authenticate.mockImplementation((req, res, next) => {
        req.user = {
          id: new mongoose.Types.ObjectId().toString(),
          role: 'player',
          country: new mongoose.Types.ObjectId().toString()
        };
        next();
      });
    auth.presidentialRoleRequired.mockImplementation((req, res, next) => {
        if (req.user && req.user.role === 'president') {
          next();
        } else {
          res.status(403).json({ message: 'Access denied. Presidential role required.' });
        }
      });
  });

  describe('POST /api/diplomacy/propose', () => {
    it('should allow a president to propose diplomacy', async () => {
      setMockUser({ id: userPresident1._id.toString(), role: 'president', country: country1._id.toString() });

      const res = await request(app)
        .post('/api/diplomacy/propose')
        .send({
          targetCountryId: country2._id.toString(),
          proposedStatus: 'alliance',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'pending_alliance');
      expect(res.body.proposedBy.name).toEqual(country1.name); // Check populated name
      expect(res.body.countryA.name).toEqual(country1.name); // countryA should be proposer (sorted)
      expect(res.body.countryB.name).toEqual(country2.name);
    });

    it('should fail if proposer is not a president', async () => {
      setMockUser({ id: userPlayer1._id.toString(), role: 'player', country: country1._id.toString() });

      const res = await request(app)
        .post('/api/diplomacy/propose')
        .send({
          targetCountryId: country2._id.toString(),
          proposedStatus: 'alliance',
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message', 'Access denied. Presidential role required.');
    });

    it('should fail if target country is same as proposer country', async () => {
      setMockUser({ id: userPresident1._id.toString(), role: 'president', country: country1._id.toString() });

      const res = await request(app)
        .post('/api/diplomacy/propose')
        .send({
          targetCountryId: country1._id.toString(), // Proposing to own country
          proposedStatus: 'alliance',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Cannot propose diplomacy with your own country.');
    });

     it('should fail if target country ID is invalid', async () => {
      setMockUser({ id: userPresident1._id.toString(), role: 'president', country: country1._id.toString() });

      const res = await request(app)
        .post('/api/diplomacy/propose')
        .send({
          targetCountryId: 'invalidObjectId',
          proposedStatus: 'alliance',
        });
      // The backend sorts IDs, so it might try to look up "invalidObjectId" as countryA or countryB
      // The findOne for Diplomacy might not fail, but the new Diplomacy object creation
      // or later population might fail. The pre-save hook in Diplomacy.js might also be a factor.
      // Given the current backend logic, the error might come from `findById` on the target country
      // in the route, or when trying to save if it's an invalid ObjectId ref.
      // For now, let's expect a 500 or a more specific error if the backend handles it gracefully.
      // Based on the route code `let diplomacy = await Diplomacy.findOne({ countryA: countryA_id, countryB: countryB_id });`
      // and then potentially creating a new one, the validation of targetCountryId not being a valid country
      // happens during the save or if the code explicitly checks if targetCountryId is a valid country.
      // The current `propose` route does not explicitly check if targetCountryId is a valid *existing* country
      // before attempting to create the diplomacy document, other than sorting. The `populate` would fail.
      // Let's assume a 500 for now, or adjust if the test reveals a more specific error.
      // Update: The sorting logic in the route means `countryA_id` or `countryB_id` will be `invalidObjectId`.
      // `Diplomacy.findOne` will likely not find anything.
      // Then `new Diplomacy(...)` will be called. The `countryB: targetCountryId` will have 'invalidObjectId'.
      // Mongoose might throw a CastError on save.
      expect(res.statusCode).toBeOneOf([400, 500]); // Mongoose CastError usually results in 500 if not caught, or 400 if validation error
      // If it's a CastError to ObjectId failed, it would be a 500 unless a specific error handler sends 400.
    });
  });

  describe('GET /api/diplomacy/my-country', () => {
    it('should return diplomatic relations for the logged-in user\'s country', async () => {
      setMockUser({ id: userPresident1._id.toString(), role: 'president', country: country1._id.toString() });

      // Create a diplomatic relation for country1
      await Diplomacy.create({
        countryA: country1._id,
        countryB: country2._id,
        status: 'alliance',
        proposedBy: country1._id,
        isActive: true,
        acceptedAt: new Date(),
      });

      const res = await request(app).get('/api/diplomacy/my-country');

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].status).toEqual('alliance');
      // Check if countries are populated
      expect(res.body[0].countryA.name).toEqual(country1.name);
      expect(res.body[0].countryB.name).toEqual(country2.name);
    });
  });

  describe('POST /api/diplomacy/:diplomacyId/accept', () => {
    let pendingProposal;

    beforeEach(async () => {
      // Create a pending proposal from country1 to country2
      pendingProposal = await Diplomacy.create({
        countryA: country1._id, // country1 is smaller ID due to sorting in test data
        countryB: country2._id,
        status: 'pending_alliance',
        proposedBy: country1._id, // President of Country1 proposed
        isActive: false,
      });
    });

    it('should allow president of target country (countryB) to accept', async () => {
      setMockUser({ id: userPresident2._id.toString(), role: 'president', country: country2._id.toString() });

      const res = await request(app)
        .post(`/api/diplomacy/${pendingProposal._id}/accept`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('alliance');
      expect(res.body.isActive).toBe(true);
      expect(res.body.acceptedAt).toBeDefined();
    });

    it('should fail if user is not president of the target country', async () => {
      // User is president of country1 (proposing country), cannot accept own proposal
      setMockUser({ id: userPresident1._id.toString(), role: 'president', country: country1._id.toString() });

      const res = await request(app)
        .post(`/api/diplomacy/${pendingProposal._id}/accept`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message', 'You are not authorized to accept this proposal. Only the president of the other country can accept.');
    });

    it('should fail if user is a player, not a president', async () => {
       // A player from country2 trying to accept
      const playerFromCountry2 = await User.create({ email: 'playerC2@test.com', password: 'password', country: country2._id, role: 'player' });
      setMockUser({ id: playerFromCountry2._id.toString(), role: 'player', country: country2._id.toString() });

      const res = await request(app)
        .post(`/api/diplomacy/${pendingProposal._id}/accept`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message', 'Access denied. Presidential role required.');
    });

     it('should fail if diplomacyId is invalid', async () => {
      setMockUser({ id: userPresident2._id.toString(), role: 'president', country: country2._id.toString() });
      const invalidDiplomacyId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/diplomacy/${invalidDiplomacyId}/accept`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Diplomacy proposal not found.');
    });

    it('should fail if proposal is already active', async () => {
      pendingProposal.isActive = true;
      pendingProposal.status = 'alliance';
      await pendingProposal.save();

      setMockUser({ id: userPresident2._id.toString(), role: 'president', country: country2._id.toString() });

      const res = await request(app)
        .post(`/api/diplomacy/${pendingProposal._id}/accept`);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'This proposal is already active.');
    });
  });

  // TODO: Add tests for /reject and /break routes
});

// Helper to check if status code is one of the expected codes
expect.extend({
  toBeOneOf(received, expectedStatusCodes) {
    const pass = expectedStatusCodes.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of [${expectedStatusCodes.join(', ')}]`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of [${expectedStatusCodes.join(', ')}]`,
        pass: false,
      };
    }
  },
});
