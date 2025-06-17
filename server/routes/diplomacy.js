const express = require('express');
const router = express.Router();
const Diplomacy = require('../models/Diplomacy');
const Country = require('../models/Country');
const User = require('../models/User'); // Needed to find user's country and role
const { authenticate, presidentialRoleRequired } = require('../middleware/auth'); // Assuming auth middleware provides these

// Mount auth middleware for all diplomacy routes
router.use(authenticate);

// Route to propose or update a diplomatic status
router.post('/propose', presidentialRoleRequired, async (req, res) => {
  try {
    const { targetCountryId, proposedStatus } = req.body;
    const proposerUserId = req.user.id; // From auth middleware

    if (!targetCountryId || !proposedStatus) {
      return res.status(400).json({ message: 'Target country ID and proposed status are required.' });
    }

    const validStatuses = ['alliance', 'non_aggression_pact', 'trade_agreement', 'war'];
    const validPendingStatuses = ['pending_alliance', 'pending_non_aggression_pact', 'pending_trade_agreement'];

    if (!validStatuses.includes(proposedStatus)) {
      return res.status(400).json({ message: 'Invalid proposed status.' });
    }

    // Find proposer's country
    const proposerUser = await User.findById(proposerUserId).populate('country');
    if (!proposerUser || !proposerUser.country) {
      return res.status(404).json({ message: 'Proposer country not found.' });
    }
    const proposerCountryId = proposerUser.country._id;

    if (proposerCountryId.toString() === targetCountryId) {
      return res.status(400).json({ message: 'Cannot propose diplomacy with your own country.' });
    }

    // Determine countryA and countryB (sorted lexicographically)
    let countryA_id = proposerCountryId;
    let countryB_id = targetCountryId;
    if (proposerCountryId.toString() > targetCountryId.toString()) {
      countryA_id = targetCountryId;
      countryB_id = proposerCountryId;
    }

    let diplomacy = await Diplomacy.findOne({ countryA: countryA_id, countryB: countryB_id });

    const finalStatus = proposedStatus === 'war' ? 'war' : `pending_${proposedStatus}`;

    if (diplomacy) {
      // Existing relationship
      if (diplomacy.isActive) {
        if (proposedStatus === 'war') {
          diplomacy.status = 'war';
          diplomacy.proposedBy = proposerCountryId;
          diplomacy.proposedAt = Date.now();
          diplomacy.isActive = true; // War is immediate
          diplomacy.acceptedAt = Date.now(); // War doesn't need acceptance in this model
          diplomacy.terminatedAt = null;
        } else {
          // Prevent new proposals if an active one exists (unless it's war)
          return res.status(400).json({ message: 'An active diplomatic agreement already exists. It must be broken before proposing a new one (unless declaring war).' });
        }
      } else {
        // Pending proposal exists, update it
        diplomacy.status = finalStatus;
        diplomacy.proposedBy = proposerCountryId;
        diplomacy.proposedAt = Date.now();
        diplomacy.isActive = false;
        diplomacy.acceptedAt = null;
        diplomacy.terminatedAt = null;
      }
    } else {
      // New diplomacy document
      diplomacy = new Diplomacy({
        countryA: countryA_id,
        countryB: countryB_id,
        status: finalStatus,
        proposedBy: proposerCountryId,
        isActive: false,
      });
      if (proposedStatus === 'war') { // War is immediate
        diplomacy.isActive = true;
        diplomacy.acceptedAt = Date.now();
      }
    }

    await diplomacy.save();
    // Populate country details for the response
    diplomacy = await Diplomacy.findById(diplomacy._id).populate('countryA countryB proposedBy', 'name');
    return res.status(200).json(diplomacy);

  } catch (error) {
    console.error('Error in /api/diplomacy/propose:', error);
    return res.status(500).json({ message: 'Server error proposing diplomacy.', error: error.message });
  }
});

// Route to break an active agreement or change war status
router.post('/:diplomacyId/break', presidentialRoleRequired, async (req, res) => {
  try {
    const { diplomacyId } = req.params;
    const breakerUserId = req.user.id;

    const diplomacy = await Diplomacy.findById(diplomacyId);

    if (!diplomacy) {
      return res.status(404).json({ message: 'Diplomacy agreement not found.' });
    }

    if (!diplomacy.isActive) {
      return res.status(400).json({ message: 'This agreement is not active and cannot be broken.' });
    }

    // Find breaker's country
    const breakerUser = await User.findById(breakerUserId).populate('country');
    if (!breakerUser || !breakerUser.country) {
      return res.status(404).json({ message: 'Breaker country not found.' });
    }
    const breakerCountryId = breakerUser.country._id;

    // Ensure the user is president of one of the involved countries
    if (!(diplomacy.countryA.equals(breakerCountryId) || diplomacy.countryB.equals(breakerCountryId))) {
      return res.status(403).json({ message: 'You are not authorized to break this agreement. Only presidents of involved countries can do so.' });
    }

    if (diplomacy.status !== 'war') {
      // Breaking a non-war pact (e.g., alliance, trade_agreement) means declaring war
      diplomacy.status = 'war';
      diplomacy.proposedBy = breakerCountryId; // The country breaking the pact is initiating the war
      // isActive remains true for war
      diplomacy.terminatedAt = Date.now(); // Marks when the previous pact was broken
      diplomacy.acceptedAt = Date.now(); // War is immediate, no separate acceptance needed for this transition
    } else {
      // Current status is 'war', breaking it means moving to 'neutral' (ending the war)
      diplomacy.status = 'neutral';
      diplomacy.proposedBy = breakerCountryId; // The country initiating peace
      diplomacy.isActive = false; // Neutral is not an 'active' pact in the same way, more like a default state after war.
                                 // Or, if 'neutral' should be an active state, this could be true.
                                 // For now, setting to false as per initial thought of ending active conflict.
      diplomacy.terminatedAt = Date.now(); // Marks when the war ended
    }

    await diplomacy.save();
    const populatedDiplomacy = await Diplomacy.findById(diplomacy._id).populate('countryA countryB proposedBy', 'name');
    return res.status(200).json(populatedDiplomacy);

  } catch (error) {
    console.error('Error in /api/diplomacy/:diplomacyId/break:', error);
    return res.status(500).json({ message: 'Server error breaking diplomacy agreement.', error: error.message });
  }
});

// Route to get all diplomatic statuses for the user's country
router.get('/my-country', async (req, res) => { // No presidentialRoleRequired, just authenticated user
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate('country');
    if (!user || !user.country) {
      return res.status(404).json({ message: 'User or user country not found.' });
    }
    const userCountryId = user.country._id;

    const diplomacies = await Diplomacy.find({
      $or: [{ countryA: userCountryId }, { countryB: userCountryId }]
    })
    .populate('countryA', 'name')
    .populate('countryB', 'name')
    .populate('proposedBy', 'name');

    if (!diplomacies) {
      return res.status(404).json({ message: 'No diplomatic relations found for your country.' });
    }

    return res.status(200).json(diplomacies);

  } catch (error) {
    console.error('Error in /api/diplomacy/my-country:', error);
    return res.status(500).json({ message: 'Server error fetching diplomatic statuses.', error: error.message });
  }
});

// Route to reject or cancel a diplomatic proposal
router.post('/:diplomacyId/reject', presidentialRoleRequired, async (req, res) => {
  try {
    const { diplomacyId } = req.params;
    const rejecterUserId = req.user.id;

    const diplomacy = await Diplomacy.findById(diplomacyId);

    if (!diplomacy) {
      return res.status(404).json({ message: 'Diplomacy proposal not found.' });
    }

    if (diplomacy.isActive) {
      return res.status(400).json({ message: 'Cannot reject an active agreement. It must be broken.' });
    }

    if (!diplomacy.status.startsWith('pending_')) {
      return res.status(400).json({ message: 'This is not a pending proposal, so it cannot be rejected.' });
    }

    // Find rejecter's country
    const rejecterUser = await User.findById(rejecterUserId).populate('country');
    if (!rejecterUser || !rejecterUser.country) {
      return res.status(404).json({ message: 'Rejecter country not found.' });
    }
    const rejecterCountryId = rejecterUser.country._id;

    // President of either countryA or countryB can reject.
    // Or, more specifically, the proposer (who could be president of A or B)
    // or the president of the country that is NOT the proposer can reject.
    const isProposer = diplomacy.proposedBy.equals(rejecterCountryId);
    const isTargetCountryPresident = (diplomacy.countryA.equals(rejecterCountryId) && !diplomacy.proposedBy.equals(diplomacy.countryA)) ||
                                 (diplomacy.countryB.equals(rejecterCountryId) && !diplomacy.proposedBy.equals(diplomacy.countryB));


    if (!isProposer && !isTargetCountryPresident) {
      return res.status(403).json({ message: 'You are not authorized to reject this proposal. Only presidents of involved countries can reject.' });
    }

    // If the rejector is not the original proposer, then they must be the president of the other country.
    // The logic above already covers this:
    // - If rejecter is proposer, they can cancel.
    // - If rejecter is not proposer, they must be president of the other country (countryA or countryB that is not proposedBy)

    await Diplomacy.findByIdAndDelete(diplomacyId);

    return res.status(200).json({ message: 'Diplomacy proposal rejected successfully.' });

  } catch (error) {
    console.error('Error in /api/diplomacy/:diplomacyId/reject:', error);
    return res.status(500).json({ message: 'Server error rejecting diplomacy proposal.', error: error.message });
  }
});

// Route to accept a diplomatic proposal
router.post('/:diplomacyId/accept', presidentialRoleRequired, async (req, res) => {
  try {
    const { diplomacyId } = req.params;
    const accepterUserId = req.user.id;

    const diplomacy = await Diplomacy.findById(diplomacyId);

    if (!diplomacy) {
      return res.status(404).json({ message: 'Diplomacy proposal not found.' });
    }

    // Find accepter's country
    const accepterUser = await User.findById(accepterUserId).populate('country');
    if (!accepterUser || !accepterUser.country) {
      return res.status(404).json({ message: 'Accepter country not found.' });
    }
    const accepterCountryId = accepterUser.country._id;

    // Ensure the accepter is countryB (the one who didn't propose) and the proposal was made by countryA
    // The pre-save hook ensures countryA < countryB, so proposedBy determines who initiated.
    // If proposedBy is countryA, then countryB must accept.
    // If proposedBy is countryB, then countryA must accept.
    if (!((diplomacy.proposedBy.equals(diplomacy.countryA) && accepterCountryId.equals(diplomacy.countryB)) ||
          (diplomacy.proposedBy.equals(diplomacy.countryB) && accepterCountryId.equals(diplomacy.countryA)))) {
      return res.status(403).json({ message: 'You are not authorized to accept this proposal. Only the president of the other country can accept.' });
    }

    if (diplomacy.isActive) {
      return res.status(400).json({ message: 'This proposal is already active.' });
    }

    if (!diplomacy.status.startsWith('pending_')) {
      return res.status(400).json({ message: 'This is not a pending proposal.' });
    }

    // Update status from pending_type to type
    const activeStatus = diplomacy.status.replace('pending_', '');
    if (!['alliance', 'non_aggression_pact', 'trade_agreement'].includes(activeStatus)) {
        return res.status(400).json({ message: 'Invalid pending status for activation.'});
    }

    diplomacy.status = activeStatus;
    diplomacy.isActive = true;
    diplomacy.acceptedAt = Date.now();
    diplomacy.terminatedAt = null; // Clear any previous termination date

    await diplomacy.save();
    const populatedDiplomacy = await Diplomacy.findById(diplomacy._id).populate('countryA countryB proposedBy', 'name');
    return res.status(200).json(populatedDiplomacy);

  } catch (error) {
    console.error('Error in /api/diplomacy/:diplomacyId/accept:', error);
    return res.status(500).json({ message: 'Server error accepting diplomacy proposal.', error: error.message });
  }
});

module.exports = router;
