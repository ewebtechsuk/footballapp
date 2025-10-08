import { createSelector, createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '..';

export type CommunicationCategory = 'announcement' | 'logistics' | 'lineup' | 'celebration';
export type CommunicationChannel = 'push' | 'email' | 'sms';
export type CommunicationAudience = 'everyone' | 'captains' | 'availablePlayers' | 'trialists';
export type CommunicationStatus = 'draft' | 'scheduled' | 'sent';

export interface CommunicationResponseSummary {
  confirmed: number;
  declined: number;
  awaiting: number;
}

export interface TeamCommunication {
  id: string;
  teamId: string;
  title: string;
  body: string;
  category: CommunicationCategory;
  audience: CommunicationAudience;
  channels: CommunicationChannel[];
  status: CommunicationStatus;
  createdAt: string;
  scheduledFor: string | null;
  followUpReminderMinutes: number | null;
  requiresResponse: boolean;
  responseSummary: CommunicationResponseSummary;
}

interface CommunicationsState {
  communications: TeamCommunication[];
}

const initialState: CommunicationsState = {
  communications: [
    {
      id: 'demo-communication-1',
      teamId: 'demo-team',
      title: 'Training focus for this week',
      body: 'Working on high press shape on Tuesday. Reply if you cannot attend.',
      category: 'announcement',
      audience: 'everyone',
      channels: ['push', 'email'],
      status: 'sent',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      scheduledFor: null,
      followUpReminderMinutes: 1440,
      requiresResponse: true,
      responseSummary: {
        confirmed: 9,
        declined: 1,
        awaiting: 5,
      },
    },
    {
      id: 'demo-communication-2',
      teamId: 'demo-team',
      title: 'Lineup reveal vs Harbour City',
      body: 'Sharing projected starters and kickoff logistics on Friday evening.',
      category: 'lineup',
      audience: 'everyone',
      channels: ['push'],
      status: 'scheduled',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      followUpReminderMinutes: 120,
      requiresResponse: false,
      responseSummary: {
        confirmed: 0,
        declined: 0,
        awaiting: 0,
      },
    },
  ],
};

type ScheduleCommunicationPayload = {
  teamId: string;
  title: string;
  body: string;
  category: CommunicationCategory;
  audience: CommunicationAudience;
  channels: CommunicationChannel[];
  scheduledFor?: string | null;
  followUpReminderMinutes?: number | null;
  requiresResponse?: boolean;
  expectedResponders?: number;
};

type UpdateCommunicationStatusPayload = {
  id: string;
  status: CommunicationStatus;
};

type RecordCommunicationResponsePayload = {
  id: string;
  response: 'confirmed' | 'declined';
};

const communicationsSlice = createSlice({
  name: 'communications',
  initialState,
  reducers: {
    scheduleCommunication: (state, action: PayloadAction<ScheduleCommunicationPayload>) => {
      const {
        teamId,
        title,
        body,
        category,
        audience,
        channels,
        scheduledFor = null,
        followUpReminderMinutes = null,
        requiresResponse = false,
        expectedResponders = 0,
      } = action.payload;

      const nowIso = new Date().toISOString();
      const id = nanoid();

      state.communications.unshift({
        id,
        teamId,
        title,
        body,
        category,
        audience,
        channels,
        status: scheduledFor ? 'scheduled' : 'sent',
        createdAt: nowIso,
        scheduledFor,
        followUpReminderMinutes,
        requiresResponse,
        responseSummary: {
          confirmed: 0,
          declined: 0,
          awaiting: requiresResponse ? Math.max(0, expectedResponders) : 0,
        },
      });
    },
    updateCommunicationStatus: (
      state,
      action: PayloadAction<UpdateCommunicationStatusPayload>,
    ) => {
      const { id, status } = action.payload;
      const communication = state.communications.find((item) => item.id === id);

      if (!communication) {
        return;
      }

      communication.status = status;
      if (status === 'sent') {
        communication.scheduledFor = null;
        communication.createdAt = new Date().toISOString();
      }
    },
    recordCommunicationResponse: (
      state,
      action: PayloadAction<RecordCommunicationResponsePayload>,
    ) => {
      const { id, response } = action.payload;
      const communication = state.communications.find((item) => item.id === id);

      if (!communication || !communication.requiresResponse) {
        return;
      }

      if (response === 'confirmed') {
        communication.responseSummary.confirmed += 1;
      } else {
        communication.responseSummary.declined += 1;
      }

      if (communication.responseSummary.awaiting > 0) {
        communication.responseSummary.awaiting -= 1;
      }
    },
  },
});

export const { scheduleCommunication, updateCommunicationStatus, recordCommunicationResponse } =
  communicationsSlice.actions;

export default communicationsSlice.reducer;

const selectCommunicationsState = (state: RootState) => state.communications;

const selectCommunicationsList = createSelector(
  [selectCommunicationsState],
  (communicationsState) => communicationsState.communications,
);

export const selectCommunicationsForTeam = createSelector(
  [selectCommunicationsList, (_state: RootState, teamId?: string | null) => teamId],
  (communications, teamId) => {
    if (!teamId) {
      return [] as TeamCommunication[];
    }

    return communications
      .filter((communication) => communication.teamId === teamId)
      .slice()
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },
);

export const selectUpcomingCommunicationsForTeam = createSelector(
  [selectCommunicationsForTeam],
  (communications) =>
    communications
      .filter((communication) => communication.status === 'scheduled')
      .slice()
      .sort((a, b) => {
        const aTime = a.scheduledFor ? new Date(a.scheduledFor).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.scheduledFor ? new Date(b.scheduledFor).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }),
);

export const selectCommunicationStatsForTeam = createSelector(
  [selectCommunicationsForTeam],
  (communications) => {
    if (communications.length === 0) {
      return {
        total: 0,
        sent: 0,
        upcoming: 0,
        reminderCount: 0,
        averageResponseRate: 0,
        lastSentAt: null as string | null,
      };
    }

    const sent = communications.filter((communication) => communication.status === 'sent');
    const upcoming = communications.filter((communication) => communication.status === 'scheduled');
    const reminderCount = communications.filter(
      (communication) => communication.followUpReminderMinutes && communication.followUpReminderMinutes > 0,
    ).length;

    const totals = sent.reduce(
      (accumulator, communication) => {
        const { confirmed, declined, awaiting } = communication.responseSummary;
        const total = confirmed + declined + awaiting;
        const responded = confirmed + declined;

        return {
          responded: accumulator.responded + responded,
          total: accumulator.total + total,
        };
      },
      { responded: 0, total: 0 },
    );

    const averageResponseRate = totals.total > 0 ? Math.round((totals.responded / totals.total) * 100) : 0;

    const lastSent = sent
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return {
      total: communications.length,
      sent: sent.length,
      upcoming: upcoming.length,
      reminderCount,
      averageResponseRate,
      lastSentAt: lastSent ? lastSent.createdAt : null,
    };
  },
);
