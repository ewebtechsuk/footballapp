import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

export type KitBrief = {
  primaryColor: string;
  secondaryColor: string;
  sponsor: string;
  vibe: string;
  inspirationNotes?: string;
  culturalAnchors: string[];
};

export type KitPrompt = {
  id: string;
  title: string;
  description: string;
  prompt: string;
};

export type CanvaTemplate = {
  id: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  templateUrl: string;
};

export type ConceptLayer = {
  id: string;
  label: string;
  editable: boolean;
};

export type KitConcept = {
  id: string;
  title: string;
  version: number;
  generatedAt: string;
  createdBy: 'ai' | 'canva';
  frontPreviewUrl: string;
  backPreviewUrl: string;
  crestPreviewUrl: string;
  layers: ConceptLayer[];
  exportedToCanva?: {
    designId: string;
    exportedAt: string;
    status: 'synced' | 'pending';
  };
  syncedFromCanvaAt?: string;
  tasks: KitTask[];
  feedback: KitFeedback[];
  votes: KitVote[];
  status: 'draft' | 'review' | 'approved' | 'archived';
};

export type KitTask = {
  id: string;
  summary: string;
  status: 'open' | 'inProgress' | 'completed';
  assignee?: string;
};

export type KitFeedback = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
  resolved: boolean;
};

export type KitVote = {
  id: string;
  memberId: string;
  vote: 'approve' | 'revise';
  castAt: string;
};

export type VotingWindow = {
  opensAt: string;
  closesAt: string;
  result?: {
    winningConceptId: string | null;
    approved: boolean;
  };
};

export type ProductionAsset = {
  id: string;
  type: 'vector' | 'mockup' | 'specSheet';
  fileName: string;
  downloadUrl: string;
};

export type VendorQuote = {
  id: string;
  vendorName: string;
  region: string;
  currency: string;
  unitPrice: number;
  minimumOrder: number;
  leadTimeWeeks: number;
  sizeRuns: string[];
};

export type KitOrderStatus = 'draft' | 'quoted' | 'submitted' | 'inProduction' | 'fulfilled' | 'shipped';

export type KitOrder = {
  id: string;
  vendorId: string;
  quoteId: string;
  status: KitOrderStatus;
  quantities: Record<string, number>;
  totalPrice: number;
  paymentMethod: 'wallet' | 'card';
  submittedAt?: string;
  updatedAt: string;
  trackingUrl?: string;
};

export type KitProjectStage =
  | 'brief'
  | 'concepting'
  | 'voting'
  | 'finalReview'
  | 'approved'
  | 'production'
  | 'complete';

export type KitProject = {
  id: string;
  teamId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  brief: KitBrief;
  prompts: KitPrompt[];
  concepts: KitConcept[];
  activeConceptId: string | null;
  stage: KitProjectStage;
  votingWindow?: VotingWindow;
  productionAssets: ProductionAsset[];
  vendorQuoteId?: string;
  order?: KitOrder;
  showcaseUrl?: string;
  monetisationUpsells: string[];
  chatThreadId?: string;
};

export type KitDesignState = {
  projects: KitProject[];
  promptLibrary: KitPrompt[];
  canvaTemplates: CanvaTemplate[];
  vendorCatalog: VendorQuote[];
};

const defaultPromptLibrary: KitPrompt[] = [
  {
    id: 'heritage-river',
    title: 'River heritage',
    description: 'Highlight the waterways that define your city with flowing pinstripes.',
    prompt:
      'Design a home kit inspired by the city river. Use gradient blues, reflective silver trims, and a crest that nods to maritime history.',
  },
  {
    id: 'industrial-roots',
    title: 'Industrial roots',
    description: 'Lean into bold angles and metallic accents from local factories.',
    prompt:
      'Create a bold jersey that celebrates industrial heritage. Dark charcoal base, copper piping, angular sponsor lockup referencing steel beams.',
  },
  {
    id: 'youth-academy',
    title: 'Academy revival',
    description: 'Blend past academy kits with current colours for a unifying look.',
    prompt:
      'Fuse the 2004 academy sash with modern colour blocking. Include a sleeve badge celebrating youth graduates.',
  },
];

const defaultCanvaTemplates: CanvaTemplate[] = [
  {
    id: 'canva-classic-001',
    title: 'Classic Hoops',
    category: 'Jersey Fronts',
    thumbnailUrl: 'https://images.football.app/canva/hoops.png',
    templateUrl: 'https://www.canva.com/design/kit-classic-hoops',
  },
  {
    id: 'canva-badge-112',
    title: 'Modern Crest Grid',
    category: 'Crest',
    thumbnailUrl: 'https://images.football.app/canva/crest-grid.png',
    templateUrl: 'https://www.canva.com/design/crest-modern-grid',
  },
  {
    id: 'canva-away-204',
    title: 'Minimal Away Fade',
    category: 'Jersey Backs',
    thumbnailUrl: 'https://images.football.app/canva/away-fade.png',
    templateUrl: 'https://www.canva.com/design/kit-minimal-away',
  },
];

const defaultVendorCatalog: VendorQuote[] = [
  {
    id: 'vendor-print-lab',
    vendorName: 'PrintLab Athletics',
    region: 'EU',
    currency: 'EUR',
    unitPrice: 45,
    minimumOrder: 12,
    leadTimeWeeks: 4,
    sizeRuns: ['XS-2XL', 'Custom goalkeeper cut'],
  },
  {
    id: 'vendor-squad-supply',
    vendorName: 'Squad Supply Co.',
    region: 'US',
    currency: 'USD',
    unitPrice: 52,
    minimumOrder: 10,
    leadTimeWeeks: 5,
    sizeRuns: ['Youth S-L', 'Adult XS-4XL'],
  },
  {
    id: 'vendor-kit-forge',
    vendorName: 'Kit Forge',
    region: 'APAC',
    currency: 'USD',
    unitPrice: 48,
    minimumOrder: 15,
    leadTimeWeeks: 6,
    sizeRuns: ['Unisex XS-3XL'],
  },
];

const initialState: KitDesignState = {
  projects: [],
  promptLibrary: defaultPromptLibrary,
  canvaTemplates: defaultCanvaTemplates,
  vendorCatalog: defaultVendorCatalog,
};

const updateProjectTimestamp = (project: KitProject) => {
  project.updatedAt = new Date().toISOString();
};

const findProject = (state: KitDesignState, projectId: string) =>
  state.projects.find((candidate) => candidate.id === projectId);

const kitDesignSlice = createSlice({
  name: 'kitDesign',
  initialState,
  reducers: {
    startKitProject: (
      state,
      action: PayloadAction<{ teamId: string; title: string; brief?: Partial<KitBrief>; chatThreadId?: string }>,
    ) => {
      const { teamId, title, brief, chatThreadId } = action.payload;
      const project: KitProject = {
        id: nanoid(),
        teamId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        brief: {
          primaryColor: '#0f172a',
          secondaryColor: '#facc15',
          sponsor: 'Local Sponsor',
          vibe: 'Bold + community-first',
          inspirationNotes: '',
          culturalAnchors: ['Club crest evolution', 'Local landmark'],
          ...(brief ?? {}),
        },
        prompts: state.promptLibrary.slice(0, 2),
        concepts: [],
        activeConceptId: null,
        stage: 'brief',
        productionAssets: [],
        monetisationUpsells: ['Alternate kit drop', 'Supporter patch pre-order'],
        chatThreadId,
      };

      state.projects.push(project);
    },
    updateKitBrief: (
      state,
      action: PayloadAction<{ projectId: string; brief: Partial<KitBrief>; promptIds?: string[] }>,
    ) => {
      const { projectId, brief, promptIds } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      project.brief = {
        ...project.brief,
        ...brief,
      };

      if (promptIds && promptIds.length > 0) {
        project.prompts = state.promptLibrary.filter((prompt) => promptIds.includes(prompt.id));
      }

      updateProjectTimestamp(project);
    },
    addCustomPrompt: (
      state,
      action: PayloadAction<{ projectId: string; prompt: KitPrompt }>,
    ) => {
      const { projectId, prompt } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      project.prompts = [...project.prompts, prompt];
      updateProjectTimestamp(project);
    },
    generateAIConcepts: (
      state,
      action: PayloadAction<{ projectId: string; count?: number }>,
    ) => {
      const { projectId, count = 3 } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      const generatedConcepts: KitConcept[] = Array.from({ length: count }).map((_, index) => {
        const version = project.concepts.length + index + 1;
        return {
          id: nanoid(),
          title: `Concept ${version}`,
          version,
          generatedAt: new Date().toISOString(),
          createdBy: 'ai',
          frontPreviewUrl: `https://images.football.app/kits/${projectId}/concept-${version}-front.png`,
          backPreviewUrl: `https://images.football.app/kits/${projectId}/concept-${version}-back.png`,
          crestPreviewUrl: `https://images.football.app/kits/${projectId}/concept-${version}-crest.png`,
          layers: [
            { id: nanoid(), label: 'Base pattern', editable: true },
            { id: nanoid(), label: 'Accent stripes', editable: true },
            { id: nanoid(), label: 'Sponsor lockup', editable: true },
          ],
          tasks: [],
          feedback: [],
          votes: [],
          status: 'draft',
        };
      });

      project.concepts = [...project.concepts, ...generatedConcepts];
      project.activeConceptId = generatedConcepts[0]?.id ?? project.activeConceptId;
      project.stage = 'concepting';
      updateProjectTimestamp(project);
    },
    exportConceptToCanva: (
      state,
      action: PayloadAction<{ projectId: string; conceptId: string; designId?: string }>,
    ) => {
      const { projectId, conceptId, designId } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      const concept = project.concepts.find((candidate) => candidate.id === conceptId);
      if (!concept) {
        return;
      }

      concept.exportedToCanva = {
        designId: designId ?? `canva-${concept.id}`,
        exportedAt: new Date().toISOString(),
        status: 'pending',
      };

      concept.createdBy = 'canva';
      updateProjectTimestamp(project);
    },
    syncCanvaRevision: (
      state,
      action: PayloadAction<{ projectId: string; conceptId: string; updatedLayers?: string[] }>,
    ) => {
      const { projectId, conceptId, updatedLayers } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      const concept = project.concepts.find((candidate) => candidate.id === conceptId);
      if (!concept) {
        return;
      }

      concept.syncedFromCanvaAt = new Date().toISOString();
      if (concept.exportedToCanva) {
        concept.exportedToCanva.status = 'synced';
      }

      if (updatedLayers && updatedLayers.length > 0) {
        concept.layers = concept.layers.map((layer, index) => ({
          ...layer,
          label: updatedLayers[index] ?? layer.label,
        }));
      }

      updateProjectTimestamp(project);
    },
    addConceptTask: (
      state,
      action: PayloadAction<{ projectId: string; conceptId: string; summary: string; assignee?: string }>,
    ) => {
      const { projectId, conceptId, summary, assignee } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      const concept = project.concepts.find((candidate) => candidate.id === conceptId);
      if (!concept) {
        return;
      }

      concept.tasks.push({
        id: nanoid(),
        summary,
        status: 'open',
        assignee,
      });
      updateProjectTimestamp(project);
    },
    updateConceptTaskStatus: (
      state,
      action: PayloadAction<{ projectId: string; conceptId: string; taskId: string; status: KitTask['status'] }>,
    ) => {
      const { projectId, conceptId, taskId, status } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      const concept = project.concepts.find((candidate) => candidate.id === conceptId);
      if (!concept) {
        return;
      }

      const task = concept.tasks.find((candidate) => candidate.id === taskId);
      if (!task) {
        return;
      }

      task.status = status;
      updateProjectTimestamp(project);
    },
    addConceptFeedback: (
      state,
      action: PayloadAction<{ projectId: string; conceptId: string; author: string; message: string }>,
    ) => {
      const { projectId, conceptId, author, message } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      const concept = project.concepts.find((candidate) => candidate.id === conceptId);
      if (!concept) {
        return;
      }

      concept.feedback.push({
        id: nanoid(),
        author,
        message,
        createdAt: new Date().toISOString(),
        resolved: false,
      });
      updateProjectTimestamp(project);
    },
    resolveFeedback: (
      state,
      action: PayloadAction<{ projectId: string; conceptId: string; feedbackId: string; resolved: boolean }>,
    ) => {
      const { projectId, conceptId, feedbackId, resolved } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      const concept = project.concepts.find((candidate) => candidate.id === conceptId);
      if (!concept) {
        return;
      }

      const feedback = concept.feedback.find((candidate) => candidate.id === feedbackId);
      if (!feedback) {
        return;
      }

      feedback.resolved = resolved;
      updateProjectTimestamp(project);
    },
    scheduleVotingWindow: (
      state,
      action: PayloadAction<{ projectId: string; opensAt: string; closesAt: string }>,
    ) => {
      const { projectId, opensAt, closesAt } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      project.votingWindow = {
        opensAt,
        closesAt,
      };
      project.stage = 'voting';
      updateProjectTimestamp(project);
    },
    castConceptVote: (
      state,
      action: PayloadAction<{ projectId: string; conceptId: string; memberId: string; vote: KitVote['vote'] }>,
    ) => {
      const { projectId, conceptId, memberId, vote } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      const concept = project.concepts.find((candidate) => candidate.id === conceptId);
      if (!concept) {
        return;
      }

      const existingVote = concept.votes.find((candidate) => candidate.memberId === memberId);
      if (existingVote) {
        existingVote.vote = vote;
        existingVote.castAt = new Date().toISOString();
      } else {
        concept.votes.push({
          id: nanoid(),
          memberId,
          vote,
          castAt: new Date().toISOString(),
        });
      }
      updateProjectTimestamp(project);
    },
    closeVotingWindow: (state, action: PayloadAction<{ projectId: string }>) => {
      const { projectId } = action.payload;
      const project = findProject(state, projectId);
      if (!project || !project.votingWindow) {
        return;
      }

      const approvalTallies = project.concepts.map((concept) => ({
        conceptId: concept.id,
        approvals: concept.votes.filter((vote) => vote.vote === 'approve').length,
      }));

      const winning = approvalTallies.sort((a, b) => b.approvals - a.approvals)[0];
      project.votingWindow.result = {
        winningConceptId: winning?.conceptId ?? null,
        approved: (winning?.approvals ?? 0) > 0,
      };

      project.activeConceptId = winning?.conceptId ?? project.activeConceptId;
      project.stage = 'finalReview';
      updateProjectTimestamp(project);
    },
    approveConcept: (state, action: PayloadAction<{ projectId: string; conceptId: string }>) => {
      const { projectId, conceptId } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      const concept = project.concepts.find((candidate) => candidate.id === conceptId);
      if (!concept) {
        return;
      }

      concept.status = 'approved';
      project.activeConceptId = conceptId;
      project.stage = 'approved';
      updateProjectTimestamp(project);
    },
    createProductionPackage: (state, action: PayloadAction<{ projectId: string }>) => {
      const { projectId } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      if (!project.activeConceptId) {
        return;
      }

      project.productionAssets = [
        {
          id: nanoid(),
          type: 'vector',
          fileName: `${project.title.replace(/\s+/g, '-').toLowerCase()}-vector.ai`,
          downloadUrl: `https://files.football.app/kits/${projectId}/vector.ai`,
        },
        {
          id: nanoid(),
          type: 'mockup',
          fileName: `${project.title.replace(/\s+/g, '-').toLowerCase()}-mockup.png`,
          downloadUrl: `https://files.football.app/kits/${projectId}/mockup.png`,
        },
        {
          id: nanoid(),
          type: 'specSheet',
          fileName: `${project.title.replace(/\s+/g, '-').toLowerCase()}-spec.pdf`,
          downloadUrl: `https://files.football.app/kits/${projectId}/spec.pdf`,
        },
      ];
      project.stage = 'production';
      updateProjectTimestamp(project);
    },
    requestVendorQuote: (
      state,
      action: PayloadAction<{ projectId: string; vendorId: string }>,
    ) => {
      const { projectId, vendorId } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      project.vendorQuoteId = vendorId;
      updateProjectTimestamp(project);
    },
    confirmKitOrder: (
      state,
      action: PayloadAction<{
        projectId: string;
        quoteId: string;
        paymentMethod: KitOrder['paymentMethod'];
        quantities: Record<string, number>;
      }>,
    ) => {
      const { projectId, quoteId, paymentMethod, quantities } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      const quote = state.vendorCatalog.find((candidate) => candidate.id === quoteId);
      const totalUnits = Object.values(quantities).reduce((sum, value) => sum + value, 0);
      const totalPrice = quote ? quote.unitPrice * totalUnits : totalUnits * 40;

      project.order = {
        id: nanoid(),
        vendorId: quoteId,
        quoteId,
        status: 'submitted',
        quantities,
        totalPrice,
        paymentMethod,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      updateProjectTimestamp(project);
    },
    updateOrderStatus: (
      state,
      action: PayloadAction<{ projectId: string; status: KitOrderStatus; trackingUrl?: string }>,
    ) => {
      const { projectId, status, trackingUrl } = action.payload;
      const project = findProject(state, projectId);
      if (!project || !project.order) {
        return;
      }

      project.order.status = status;
      project.order.updatedAt = new Date().toISOString();
      if (trackingUrl) {
        project.order.trackingUrl = trackingUrl;
      }

      if (status === 'fulfilled' || status === 'shipped') {
        project.stage = 'complete';
      }

      updateProjectTimestamp(project);
    },
    publishFinalKit: (
      state,
      action: PayloadAction<{ projectId: string; showcaseUrl: string }>,
    ) => {
      const { projectId, showcaseUrl } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      project.showcaseUrl = showcaseUrl;
      updateProjectTimestamp(project);
    },
    attachChatThread: (
      state,
      action: PayloadAction<{ projectId: string; threadId: string }>,
    ) => {
      const { projectId, threadId } = action.payload;
      const project = findProject(state, projectId);
      if (!project) {
        return;
      }

      project.chatThreadId = threadId;
      updateProjectTimestamp(project);
    },
  },
});

export const {
  startKitProject,
  updateKitBrief,
  addCustomPrompt,
  generateAIConcepts,
  exportConceptToCanva,
  syncCanvaRevision,
  addConceptTask,
  updateConceptTaskStatus,
  addConceptFeedback,
  resolveFeedback,
  scheduleVotingWindow,
  castConceptVote,
  closeVotingWindow,
  approveConcept,
  createProductionPackage,
  requestVendorQuote,
  confirmKitOrder,
  updateOrderStatus,
  publishFinalKit,
  attachChatThread,
} = kitDesignSlice.actions;

export const selectKitProjectsByTeam = (state: { kitDesign: KitDesignState }, teamId: string) =>
  state.kitDesign.projects.filter((project) => project.teamId === teamId);

export const selectCanvaTemplates = (state: { kitDesign: KitDesignState }) =>
  state.kitDesign.canvaTemplates;

export const selectKitPromptLibrary = (state: { kitDesign: KitDesignState }) =>
  state.kitDesign.promptLibrary;

export const selectVendorCatalog = (state: { kitDesign: KitDesignState }) =>
  state.kitDesign.vendorCatalog;

export default kitDesignSlice.reducer;
