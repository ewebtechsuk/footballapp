import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '..';

export interface HighlightClip {
  id: string;
  teamId: string;
  title: string;
  videoUrl: string;
  submittedBy: string;
  submittedAt: string;
  votes: number;
  tags: string[];
  featured?: boolean;
}

export interface WeeklyReel {
  id: string;
  title: string;
  description: string;
  clipIds: string[];
  publishedAt: string;
}

export interface FeaturedBroadcast {
  id: string;
  title: string;
  scheduledFor: string;
  streamUrl: string;
  summary: string;
  host: string;
}

export interface MediaState {
  clips: HighlightClip[];
  reels: WeeklyReel[];
  featuredBroadcast: FeaturedBroadcast | null;
}

const initialState: MediaState = {
  clips: [
    {
      id: 'clip-1',
      teamId: 'team-1',
      title: 'Last-minute overhead kick',
      videoUrl: 'https://video.football.app/clips/overhead-kick',
      submittedBy: 'coach.alex',
      submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      votes: 182,
      tags: ['goal', 'match-of-the-week'],
      featured: true,
    },
    {
      id: 'clip-2',
      teamId: 'team-2',
      title: 'Goalkeeper heroics in stoppage time',
      videoUrl: 'https://video.football.app/clips/keeper-heroics',
      submittedBy: 'gk.coach',
      submittedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      votes: 134,
      tags: ['save'],
    },
    {
      id: 'clip-3',
      teamId: 'team-3',
      title: 'Team tiki-taka build-up',
      videoUrl: 'https://video.football.app/clips/tiki-taka',
      submittedBy: 'analyst.maria',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      votes: 98,
      tags: ['build-up'],
    },
  ],
  reels: [
    {
      id: 'reel-1',
      title: 'Match of the Week',
      description: 'Metro FC vs Kingston Strikers – crunch semi-final with live commentary.',
      clipIds: ['clip-1', 'clip-3'],
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: 'reel-2',
      title: 'Goal of the Month finalists',
      description: 'Top 5 strikes picked by the community.',
      clipIds: ['clip-1'],
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ],
  featuredBroadcast: {
    id: 'broadcast-1',
    title: 'Semi-final live studio show',
    scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    streamUrl: 'https://video.football.app/live/semi-final',
    summary: 'Analysts break down key moments with access to match telemetry.',
    host: 'Football App Live',
  },
};

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    submitHighlightClip: (
      state,
      action: PayloadAction<{ teamId: string; title: string; videoUrl: string; tags?: string[]; submittedBy: string }>,
    ) => {
      state.clips.unshift({
        id: nanoid(),
        teamId: action.payload.teamId,
        title: action.payload.title,
        videoUrl: action.payload.videoUrl,
        tags: action.payload.tags ?? [],
        submittedBy: action.payload.submittedBy,
        submittedAt: new Date().toISOString(),
        votes: 0,
      });
    },
    voteForClip: (state, action: PayloadAction<{ clipId: string }>) => {
      const clip = state.clips.find((item) => item.id === action.payload.clipId);
      if (!clip) {
        return;
      }

      clip.votes += 1;
    },
    scheduleBroadcast: (
      state,
      action: PayloadAction<{ title: string; scheduledFor: string; streamUrl: string; summary: string; host: string }>,
    ) => {
      state.featuredBroadcast = {
        id: nanoid(),
        ...action.payload,
      };
    },
  },
});

export const { submitHighlightClip, voteForClip, scheduleBroadcast } = mediaSlice.actions;

export const selectHighlightClips = (state: RootState): HighlightClip[] => state.media.clips;

export const selectWeeklyReels = (state: RootState): WeeklyReel[] => state.media.reels;

export const selectFeaturedBroadcast = (state: RootState): FeaturedBroadcast | null =>
  state.media.featuredBroadcast;

export default mediaSlice.reducer;
