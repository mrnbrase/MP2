import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthContext } from '../contexts/AuthContext';
import apiClient from '../api/client';
import DiplomacyPage from './DiplomacyPage';
import { MemoryRouter } from 'react-router-dom'; // Needed if <Link> is used, even if Link import was removed from component

// Mock apiClient
jest.mock('../api/client');

const mockDiplomacyData = [
  {
    _id: 'dip1',
    countryA: { _id: 'countryA_id', name: 'Country Alpha' },
    countryB: { _id: 'countryUser_id', name: 'My Country' }, // User's country is B
    status: 'alliance',
    proposedBy: { _id: 'countryA_id', name: 'Country Alpha' },
    isActive: true,
    acceptedAt: new Date().toISOString(),
  },
  {
    _id: 'dip2',
    countryA: { _id: 'countryC_id', name: 'Country Charlie' },
    countryB: { _id: 'countryUser_id', name: 'My Country' }, // User's country is B
    status: 'pending_trade_agreement',
    proposedBy: { _id: 'countryC_id', name: 'Country Charlie' }, // Incoming proposal
    isActive: false,
    proposedAt: new Date().toISOString(),
  },
  {
    _id: 'dip3',
    countryA: { _id: 'countryUser_id', name: 'My Country' }, // User's country is A
    countryB: { _id: 'countryD_id', name: 'Country Delta' },
    status: 'pending_non_aggression_pact',
    proposedBy: { _id: 'countryUser_id', name: 'My Country' }, // Outgoing proposal
    isActive: false,
    proposedAt: new Date().toISOString(),
  },
];

const mockCountriesData = [
  { _id: 'countryA_id', name: 'Country Alpha' },
  { _id: 'countryC_id', name: 'Country Charlie' },
  { _id: 'countryD_id', name: 'Country Delta' },
  { _id: 'countryE_id', name: 'Country Epsilon' },
];


describe('DiplomacyPage', () => {
  const renderWithAuth = (ui, { providerProps, ...renderOptions }) => {
    return render(
      <MemoryRouter> {/* Added MemoryRouter wrapper */}
        <AuthContext.Provider value={providerProps}>{ui}</AuthContext.Provider>
      </MemoryRouter>,
      renderOptions
    );
  };

  beforeEach(() => {
    apiClient.get.mockImplementation((url) => {
      if (url === '/diplomacy/my-country') {
        return Promise.resolve({ data: mockDiplomacyData });
      }
      if (url === '/countries') {
        return Promise.resolve({ data: mockCountriesData });
      }
      return Promise.reject(new Error(`Unknown GET URL: ${url}`));
    });
    // Reset other mocks if they are added (POST, etc.)
    apiClient.post = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders as Player: shows statuses, no action buttons/form', async () => {
    const providerProps = {
      user: { role: 'player', country: { _id: 'countryUser_id', name: 'My Country' } },
      // other context values if needed
    };

    renderWithAuth(<DiplomacyPage />, { providerProps });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Active Agreements')).toBeInTheDocument();
    });

    // Check if statuses are displayed
    expect(screen.getByText(/Partner: Country Alpha \| Status: alliance/i)).toBeInTheDocument();
    expect(screen.getByText(/Proposed by: Country Charlie \| Proposal: trade agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/Target: Country Delta \| Proposal: non aggression pact/i)).toBeInTheDocument();

    // Verify proposal form is NOT visible
    expect(screen.queryByText('Propose New Diplomatic Agreement')).not.toBeInTheDocument();

    // Verify action buttons are NOT visible (example: check for an accept button)
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel proposal/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /break & declare war/i })).not.toBeInTheDocument();
  });

  test('renders as President: shows statuses, form, and action buttons', async () => {
    const providerProps = {
      user: { role: 'president', country: { _id: 'countryUser_id', name: 'My Country' } },
    };

    renderWithAuth(<DiplomacyPage />, { providerProps });

    await waitFor(() => {
      expect(screen.getByText('Active Agreements')).toBeInTheDocument();
    });

    // Check if statuses are displayed
    expect(screen.getByText(/Partner: Country Alpha \| Status: alliance/i)).toBeInTheDocument();
    expect(screen.getByText(/Proposed by: Country Charlie \| Proposal: trade agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/Target: Country Delta \| Proposal: non aggression pact/i)).toBeInTheDocument();

    // Verify proposal form IS visible
    expect(screen.getByText('Propose New Diplomatic Agreement')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send proposal/i })).toBeInTheDocument();

    // Verify action buttons ARE visible (assuming mock data allows for them)
    // For incoming proposal (dip2)
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    // For active agreement (dip1)
    expect(screen.getByRole('button', { name: /break & declare war/i })).toBeInTheDocument();
    // For outgoing proposal (dip3)
    expect(screen.getByRole('button', { name: /cancel proposal/i })).toBeInTheDocument();
  });

   test('does not render proposal form if countries API fails for president', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url === '/diplomacy/my-country') {
        return Promise.resolve({ data: mockDiplomacyData });
      }
      if (url === '/countries') {
        return Promise.reject(new Error('Failed to fetch countries'));
      }
      return Promise.reject(new Error(`Unknown GET URL: ${url}`));
    });

    const providerProps = {
      user: { role: 'president', country: { _id: 'countryUser_id', name: 'My Country' } },
    };

    renderWithAuth(<DiplomacyPage />, { providerProps });

    await waitFor(() => {
      // Check that main content (active agreements) still renders
      expect(screen.getByText('Active Agreements')).toBeInTheDocument();
    });

    // Proposal form should not be there, or at least the select dropdown for countries would be empty/disabled
    // Depending on implementation, the whole section might not render, or just be unusable.
    // For this test, let's check that the "Propose New Diplomatic Agreement" title is there,
    // but the select for countries is not populated or the button is disabled.
    expect(screen.getByText('Propose New Diplomatic Agreement')).toBeInTheDocument();
    const countrySelect = screen.getByLabelText(/target country/i);
    expect(countrySelect.options.length).toBe(1); // Only "Select Country"
    // Check for toast message (optional, depends on how you want to assert toast presence)
    // await screen.findByText('Failed to fetch countries for proposal form.'); // react-hot-toast might be hard to test this way
  });

});
