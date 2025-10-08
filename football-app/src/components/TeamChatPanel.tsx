import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  cacheRecentMessages,
  closePoll,
  createContextualThread,
  createPoll,
  markThreadResolved,
  muteThread,
  pinMessage,
  postMessage,
  selectThreadsByTeam,
  setRealtimeBackend,
  setRealtimeConnection,
  voteOnPoll,
} from '../store/slices/teamChatSlice';
import { selectKitProjectsByTeam } from '../store/slices/kitDesignSlice';

interface TeamChatPanelProps {
  teamId: string;
}

const TeamChatPanel: React.FC<TeamChatPanelProps> = ({ teamId }) => {
  const dispatch = useAppDispatch();
  const threads = useAppSelector((state) => selectThreadsByTeam(state, teamId));
  const chatState = useAppSelector((state) => state.teamChat);
  const kitProjects = useAppSelector((state) => selectKitProjectsByTeam(state, teamId));
  const kitThread = useMemo(() => threads.find((thread) => thread.type === 'kit'), [threads]);
  const matchdayThread = useMemo(
    () => threads.find((thread) => thread.type === 'matchday'),
    [threads],
  );
  const announcementThread = useMemo(
    () => threads.find((thread) => thread.type === 'announcement'),
    [threads],
  );

  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState('Yes,No');

  useEffect(() => {
    if (!kitThread && kitProjects.length > 0) {
      dispatch(
        createContextualThread({
          teamId,
          title: 'Kit Design Room',
          type: 'kit',
          createdBy: 'System',
          metadata: { relatedKitProjectId: kitProjects[0].id },
        }),
      );
    }
  }, [kitThread, kitProjects, dispatch, teamId]);

  useEffect(() => {
    if (!matchdayThread) {
      dispatch(
        createContextualThread({
          teamId,
          title: 'Matchday Logistics',
          type: 'matchday',
          createdBy: 'System',
        }),
      );
    }

    if (!announcementThread) {
      dispatch(
        createContextualThread({
          teamId,
          title: 'Team Announcements',
          type: 'announcement',
          createdBy: 'System',
        }),
      );
    }
  }, [matchdayThread, announcementThread, dispatch, teamId]);

  const handleSendMessage = (threadId: string) => {
    const body = messageDrafts[threadId]?.trim();
    if (!body) {
      return;
    }

    dispatch(
      postMessage({
        threadId,
        senderId: 'captain',
        senderName: 'Captain',
        body,
      }),
    );
    setMessageDrafts((current) => ({ ...current, [threadId]: '' }));
    dispatch(cacheRecentMessages({ threadId }));
  };

  const handleCreatePoll = (threadId: string) => {
    if (!pollQuestion.trim()) {
      return;
    }

    const options = pollOptions
      .split(',')
      .map((option) => option.trim())
      .filter(Boolean);

    if (options.length < 2) {
      return;
    }

    dispatch(
      createPoll({
        threadId,
        question: pollQuestion.trim(),
        options,
        closesAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    );
    setPollQuestion('');
    setPollOptions('Yes,No');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Team live chat</Text>
      <View style={styles.statusRow}>
        <Text style={styles.statusBadge}>{chatState.backend.toUpperCase()} real-time</Text>
        <Text style={styles.statusCopy}>{chatState.connected ? 'Connected' : 'Offline mode'}</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            dispatch(
              setRealtimeConnection({
                connected: !chatState.connected,
              }),
            )
          }
        >
          <Text style={styles.secondaryButtonText}>{chatState.connected ? 'Go offline' : 'Reconnect'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            dispatch(
              setRealtimeBackend({
                backend: chatState.backend === 'firebase' ? 'stream' : 'firebase',
              }),
            )
          }
        >
          <Text style={styles.secondaryButtonText}>Switch backend</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.threadRow}>
        {threads.map((thread) => (
          <View key={thread.id} style={styles.threadCard}>
            <Text style={styles.threadTitle}>{thread.title}</Text>
            <Text style={styles.threadMeta}>
              Last activity {new Date(thread.lastActivityAt).toLocaleTimeString()} • {thread.messages.length} messages
            </Text>
            <ScrollView style={styles.messageList}>
              {thread.messages.slice(-4).map((message) => (
                <TouchableOpacity
                  key={message.id}
                  style={styles.messageBubble}
                  onLongPress={() => dispatch(pinMessage({ threadId: thread.id, messageId: message.id }))}
                >
                  <Text style={styles.messageAuthor}>{message.senderName}</Text>
                  <Text style={styles.messageBody}>{message.body}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              value={messageDrafts[thread.id] ?? ''}
              onChangeText={(text) =>
                setMessageDrafts((current) => ({
                  ...current,
                  [thread.id]: text,
                }))
              }
              style={styles.input}
              placeholder="Share an update"
            />
            <View style={styles.threadActions}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => handleSendMessage(thread.id)}>
                <Text style={styles.primaryButtonText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => dispatch(muteThread({ threadId: thread.id, muted: !thread.muted }))}
              >
                <Text style={styles.secondaryButtonText}>{thread.muted ? 'Unmute' : 'Mute'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => dispatch(markThreadResolved({ threadId: thread.id, resolved: !thread.resolved }))}
              >
                <Text style={styles.secondaryButtonText}>{thread.resolved ? 'Reopen' : 'Mark resolved'}</Text>
              </TouchableOpacity>
            </View>
            {thread.polls.map((poll) => (
              <View key={poll.id} style={styles.pollCard}>
                <Text style={styles.pollQuestion}>{poll.question}</Text>
                {poll.options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.pollOption}
                    onPress={() =>
                      dispatch(
                        voteOnPoll({
                          threadId: thread.id,
                          pollId: poll.id,
                          optionId: option.id,
                          memberId: 'captain',
                        }),
                      )
                    }
                  >
                    <Text style={styles.pollOptionLabel}>
                      {option.label} ({option.votes.length})
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.secondaryButton} onPress={() => dispatch(closePoll({ threadId: thread.id, pollId: poll.id }))}>
                  <Text style={styles.secondaryButtonText}>{poll.closed ? 'Closed' : 'Close poll'}</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleCreatePoll(thread.id)}
            >
              <Text style={styles.secondaryButtonText}>Create poll</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <View style={styles.pollComposer}>
        <Text style={styles.subheading}>Quick poll</Text>
        <TextInput
          value={pollQuestion}
          onChangeText={setPollQuestion}
          style={styles.input}
          placeholder="Question e.g. Approve Concept 3?"
        />
        <TextInput
          value={pollOptions}
          onChangeText={setPollOptions}
          style={styles.input}
          placeholder="Options separated by commas"
        />
      </View>
      <Text style={styles.helperCopy}>
        Cached conversations: {chatState.cached.length} threads • Offline queue {chatState.offlineQueue.length} messages
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    color: '#3730a3',
    fontWeight: '600',
  },
  statusCopy: {
    color: '#475569',
    fontSize: 12,
  },
  threadRow: {
    flexGrow: 0,
  },
  threadCard: {
    width: 240,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    padding: 12,
    marginRight: 12,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  threadTitle: {
    fontWeight: '700',
  },
  threadMeta: {
    color: '#475569',
    fontSize: 12,
  },
  messageList: {
    maxHeight: 120,
  },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageAuthor: {
    fontWeight: '600',
  },
  messageBody: {
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  threadActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  pollCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#e0f2fe',
    padding: 12,
    gap: 8,
  },
  pollQuestion: {
    fontWeight: '700',
  },
  pollOption: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pollOptionLabel: {
    color: '#0369a1',
    fontWeight: '600',
  },
  pollComposer: {
    gap: 8,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '700',
  },
  helperCopy: {
    color: '#475569',
  },
});

export default TeamChatPanel;
