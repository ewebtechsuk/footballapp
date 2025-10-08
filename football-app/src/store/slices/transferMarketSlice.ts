import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '..';

export type ListingStatus = 'open' | 'closingSoon' | 'closed';

export interface TransferBid {
  id: string;
  teamId: string;
  amount: number;
  createdAt: string;
}

export interface TransferListing {
  id: string;
  playerId: string;
  askingPrice: number;
  currentBid: number;
  closingAt: string;
  status: ListingStatus;
  bids: TransferBid[];
  note: string;
}

export interface ShortlistEntry {
  playerId: string;
  addedAt: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface ScoutingReportSummary {
  playerId: string;
  summary: string;
  recommendedRole: string;
  potentialRating: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TransferMarketState {
  listings: TransferListing[];
  shortlists: Record<string, ShortlistEntry[]>;
  scoutingReports: ScoutingReportSummary[];
}

const initialState: TransferMarketState = {
  listings: [
    {
      id: 'listing-1',
      playerId: 'free-agent-1',
      askingPrice: 85,
      currentBid: 72,
      closingAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
      status: 'closingSoon',
      bids: [
        { id: 'bid-1', teamId: 'team-4', amount: 68, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
        { id: 'bid-2', teamId: 'team-6', amount: 72, createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
      ],
      note: 'Explosive forward comfortable across the front line. Medical passed, agent expects performance bonuses.',
    },
    {
      id: 'listing-2',
      playerId: 'free-agent-3',
      askingPrice: 42,
      currentBid: 0,
      closingAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      status: 'open',
      bids: [],
      note: 'Versatile midfielder capable of filling in at full-back. Strong endurance profile.',
    },
  ],
  shortlists: {
    'team-1': [
      {
        playerId: 'free-agent-1',
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        priority: 'high',
        notes: 'Dream signing. Fits vertical counter-attacking identity.',
      },
      {
        playerId: 'free-agent-2',
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        priority: 'medium',
        notes: 'Need competition for starting goalkeeper role.',
      },
    ],
  },
  scoutingReports: [
    {
      playerId: 'free-agent-1',
      summary: 'Elite sprint speed and cold finishing. Needs tactical structure to shine.',
      recommendedRole: 'Inside forward pressing high',
      potentialRating: 91,
      riskLevel: 'medium',
    },
    {
      playerId: 'free-agent-2',
      summary: 'Penalty specialist with commanding presence. Distribution improving rapidly.',
      recommendedRole: 'Sweeper keeper for possession setups',
      potentialRating: 84,
      riskLevel: 'low',
    },
    {
      playerId: 'free-agent-3',
      summary: 'Two-footed with intelligence to recycle possession or drive through lines when needed.',
      recommendedRole: 'Box-to-box connector in hybrid 3-5-2',
      potentialRating: 86,
      riskLevel: 'low',
    },
  ],
};

const ensureShortlistArray = (state: TransferMarketState, teamId: string) => {
  if (!state.shortlists[teamId]) {
    state.shortlists[teamId] = [];
  }

  return state.shortlists[teamId];
};

const transferMarketSlice = createSlice({
  name: 'transferMarket',
  initialState,
  reducers: {
    toggleShortlistEntry: (
      state,
      action: PayloadAction<{ teamId: string; playerId: string; priority?: ShortlistEntry['priority']; notes?: string }>,
    ) => {
      const { teamId, playerId, priority = 'medium', notes } = action.payload;
      const shortlist = ensureShortlistArray(state, teamId);
      const existingIndex = shortlist.findIndex((entry) => entry.playerId === playerId);

      if (existingIndex >= 0) {
        shortlist.splice(existingIndex, 1);
        return;
      }

      shortlist.push({
        playerId,
        addedAt: new Date().toISOString(),
        priority,
        notes,
      });
    },
    updateShortlistPriority: (
      state,
      action: PayloadAction<{ teamId: string; playerId: string; priority: ShortlistEntry['priority'] }>,
    ) => {
      const shortlist = ensureShortlistArray(state, action.payload.teamId);
      const entry = shortlist.find((item) => item.playerId === action.payload.playerId);
      if (!entry) {
        return;
      }

      entry.priority = action.payload.priority;
    },
    placeTransferBid: (
      state,
      action: PayloadAction<{ listingId: string; teamId: string; amount: number }>,
    ) => {
      const { listingId, teamId, amount } = action.payload;
      const listing = state.listings.find((item) => item.id === listingId);
      if (!listing || listing.status === 'closed') {
        return;
      }

      const bidAmount = Math.max(amount, listing.currentBid + 1);

      listing.currentBid = bidAmount;
      listing.bids.unshift({
        id: nanoid(),
        teamId,
        amount: bidAmount,
        createdAt: new Date().toISOString(),
      });

      if (listing.closingAt < new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString()) {
        listing.status = 'closingSoon';
      }
    },
    updateListingStatus: (state, action: PayloadAction<{ listingId: string; status: ListingStatus }>) => {
      const listing = state.listings.find((item) => item.id === action.payload.listingId);
      if (!listing) {
        return;
      }

      listing.status = action.payload.status;
    },
  },
});

export const { toggleShortlistEntry, updateShortlistPriority, placeTransferBid, updateListingStatus } =
  transferMarketSlice.actions;

export const selectTransferListings = (state: RootState): TransferListing[] => state.transferMarket.listings;

export const selectShortlistForTeam = (state: RootState, teamId: string | null | undefined): ShortlistEntry[] => {
  if (!teamId) {
    return [];
  }

  return state.transferMarket.shortlists[teamId] ?? [];
};

export const selectScoutingReportForPlayer = (
  state: RootState,
  playerId: string,
): ScoutingReportSummary | undefined => state.transferMarket.scoutingReports.find((item) => item.playerId === playerId);

export default transferMarketSlice.reducer;
