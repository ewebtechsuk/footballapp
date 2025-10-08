import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

export type ChatBackend = 'firebase' | 'stream' | 'appsync';

export type ChatAttachment = {
  id: string;
  type: 'image' | 'file' | 'link';
  url: string;
  title?: string;
};

export type ChatReaction = {
  id: string;
  emoji: string;
  memberId: string;
  createdAt: string;
};

export type ChatPollOption = {
  id: string;
  label: string;
  votes: string[];
};

export type ChatPoll = {
  id: string;
  question: string;
  createdAt: string;
  closesAt?: string;
  options: ChatPollOption[];
  closed: boolean;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  replyToId?: string;
  reactions: ChatReaction[];
  attachments: ChatAttachment[];
  pollId?: string;
};

export type ChatThreadType = 'kit' | 'matchday' | 'announcement' | 'direct';

export type ChatThread = {
  id: string;
  teamId: string;
  title: string;
  type: ChatThreadType;
  createdAt: string;
  createdBy: string;
  messages: ChatMessage[];
  polls: ChatPoll[];
  pinnedMessageIds: string[];
  muted: boolean;
  resolved: boolean;
  metadata?: {
    relatedKitProjectId?: string;
    lastSupplierUpdate?: string;
  };
  lastActivityAt: string;
};

export type AuditLogEntry = {
  id: string;
  teamId: string;
  actor: string;
  action: string;
  createdAt: string;
  threadId?: string;
  context?: Record<string, string>;
};

export type CachedThreadMessages = {
  threadId: string;
  cachedAt: string;
  messages: ChatMessage[];
};

export type TeamChatState = {
  backend: ChatBackend;
  connected: boolean;
  lastSyncedAt: string | null;
  threads: ChatThread[];
  cached: CachedThreadMessages[];
  offlineQueue: ChatMessage[];
  auditLog: AuditLogEntry[];
};

const initialState: TeamChatState = {
  backend: 'firebase',
  connected: true,
  lastSyncedAt: null,
  threads: [],
  cached: [],
  offlineQueue: [],
  auditLog: [],
};

const findThread = (state: TeamChatState, threadId: string) =>
  state.threads.find((thread) => thread.id === threadId);

const teamChatSlice = createSlice({
  name: 'teamChat',
  initialState,
  reducers: {
    setRealtimeBackend: (state, action: PayloadAction<{ backend: ChatBackend }>) => {
      state.backend = action.payload.backend;
    },
    setRealtimeConnection: (state, action: PayloadAction<{ connected: boolean }>) => {
      state.connected = action.payload.connected;
      state.lastSyncedAt = action.payload.connected ? new Date().toISOString() : state.lastSyncedAt;
    },
    createContextualThread: (
      state,
      action: PayloadAction<{ teamId: string; title: string; type: ChatThreadType; createdBy: string; metadata?: ChatThread['metadata'] }>,
    ) => {
      const { teamId, title, type, createdBy, metadata } = action.payload;
      const existing = state.threads.find(
        (thread) => thread.teamId === teamId && thread.type === type && thread.title === title,
      );

      if (existing) {
        return;
      }

      const now = new Date().toISOString();
      state.threads.push({
        id: nanoid(),
        teamId,
        title,
        type,
        createdAt: now,
        createdBy,
        messages: [],
        polls: [],
        pinnedMessageIds: [],
        muted: false,
        resolved: false,
        metadata,
        lastActivityAt: now,
      });
    },
    linkThreadMetadata: (
      state,
      action: PayloadAction<{ threadId: string; metadata: ChatThread['metadata'] }>,
    ) => {
      const { threadId, metadata } = action.payload;
      const thread = findThread(state, threadId);
      if (!thread) {
        return;
      }

      thread.metadata = {
        ...thread.metadata,
        ...metadata,
      };
      thread.lastActivityAt = new Date().toISOString();
    },
    postMessage: (
      state,
      action: PayloadAction<{ threadId: string; senderId: string; senderName: string; body: string; replyToId?: string; attachments?: ChatAttachment[] }>,
    ) => {
      const { threadId, senderId, senderName, body, replyToId, attachments } = action.payload;
      const thread = findThread(state, threadId);
      if (!thread) {
        return;
      }

      const message: ChatMessage = {
        id: nanoid(),
        threadId,
        senderId,
        senderName,
        body,
        createdAt: new Date().toISOString(),
        replyToId,
        attachments: attachments ?? [],
        reactions: [],
      };

      if (!state.connected) {
        state.offlineQueue.push(message);
      }

      thread.messages.push(message);
      thread.lastActivityAt = message.createdAt;

      state.auditLog.push({
        id: nanoid(),
        teamId: thread.teamId,
        actor: senderName,
        action: 'posted_message',
        createdAt: message.createdAt,
        threadId,
        context: { body: body.slice(0, 120) },
      });
    },
    addReaction: (
      state,
      action: PayloadAction<{ threadId: string; messageId: string; memberId: string; emoji: string }>,
    ) => {
      const { threadId, messageId, memberId, emoji } = action.payload;
      const thread = findThread(state, threadId);
      if (!thread) {
        return;
      }

      const message = thread.messages.find((candidate) => candidate.id === messageId);
      if (!message) {
        return;
      }

      const existingReaction = message.reactions.find(
        (reaction) => reaction.memberId === memberId && reaction.emoji === emoji,
      );

      if (existingReaction) {
        return;
      }

      message.reactions.push({
        id: nanoid(),
        emoji,
        memberId,
        createdAt: new Date().toISOString(),
      });

      thread.lastActivityAt = new Date().toISOString();
    },
    createPoll: (
      state,
      action: PayloadAction<{ threadId: string; question: string; options: string[]; closesAt?: string }>,
    ) => {
      const { threadId, question, options, closesAt } = action.payload;
      const thread = findThread(state, threadId);
      if (!thread) {
        return;
      }

      const poll: ChatPoll = {
        id: nanoid(),
        question,
        createdAt: new Date().toISOString(),
        closesAt,
        options: options.map((option) => ({ id: nanoid(), label: option, votes: [] })),
        closed: false,
      };

      thread.polls.push(poll);
      thread.lastActivityAt = poll.createdAt;
    },
    voteOnPoll: (
      state,
      action: PayloadAction<{ threadId: string; pollId: string; optionId: string; memberId: string }>,
    ) => {
      const { threadId, pollId, optionId, memberId } = action.payload;
      const thread = findThread(state, threadId);
      if (!thread) {
        return;
      }

      const poll = thread.polls.find((candidate) => candidate.id === pollId);
      if (!poll || poll.closed) {
        return;
      }

      poll.options = poll.options.map((option) => {
        const filteredVotes = option.votes.filter((vote) => vote !== memberId);
        if (option.id === optionId) {
          return { ...option, votes: [...filteredVotes, memberId] };
        }

        return { ...option, votes: filteredVotes };
      });

      thread.lastActivityAt = new Date().toISOString();
    },
    closePoll: (state, action: PayloadAction<{ threadId: string; pollId: string }>) => {
      const { threadId, pollId } = action.payload;
      const thread = findThread(state, threadId);
      if (!thread) {
        return;
      }

      const poll = thread.polls.find((candidate) => candidate.id === pollId);
      if (!poll) {
        return;
      }

      poll.closed = true;
      thread.lastActivityAt = new Date().toISOString();
    },
    pinMessage: (state, action: PayloadAction<{ threadId: string; messageId: string }>) => {
      const { threadId, messageId } = action.payload;
      const thread = findThread(state, threadId);
      if (!thread) {
        return;
      }

      if (!thread.pinnedMessageIds.includes(messageId)) {
        thread.pinnedMessageIds.push(messageId);
      }
      thread.lastActivityAt = new Date().toISOString();
    },
    removeMessage: (state, action: PayloadAction<{ threadId: string; messageId: string; actor: string }>) => {
      const { threadId, messageId, actor } = action.payload;
      const thread = findThread(state, threadId);
      if (!thread) {
        return;
      }

      thread.messages = thread.messages.filter((message) => message.id !== messageId);
      thread.pinnedMessageIds = thread.pinnedMessageIds.filter((id) => id !== messageId);
      thread.lastActivityAt = new Date().toISOString();

      state.auditLog.push({
        id: nanoid(),
        teamId: thread.teamId,
        actor,
        action: 'deleted_message',
        createdAt: new Date().toISOString(),
        threadId,
        context: { messageId },
      });
    },
    muteThread: (state, action: PayloadAction<{ threadId: string; muted: boolean }>) => {
      const { threadId, muted } = action.payload;
      const thread = findThread(state, threadId);
      if (!thread) {
        return;
      }

      thread.muted = muted;
      thread.lastActivityAt = new Date().toISOString();
    },
    markThreadResolved: (state, action: PayloadAction<{ threadId: string; resolved: boolean }>) => {
      const { threadId, resolved } = action.payload;
      const thread = findThread(state, threadId);
      if (!thread) {
        return;
      }

      thread.resolved = resolved;
      thread.lastActivityAt = new Date().toISOString();
    },
    cacheRecentMessages: (state, action: PayloadAction<{ threadId: string; limit?: number }>) => {
      const { threadId, limit = 50 } = action.payload;
      const thread = findThread(state, threadId);
      if (!thread) {
        return;
      }

      const cachedMessages: CachedThreadMessages = {
        threadId,
        cachedAt: new Date().toISOString(),
        messages: thread.messages.slice(-limit),
      };

      const existingIndex = state.cached.findIndex((entry) => entry.threadId === threadId);
      if (existingIndex >= 0) {
        state.cached[existingIndex] = cachedMessages;
      } else {
        state.cached.push(cachedMessages);
      }
    },
    compressThreadHistory: (state, action: PayloadAction<{ threadId: string; keepLatest?: number }>) => {
      const { threadId, keepLatest = 100 } = action.payload;
      const thread = findThread(state, threadId);
      if (!thread) {
        return;
      }

      if (thread.messages.length > keepLatest) {
        thread.messages = thread.messages.slice(-keepLatest);
      }
    },
    flushOfflineQueue: (state) => {
      if (state.offlineQueue.length === 0) {
        return;
      }

      state.offlineQueue = [];
      state.lastSyncedAt = new Date().toISOString();
    },
    appendAuditLog: (
      state,
      action: PayloadAction<{ teamId: string; actor: string; action: string; context?: Record<string, string> }>,
    ) => {
      state.auditLog.push({
        id: nanoid(),
        teamId: action.payload.teamId,
        actor: action.payload.actor,
        action: action.payload.action,
        createdAt: new Date().toISOString(),
        context: action.payload.context,
      });
    },
  },
});

export const {
  setRealtimeBackend,
  setRealtimeConnection,
  createContextualThread,
  linkThreadMetadata,
  postMessage,
  addReaction,
  createPoll,
  voteOnPoll,
  closePoll,
  pinMessage,
  removeMessage,
  muteThread,
  markThreadResolved,
  cacheRecentMessages,
  compressThreadHistory,
  flushOfflineQueue,
  appendAuditLog,
} = teamChatSlice.actions;

export const selectThreadsByTeam = (state: { teamChat: TeamChatState }, teamId: string) =>
  state.teamChat.threads.filter((thread) => thread.teamId === teamId);

export const selectAuditLogForTeam = (state: { teamChat: TeamChatState }, teamId: string) =>
  state.teamChat.auditLog.filter((entry) => entry.teamId === teamId);

export default teamChatSlice.reducer;
