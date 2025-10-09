import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addConceptFeedback,
  addConceptTask,
  attachChatThread,
  castConceptVote,
  closeVotingWindow,
  confirmKitOrder,
  createProductionPackage,
  exportConceptToCanva,
  generateAIConcepts,
  publishFinalKit,
  requestVendorQuote,
  scheduleVotingWindow,
  selectCanvaTemplates,
  selectKitProjectsByTeam,
  selectKitPromptLibrary,
  selectVendorCatalog,
  startKitProject,
  syncCanvaRevision,
  updateConceptTaskStatus,
  updateKitBrief,
} from '../store/slices/kitDesignSlice';
import {
  createContextualThread,
  linkThreadMetadata,
  selectThreadsByTeam,
} from '../store/slices/teamChatSlice';

interface KitDesignBoardProps {
  teamId: string;
  teamName?: string;
}

const KitDesignBoard: React.FC<KitDesignBoardProps> = ({ teamId, teamName }) => {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => selectKitProjectsByTeam(state, teamId));
  const project = projects[0];
  const prompts = useAppSelector(selectKitPromptLibrary);
  const templates = useAppSelector(selectCanvaTemplates);
  const vendors = useAppSelector(selectVendorCatalog);
  const threads = useAppSelector((state) => selectThreadsByTeam(state, teamId));
  const kitThread = useMemo(
    () => threads.find((thread) => thread.type === 'kit'),
    [threads],
  );

  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [secondaryColor, setSecondaryColor] = useState('#facc15');
  const [sponsor, setSponsor] = useState('');
  const [vibe, setVibe] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [voteChoice, setVoteChoice] = useState<Record<string, 'approve' | 'revise'>>({});

  useEffect(() => {
    if (!project && !kitThread) {
      return;
    }

    if (project && !project.chatThreadId && kitThread) {
      dispatch(attachChatThread({ projectId: project.id, threadId: kitThread.id }));
    }
  }, [project, kitThread, dispatch]);

  useEffect(() => {
    if (!project || !kitThread) {
      return;
    }

    if (kitThread.metadata?.relatedKitProjectId === project.id) {
      return;
    }

    dispatch(
      linkThreadMetadata({
        threadId: kitThread.id,
        metadata: { relatedKitProjectId: project.id },
      }),
    );
  }, [project?.id, kitThread?.id, kitThread?.metadata?.relatedKitProjectId, dispatch]);

  useEffect(() => {
    if (!project) {
      return;
    }

    setPrimaryColor(project.brief.primaryColor);
    setSecondaryColor(project.brief.secondaryColor);
    setSponsor(project.brief.sponsor);
    setVibe(project.brief.vibe);
    setNotes(project.brief.inspirationNotes ?? '');
    setSelectedPrompts(project.prompts.map((prompt) => prompt.id));
  }, [project?.id]);

  const handleStartProject = () => {
    if (!kitThread) {
      dispatch(
        createContextualThread({
          teamId,
          title: 'Kit Design Room',
          type: 'kit',
          createdBy: 'System',
          metadata: { relatedKitProjectId: undefined },
        }),
      );
    }

    dispatch(
      startKitProject({
        teamId,
        title: `${teamName ?? 'Squad'} 24/25 Home Kit`,
        brief: {
          primaryColor,
          secondaryColor,
          sponsor: sponsor || 'Local Sponsor',
          vibe: vibe || 'Community-first energy',
          inspirationNotes: notes,
          culturalAnchors: ['Club crest evolution', 'Local landmark'],
        },
        chatThreadId: kitThread?.id,
      }),
    );
  };

  const handleSaveBrief = () => {
    if (!project) {
      return;
    }

    dispatch(
      updateKitBrief({
        projectId: project.id,
        brief: {
          primaryColor,
          secondaryColor,
          sponsor,
          vibe,
          inspirationNotes: notes,
        },
        promptIds: selectedPrompts,
      }),
    );
  };

  const handleGenerateConcepts = () => {
    if (!project) {
      return;
    }

    dispatch(generateAIConcepts({ projectId: project.id }));
  };

  const handleRequestQuote = (vendorId: string) => {
    if (!project) {
      return;
    }

    dispatch(requestVendorQuote({ projectId: project.id, vendorId }));
  };

  const handleConfirmOrder = () => {
    if (!project || !project.vendorQuoteId) {
      return;
    }

    dispatch(
      confirmKitOrder({
        projectId: project.id,
        quoteId: project.vendorQuoteId,
        paymentMethod: 'wallet',
        quantities: { S: 5, M: 8, L: 8, XL: 4 },
      }),
    );
  };

  const handlePublish = () => {
    if (!project) {
      return;
    }

    dispatch(
      publishFinalKit({
        projectId: project.id,
        showcaseUrl: `https://community.football.app/teams/${teamId}/kits/${project.id}`,
      }),
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>AI-powered kit lab</Text>
      {!project ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Start a collaborative kit project</Text>
          <Text style={styles.emptyCopy}>
            Capture the brief, spin up AI concepts, and bring your squad into the decision making loop with
            structured feedback and voting.
          </Text>
          <View style={styles.briefGrid}>
            <View style={styles.briefColumn}>
              <Text style={styles.inputLabel}>Primary colour</Text>
              <TextInput value={primaryColor} onChangeText={setPrimaryColor} style={styles.input} />
              <Text style={styles.inputLabel}>Secondary colour</Text>
              <TextInput value={secondaryColor} onChangeText={setSecondaryColor} style={styles.input} />
              <Text style={styles.inputLabel}>Sponsor</Text>
              <TextInput value={sponsor} onChangeText={setSponsor} style={styles.input} placeholder="Local business" />
            </View>
            <View style={styles.briefColumn}>
              <Text style={styles.inputLabel}>Kit vibe</Text>
              <TextInput value={vibe} onChangeText={setVibe} style={styles.input} placeholder="Bold, fearless, community" />
              <Text style={styles.inputLabel}>Cultural anchors</Text>
              <Text style={styles.anchorHelper}>
                We automatically reference club history, city icons, and supporter rituals to seed AI prompts.
              </Text>
              <Text style={styles.inputLabel}>Additional notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={[styles.input, styles.multilineInput]}
                placeholder="Highlight academy stripes and anniversary crest"
                multiline
              />
            </View>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartProject}>
            <Text style={styles.primaryButtonText}>Launch kit workspace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.statusPill}>{project.stage.toUpperCase()}</Text>
          <Text style={styles.subheading}>Design brief & inspiration</Text>
          <View style={styles.briefGrid}>
            <View style={styles.briefColumn}>
              <Text style={styles.inputLabel}>Primary colour</Text>
              <TextInput value={primaryColor} onChangeText={setPrimaryColor} style={styles.input} />
              <Text style={styles.inputLabel}>Secondary colour</Text>
              <TextInput value={secondaryColor} onChangeText={setSecondaryColor} style={styles.input} />
              <Text style={styles.inputLabel}>Sponsor</Text>
              <TextInput value={sponsor} onChangeText={setSponsor} style={styles.input} />
            </View>
            <View style={styles.briefColumn}>
              <Text style={styles.inputLabel}>Kit vibe</Text>
              <TextInput value={vibe} onChangeText={setVibe} style={styles.input} />
              <Text style={styles.inputLabel}>Inspiration notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={[styles.input, styles.multilineInput]}
                multiline
              />
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptRow}>
            {prompts.map((prompt) => {
              const selected = selectedPrompts.includes(prompt.id);
              return (
                <TouchableOpacity
                  key={prompt.id}
                  style={[styles.promptCard, selected && styles.promptCardSelected]}
                  onPress={() => {
                    setSelectedPrompts((current) =>
                      selected ? current.filter((id) => id !== prompt.id) : [...current, prompt.id],
                    );
                  }}
                >
                  <Text style={styles.promptTitle}>{prompt.title}</Text>
                  <Text style={styles.promptCopy}>{prompt.description}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveBrief}>
            <Text style={styles.secondaryButtonText}>Save brief & prompt palette</Text>
          </TouchableOpacity>

          <Text style={styles.subheading}>AI + Canva co-creation</Text>
          <Text style={styles.helperCopy}>
            Generate layered concepts, then push any version directly into Canva for pixel-perfect tweaks.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGenerateConcepts}>
            <Text style={styles.primaryButtonText}>Generate concepts</Text>
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateRow}>
            {templates.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <View style={styles.templatePreview}>
                  <Text style={styles.templatePreviewText}>{template.title}</Text>
                </View>
                <Text style={styles.templateCategory}>{template.category}</Text>
                <Text style={styles.templateLink}>Open in Canva</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.conceptsGrid}>
            {project.concepts.map((concept) => {
              const feedbackDraft = feedbackDrafts[concept.id] ?? '';
              const taskDraft = taskDrafts[concept.id] ?? '';
              const votes = concept.votes.reduce(
                (acc, vote) => {
                  if (vote.vote === 'approve') {
                    acc.approve += 1;
                  } else {
                    acc.revise += 1;
                  }
                  return acc;
                },
                { approve: 0, revise: 0 },
              );

              return (
                <View key={concept.id} style={styles.conceptCard}>
                  <Text style={styles.conceptTitle}>{concept.title}</Text>
                  <Text style={styles.conceptMeta}>Version {concept.version}</Text>
                  <View style={styles.previewRow}>
                    <View style={styles.previewBlock}>
                      <Text style={styles.previewLabel}>Front</Text>
                      <Text style={styles.previewPlaceholder}>Preview</Text>
                    </View>
                    <View style={styles.previewBlock}>
                      <Text style={styles.previewLabel}>Back</Text>
                      <Text style={styles.previewPlaceholder}>Preview</Text>
                    </View>
                    <View style={styles.previewBlock}>
                      <Text style={styles.previewLabel}>Crest</Text>
                      <Text style={styles.previewPlaceholder}>Vector</Text>
                    </View>
                  </View>
                  <Text style={styles.helperCopy}>Layer control</Text>
                  {concept.layers.map((layer) => (
                    <Text key={layer.id} style={styles.layerRow}>
                      {layer.editable ? '🖌️' : '🔒'} {layer.label}
                    </Text>
                  ))}
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => dispatch(exportConceptToCanva({ projectId: project.id, conceptId: concept.id }))}
                  >
                    <Text style={styles.secondaryButtonText}>Open in Canva</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => dispatch(syncCanvaRevision({ projectId: project.id, conceptId: concept.id }))}
                  >
                    <Text style={styles.secondaryButtonText}>Sync Canva revision</Text>
                  </TouchableOpacity>

                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackTitle}>Feedback & tasks</Text>
                    {concept.feedback.map((feedback) => (
                      <Text key={feedback.id} style={styles.feedbackItem}>
                        {feedback.author}: {feedback.message}
                      </Text>
                    ))}
                    <TextInput
                      value={feedbackDraft}
                      onChangeText={(text) =>
                        setFeedbackDrafts((current) => ({
                          ...current,
                          [concept.id]: text,
                        }))
                      }
                      style={[styles.input, styles.multilineInput]}
                      placeholder="Add feedback for the team"
                      multiline
                    />
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => {
                        if (!feedbackDraft.trim()) {
                          return;
                        }
                        dispatch(
                          addConceptFeedback({
                            projectId: project.id,
                            conceptId: concept.id,
                            author: 'Captain',
                            message: feedbackDraft.trim(),
                          }),
                        );
                        setFeedbackDrafts((current) => ({ ...current, [concept.id]: '' }));
                      }}
                    >
                      <Text style={styles.secondaryButtonText}>Share feedback</Text>
                    </TouchableOpacity>
                    {concept.tasks.map((task) => (
                      <TouchableOpacity
                        key={task.id}
                        style={[styles.taskChip, task.status === 'completed' && styles.taskChipCompleted]}
                        onPress={() =>
                          dispatch(
                            updateConceptTaskStatus({
                              projectId: project.id,
                              conceptId: concept.id,
                              taskId: task.id,
                              status: task.status === 'completed' ? 'open' : 'completed',
                            }),
                          )
                        }
                      >
                        <Text style={styles.taskChipText}>
                          {task.status === 'completed' ? '✅' : '📝'} {task.summary}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TextInput
                      value={taskDraft}
                      onChangeText={(text) =>
                        setTaskDrafts((current) => ({
                          ...current,
                          [concept.id]: text,
                        }))
                      }
                      style={styles.input}
                      placeholder="Add task e.g. adjust collar"
                    />
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => {
                        if (!taskDraft.trim()) {
                          return;
                        }
                        dispatch(
                          addConceptTask({
                            projectId: project.id,
                            conceptId: concept.id,
                            summary: taskDraft.trim(),
                          }),
                        );
                        setTaskDrafts((current) => ({ ...current, [concept.id]: '' }));
                      }}
                    >
                      <Text style={styles.secondaryButtonText}>Create task</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.helperCopy}>
                    Voting tally: ✅ {votes.approve} • 🔁 {votes.revise}
                  </Text>
                  <View style={styles.voteRow}>
                    <TouchableOpacity
                      style={[styles.voteButton, voteChoice[concept.id] === 'approve' && styles.voteButtonActive]}
                      onPress={() =>
                        setVoteChoice((current) => ({
                          ...current,
                          [concept.id]: 'approve',
                        }))
                      }
                    >
                      <Text style={styles.voteButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.voteButton, voteChoice[concept.id] === 'revise' && styles.voteButtonActive]}
                      onPress={() =>
                        setVoteChoice((current) => ({
                          ...current,
                          [concept.id]: 'revise',
                        }))
                      }
                    >
                      <Text style={styles.voteButtonText}>Request changes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() =>
                        dispatch(
                          castConceptVote({
                            projectId: project.id,
                            conceptId: concept.id,
                            memberId: 'captain',
                            vote: voteChoice[concept.id] ?? 'approve',
                          }),
                        )
                      }
                    >
                      <Text style={styles.secondaryButtonText}>Submit vote</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.subheading}>Structured voting</Text>
          <Text style={styles.helperCopy}>
            Open a voting window and Football App will collect ballots, tally results, and lock in the winning concept.
          </Text>
          <View style={styles.votingRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() =>
                dispatch(
                  scheduleVotingWindow({
                    projectId: project.id,
                    opensAt: new Date().toISOString(),
                    closesAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
                  }),
                )
              }
            >
              <Text style={styles.secondaryButtonText}>Start voting</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => dispatch(closeVotingWindow({ projectId: project.id }))}
            >
              <Text style={styles.secondaryButtonText}>Close voting</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => dispatch(createProductionPackage({ projectId: project.id }))}
            >
              <Text style={styles.secondaryButtonText}>Generate production files</Text>
            </TouchableOpacity>
          </View>
          {project.votingWindow && (
            <Text style={styles.helperCopy}>
              Voting window • {new Date(project.votingWindow.opensAt).toLocaleString()} →{' '}
              {new Date(project.votingWindow.closesAt).toLocaleString()}
            </Text>
          )}

          <Text style={styles.subheading}>Vendor handoff</Text>
          <View style={styles.vendorRow}>
            {vendors.map((vendor) => (
              <TouchableOpacity key={vendor.id} style={styles.vendorCard} onPress={() => handleRequestQuote(vendor.id)}>
                <Text style={styles.vendorName}>{vendor.vendorName}</Text>
                <Text style={styles.vendorMeta}>
                  {vendor.currency} {vendor.unitPrice} / kit • MOQ {vendor.minimumOrder}
                </Text>
                <Text style={styles.vendorMeta}>Lead time: {vendor.leadTimeWeeks} weeks</Text>
              </TouchableOpacity>
            ))}
          </View>
          {project.vendorQuoteId && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmOrder}>
              <Text style={styles.primaryButtonText}>Confirm order & collect payment</Text>
            </TouchableOpacity>
          )}
          {project.order && (
            <View style={styles.orderCard}>
              <Text style={styles.orderTitle}>Order status: {project.order.status}</Text>
              <Text style={styles.orderMeta}>Submitted: {project.order.submittedAt}</Text>
              <Text style={styles.orderMeta}>Total due: {project.order.totalPrice} ({project.order.paymentMethod})</Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  dispatch(
                    publishFinalKit({
                      projectId: project.id,
                      showcaseUrl: `https://community.football.app/teams/${teamId}/kits/${project.id}`,
                    }),
                  )
                }
              >
                <Text style={styles.secondaryButtonText}>Share to community</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.subheading}>Post-launch</Text>
          <Text style={styles.helperCopy}>
            Spotlight the finished kit on your team profile and unlock premium drops for supporters.
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={handlePublish}>
            <Text style={styles.secondaryButtonText}>Publish to team profile</Text>
          </TouchableOpacity>
          <View style={styles.upsellRow}>
            {project.monetisationUpsells.map((item) => (
              <View key={item} style={styles.upsellPill}>
                <Text style={styles.upsellText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
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
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '600',
  },
  emptyState: {
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyCopy: {
    color: '#475569',
    lineHeight: 20,
  },
  briefGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  briefColumn: {
    flex: 1,
    gap: 8,
    minWidth: 160,
  },
  inputLabel: {
    fontWeight: '600',
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  anchorHelper: {
    color: '#64748b',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  content: {
    gap: 16,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  helperCopy: {
    color: '#475569',
    lineHeight: 18,
  },
  promptRow: {
    flexGrow: 0,
  },
  promptCard: {
    width: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    padding: 12,
    marginRight: 12,
    backgroundColor: '#fff',
  },
  promptCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  promptTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  promptCopy: {
    color: '#475569',
    fontSize: 12,
  },
  templateRow: {
    flexGrow: 0,
  },
  templateCard: {
    width: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    padding: 12,
    marginRight: 12,
    gap: 8,
  },
  templatePreview: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    justifyContent: 'center',
  },
  templatePreviewText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  templateCategory: {
    fontSize: 12,
    color: '#64748b',
  },
  templateLink: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  conceptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conceptCard: {
    flexBasis: '48%',
    minWidth: 280,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
  },
  conceptTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  conceptMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
  },
  previewBlock: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  previewLabel: {
    fontWeight: '600',
  },
  previewPlaceholder: {
    color: '#94a3b8',
  },
  layerRow: {
    color: '#1f2937',
  },
  feedbackSection: {
    gap: 8,
  },
  feedbackTitle: {
    fontWeight: '700',
  },
  feedbackItem: {
    fontSize: 12,
    color: '#475569',
  },
  taskChip: {
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    alignSelf: 'flex-start',
  },
  taskChipCompleted: {
    backgroundColor: '#dcfce7',
    borderColor: '#15803d',
  },
  taskChipText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  voteRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  voteButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  voteButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  voteButtonText: {
    fontWeight: '600',
  },
  votingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vendorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vendorCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    padding: 12,
    minWidth: 200,
    backgroundColor: '#f8fafc',
  },
  vendorName: {
    fontWeight: '700',
  },
  vendorMeta: {
    color: '#475569',
    fontSize: 12,
  },
  orderCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
    padding: 12,
    gap: 4,
  },
  orderTitle: {
    fontWeight: '700',
    color: '#166534',
  },
  orderMeta: {
    fontSize: 12,
    color: '#15803d',
  },
  upsellRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  upsellPill: {
    borderRadius: 999,
    backgroundColor: '#fdf4ff',
    borderWidth: 1,
    borderColor: '#f0abfc',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  upsellText: {
    color: '#86198f',
    fontWeight: '600',
  },
});

export default KitDesignBoard;
