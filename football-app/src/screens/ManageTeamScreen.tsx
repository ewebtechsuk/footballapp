import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  FormationPositionKey,
  TeamMember,
  TeamRole,
  TeamSettings,
  defaultTeamSettings,
  updateTeam,
} from '../store/slices/teamsSlice';
import AuthenticatedScreenContainer from '../components/AuthenticatedScreenContainer';
import PitchFormation from '../components/PitchFormation';
import KitDesignBoard from '../components/KitDesignBoard';
import TeamChatPanel from '../components/TeamChatPanel';
import {
  acceptFixtureKickoff,
  formatKickoffTime,
  getFixtureStartDate,
  proposeFixture,
  recordFixtureResult,
  selectFixturesByTeam,
  syncFixtureToCalendar,
  voteOnKickoff,
} from '../store/slices/scheduleSlice';
import {
  createOpenPosition,
  inviteFreeAgent,
  selectFreeAgents,
  selectOpenPositionsForTeam,
  updateOpenPositionStatus,
} from '../store/slices/scoutingSlice';
import type { TransferListing } from '../store/slices/transferMarketSlice';
import { placeTransferBid, selectShortlistForTeam, selectTransferListings, toggleShortlistEntry } from '../store/slices/transferMarketSlice';
import {
  markSessionCompleted,
  recordAttributeGain,
  selectPlayerDevelopmentProfiles,
  selectRecommendedDrills,
  selectTrainingPlanForTeam,
} from '../store/slices/playerDevelopmentSlice';
import {
  CommunicationAudience,
  CommunicationCategory,
  CommunicationChannel,
  recordCommunicationResponse,
  scheduleCommunication,
  selectCommunicationStatsForTeam,
  selectCommunicationsForTeam,
  selectUpcomingCommunicationsForTeam,
  updateCommunicationStatus,
} from '../store/slices/communicationsSlice';
import type { DiscoveredTeam, TeamDiscoveryScope } from '../services/teamDiscovery';
import { searchTeams } from '../services/teamDiscovery';

type ManageTeamRouteProp = RouteProp<RootStackParamList, 'ManageTeam'>;
type ManageTeamNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManageTeam'>;

const TEAM_ROLES: TeamRole[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Substitute'];

const COMMUNICATION_CATEGORIES: {
  value: CommunicationCategory;
  label: string;
  helper: string;
}[] = [
  {
    value: 'announcement',
    label: 'Announcement',
    helper: 'Great for weekly touchpoints, training reminders, and community news.',
  },
  {
    value: 'logistics',
    label: 'Logistics',
    helper: 'Share travel details, meeting points, and kit colours before matchday.',
  },
  {
    value: 'lineup',
    label: 'Lineup',
    helper: 'Reveal the starting eleven and rotation plans once votes are collected.',
  },
  {
    value: 'celebration',
    label: 'Celebration',
    helper: 'Recognise player milestones and post-match highlights to boost morale.',
  },
];

const COMMUNICATION_CHANNELS: { value: CommunicationChannel; label: string }[] = [
  { value: 'push', label: 'Push' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

const COMMUNICATION_AUDIENCES: {
  value: CommunicationAudience;
  label: string;
  helper: string;
}[] = [
  {
    value: 'everyone',
    label: 'Whole squad',
    helper: 'Send to every registered teammate for maximum visibility.',
  },
  {
    value: 'captains',
    label: 'Captains & staff',
    helper: 'Target decision makers to align on tactics or club admin tasks.',
  },
  {
    value: 'availablePlayers',
    label: 'Available players',
    helper: 'Nudge the players who marked themselves free for the next fixture.',
  },
  {
    value: 'trialists',
    label: 'Trialists',
    helper: 'Keep prospects engaged with onboarding tips and schedule updates.',
  },
];

const DEFAULT_COMMUNICATION_STATS = {
  total: 0,
  sent: 0,
  upcoming: 0,
  reminderCount: 0,
  averageResponseRate: 0,
  lastSentAt: null as string | null,
};

const determineDefaultRole = (index: number): TeamRole => {
  if (index === 0) {
    return 'Goalkeeper';
  }

  if (index <= 4) {
    return 'Defender';
  }

  if (index <= 8) {
    return 'Midfielder';
  }

  return 'Forward';
};

const createTeamMemberFromName = (name: string, existingMembers: TeamMember[]): TeamMember => {
  const index = existingMembers.length;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    role: determineDefaultRole(index),
    position: null,
    isCaptain: existingMembers.length === 0,
  };
};

const ManageTeamScreen: React.FC = () => {
  const route = useRoute<ManageTeamRouteProp>();
  const navigation = useNavigation<ManageTeamNavigationProp>();
  const dispatch = useAppDispatch();

  const teamId = route.params?.teamId ?? null;

  const team = useAppSelector((state) =>
    teamId ? state.teams.teams.find((currentTeam) => currentTeam.id === teamId) : undefined,
  );
  const fixtures = useAppSelector((state) =>
    teamId ? selectFixturesByTeam(state, teamId) : [],
  );
  const openPositions = useAppSelector((state) =>
    teamId ? selectOpenPositionsForTeam(state, teamId) : [],
  );
  const marketplaceFreeAgents = useAppSelector(selectFreeAgents);
  const transferListings = useAppSelector(selectTransferListings);
  const shortlistEntries = useAppSelector((state) => selectShortlistForTeam(state, teamId));
  const trainingPlan = useAppSelector((state) => selectTrainingPlanForTeam(state, teamId ?? undefined));
  const recommendedDrills = useAppSelector(selectRecommendedDrills);
  const developmentProfiles = useAppSelector(selectPlayerDevelopmentProfiles);
  const scoutingReports = useAppSelector((state) => state.transferMarket.scoutingReports);

  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState('');
  const [settings, setSettings] = useState<TeamSettings>(defaultTeamSettings);
  const [usernameQuery, setUsernameQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [fixtureOpponent, setFixtureOpponent] = useState('');
  const [fixtureLocation, setFixtureLocation] = useState('');
  const [fixtureOptionOne, setFixtureOptionOne] = useState('');
  const [fixtureOptionTwo, setFixtureOptionTwo] = useState('');
  const [fixtureNotes, setFixtureNotes] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [positionCommitment, setPositionCommitment] = useState<'casual' | 'competitive'>(
    'competitive',
  );
  const [positionDescription, setPositionDescription] = useState('');
  const [communicationTitle, setCommunicationTitle] = useState('');
  const [communicationMessage, setCommunicationMessage] = useState('');
  const [communicationCategory, setCommunicationCategory] =
    useState<CommunicationCategory>('announcement');
  const [communicationAudience, setCommunicationAudience] =
    useState<CommunicationAudience>('everyone');
  const [communicationChannels, setCommunicationChannels] = useState<CommunicationChannel[]>([
    'push',
    'email',
  ]);
  const [communicationSchedule, setCommunicationSchedule] = useState('');
  const [communicationReminderEnabled, setCommunicationReminderEnabled] = useState(true);
  const [communicationRequiresResponse, setCommunicationRequiresResponse] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<TeamDiscoveryScope>('local');
  const [searchResults, setSearchResults] = useState<DiscoveredTeam[]>([]);
  const [isSearchingTeams, setIsSearchingTeams] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const communications = useAppSelector((state) =>
    teamId ? selectCommunicationsForTeam(state, teamId) : [],
  );
  const upcomingCommunications = useAppSelector((state) =>
    teamId ? selectUpcomingCommunicationsForTeam(state, teamId) : [],
  );
  const communicationStats = useAppSelector((state) =>
    teamId ? selectCommunicationStatsForTeam(state, teamId) : DEFAULT_COMMUNICATION_STATS,
  );
  const latestSentCommunication = useMemo(() => {
    return communications.find((communication) => communication.status === 'sent') ?? null;
  }, [communications]);
  const lastCommunicationSummary = useMemo(() => {
    if (!communicationStats.lastSentAt) {
      return 'No updates sent yet — start with an availability check-in.';
    }

    const date = new Date(communicationStats.lastSentAt);
    return `Last update sent ${date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }, [communicationStats.lastSentAt]);

  useEffect(() => {
    if (team) {
      setTeamName(team.name);
      setMembers(team.members);
      setSettings(team.settings);
      const captain = team.members.find((member) => member.isCaptain);
      setSelectedMemberId(captain?.id ?? team.members[0]?.id ?? null);
    }
  }, [team]);

  const invitationLink = useMemo(() => {
    if (!teamId) {
      return 'https://football.app/team';
    }

    return `https://football.app/team/${teamId}`;
  }, [teamId]);
  const invitationMessage = useMemo(() => {
    const trimmedName = teamName.trim();
    const displayName = trimmedName.length > 0 ? trimmedName : 'my Football App squad';

    return `Join ${displayName} on Football App! Use the link ${invitationLink} to connect and see upcoming matches.`;
  }, [invitationLink, teamName]);

  const sortedFixtures = useMemo(() => {
    return fixtures
      .slice()
      .sort((a, b) => {
        const aDate = getFixtureStartDate(a);
        const bDate = getFixtureStartDate(b);
        const aTime = aDate ? aDate.getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = bDate ? bDate.getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
  }, [fixtures]);
  const shortlistWithReports = useMemo(
    () =>
      shortlistEntries.map((entry) => ({
        entry,
        report: scoutingReports.find((report) => report.playerId === entry.playerId),
      })),
    [scoutingReports, shortlistEntries],
  );
  const developmentSnapshot = useMemo(() => developmentProfiles.slice(0, 3), [developmentProfiles]);

  const toggleSetting = (key: keyof TeamSettings) => {
    setSettings((previousSettings) => ({
      ...previousSettings,
      [key]: !previousSettings[key],
    }));
  };

  const handleAddMember = () => {
    const trimmedMember = newMember.trim();

    if (!trimmedMember) {
      Alert.alert('Missing name', 'Enter a name or email before adding a new team member.');
      return;
    }

    if (members.some((member) => member.name.toLowerCase() === trimmedMember.toLowerCase())) {
      Alert.alert('Already added', `${trimmedMember} is already part of your roster.`);
      return;
    }

    setMembers((previousMembers) => {
      const cleanedName = trimmedMember;
      const newMemberEntry = createTeamMemberFromName(cleanedName, previousMembers);

      const updatedMembers = [...previousMembers.map((member) => ({ ...member })), newMemberEntry];

      setSelectedMemberId(newMemberEntry.id);

      return updatedMembers;
    });
    setNewMember('');
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers((previousMembers) => {
      const filteredMembers = previousMembers
        .filter((member) => member.id !== memberId)
        .map((member) => ({ ...member }));

      if (filteredMembers.length > 0 && !filteredMembers.some((member) => member.isCaptain)) {
        filteredMembers.forEach((member, index) => {
          filteredMembers[index] = { ...member, isCaptain: index === 0 };
        });
        setSelectedMemberId((currentSelected) =>
          currentSelected === memberId ? filteredMembers[0].id : currentSelected,
        );
      } else if (filteredMembers.length === 0) {
        setSelectedMemberId(null);
      } else if (filteredMembers.some((member) => member.isCaptain)) {
        const captain = filteredMembers.find((member) => member.isCaptain);
        setSelectedMemberId((currentSelected) =>
          currentSelected === memberId ? captain?.id ?? filteredMembers[0].id : currentSelected,
        );
      }

      return filteredMembers;
    });
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId((currentSelected) => (currentSelected === memberId ? null : memberId));
  };

  const handleCycleRole = (memberId: string) => {
    setMembers((previousMembers) =>
      previousMembers.map((member) => {
        if (member.id !== memberId) {
          return member;
        }

        const currentIndex = Math.max(0, TEAM_ROLES.indexOf(member.role));
        const nextRole = TEAM_ROLES[(currentIndex + 1) % TEAM_ROLES.length];

        return { ...member, role: nextRole };
      }),
    );
  };

  const handleSetCaptain = (memberId: string) => {
    setMembers((previousMembers) =>
      previousMembers.map((member) => ({
        ...member,
        isCaptain: member.id === memberId,
      })),
    );
    setSelectedMemberId(memberId);
  };

  const handleClearPosition = (memberId: string) => {
    setMembers((previousMembers) =>
      previousMembers.map((member) =>
        member.id === memberId ? { ...member, position: null } : member,
      ),
    );
  };

  const handleSpotPress = (positionKey: FormationPositionKey, occupantId: string | null) => {
    if (!selectedMemberId) {
      if (occupantId) {
        setMembers((previousMembers) =>
          previousMembers.map((member) =>
            member.id === occupantId ? { ...member, position: null } : member,
          ),
        );
      } else {
        Alert.alert('Select a player', 'Choose a player from the roster before assigning a position.');
      }
      return;
    }

    if (occupantId && occupantId === selectedMemberId) {
      setMembers((previousMembers) =>
        previousMembers.map((member) =>
          member.id === selectedMemberId ? { ...member, position: null } : member,
        ),
      );
      return;
    }

    setMembers((previousMembers) =>
      previousMembers.map((member) => {
        if (member.id === selectedMemberId) {
          return { ...member, position: positionKey };
        }

        if (member.position === positionKey) {
          return { ...member, position: null };
        }

        return member;
      }),
    );
  };

  const parseKickoffInput = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const formatted = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
    const candidate = new Date(formatted);
    if (Number.isNaN(candidate.getTime())) {
      return null;
    }

    return candidate.toISOString();
  };

  const handleToggleCommunicationChannel = (channel: CommunicationChannel) => {
    setCommunicationChannels((previous) => {
      if (previous.includes(channel)) {
        return previous.filter((value) => value !== channel);
      }

      return [...previous, channel];
    });
  };

  const handlePlanCommunication = () => {
    if (!teamId) {
      Alert.alert('Select a team', 'Create and save your team before sending updates.');
      return;
    }

    const trimmedTitle = communicationTitle.trim();
    const trimmedMessage = communicationMessage.trim();

    if (!trimmedTitle || !trimmedMessage) {
      Alert.alert('Add communication details', 'Include a title and message before sending.');
      return;
    }

    if (communicationChannels.length === 0) {
      Alert.alert('Select channels', 'Pick at least one delivery channel for this update.');
      return;
    }

    let scheduledIso: string | null = null;
    if (communicationSchedule.trim()) {
      const parsed = parseKickoffInput(communicationSchedule);
      if (!parsed) {
        Alert.alert('Invalid time', 'Use YYYY-MM-DD HH:MM (24hr) when scheduling an update.');
        return;
      }

      scheduledIso = parsed;
    }

    dispatch(
      scheduleCommunication({
        teamId,
        title: trimmedTitle,
        body: trimmedMessage,
        category: communicationCategory,
        audience: communicationAudience,
        channels: communicationChannels,
        scheduledFor: scheduledIso,
        followUpReminderMinutes: communicationReminderEnabled ? 1440 : null,
        requiresResponse: communicationRequiresResponse,
        expectedResponders: communicationRequiresResponse ? members.length : 0,
      }),
    );

    if (scheduledIso) {
      Alert.alert('Update scheduled', 'We will deliver this message at the selected time.');
    } else {
      Alert.alert('Update sent', 'Your squad will receive the announcement immediately.');
    }

    setCommunicationTitle('');
    setCommunicationMessage('');
    setCommunicationSchedule('');
    setCommunicationRequiresResponse(false);
  };

  const handleMarkCommunicationSent = (communicationId: string) => {
    dispatch(updateCommunicationStatus({ id: communicationId, status: 'sent' }));
    Alert.alert('Marked as sent', 'The communication timeline has been updated.');
  };

  const handleLogCommunicationResponse = (
    communicationId: string,
    response: 'confirmed' | 'declined',
  ) => {
    dispatch(recordCommunicationResponse({ id: communicationId, response }));

    Alert.alert(
      'Response logged',
      response === 'confirmed'
        ? 'Confirmation added. Keep nudging remaining players if needed.'
        : 'Decline recorded. Adjust your lineup or follow up with them directly.',
    );
  };

  const handleProposeFixture = () => {
    const trimmedOpponent = fixtureOpponent.trim();
    const trimmedLocation = fixtureLocation.trim();

    if (!teamId) {
      Alert.alert('Team unavailable', 'Create a team before proposing fixtures.');
      return;
    }

    if (!trimmedOpponent || !trimmedLocation) {
      Alert.alert('Missing fixture details', 'Add an opponent and location to propose a match.');
      return;
    }

    const optionIsoStrings = [fixtureOptionOne, fixtureOptionTwo]
      .map((option) => parseKickoffInput(option))
      .filter((option): option is string => Boolean(option));

    if (optionIsoStrings.length === 0) {
      Alert.alert(
        'Add kickoff options',
        'Provide at least one kickoff time using YYYY-MM-DD HH:MM (24hr) format.',
      );
      return;
    }

    dispatch(
      proposeFixture({
        teamId,
        opponent: trimmedOpponent,
        location: trimmedLocation,
        kickoffOptions: optionIsoStrings,
        notes: fixtureNotes.trim() || undefined,
      }),
    );

    setFixtureOpponent('');
    setFixtureLocation('');
    setFixtureOptionOne('');
    setFixtureOptionTwo('');
    setFixtureNotes('');

    Alert.alert('Fixture proposed', 'Your squad can now vote on the kickoff time.');
  };

  const handleVoteOnKickoff = (fixtureId: string, optionId: string) => {
    dispatch(voteOnKickoff({ fixtureId, optionId }));
    Alert.alert('Vote recorded', 'Your preference has been counted.');
  };

  const handleAcceptKickoff = (fixtureId: string, optionId: string) => {
    dispatch(acceptFixtureKickoff({ fixtureId, optionId }));
    Alert.alert('Kickoff locked in', 'Share the confirmed time with the opposition.');
  };

  const handleSyncFixture = (fixtureId: string) => {
    dispatch(syncFixtureToCalendar({ fixtureId }));
    Alert.alert('Calendar sync', 'The fixture has been marked as synced to device calendars.');
  };

  const handleRecordFixtureResult = (fixtureId: string, result: 'win' | 'loss' | 'draw') => {
    dispatch(recordFixtureResult({ fixtureId, result }));
    Alert.alert('Result saved', 'Team records on the Team screen have been updated.');
  };

  const handleCreateOpenPosition = () => {
    const trimmedTitle = positionTitle.trim();
    const trimmedDescription = positionDescription.trim();

    if (!teamId) {
      Alert.alert('Team unavailable', 'Create a team before publishing listings.');
      return;
    }

    if (!trimmedTitle || !trimmedDescription) {
      Alert.alert('Add listing details', 'Describe the role and expectations before publishing.');
      return;
    }

    dispatch(
      createOpenPosition({
        teamId,
        position: trimmedTitle,
        commitmentLevel: positionCommitment,
        description: trimmedDescription,
      }),
    );

    setPositionTitle('');
    setPositionDescription('');
    setPositionCommitment('competitive');

    Alert.alert('Listing published', 'Free agents can now apply to join this spot.');
  };

  const handleUpdateListingStatus = (listingId: string, status: 'open' | 'inviting' | 'filled') => {
    dispatch(updateOpenPositionStatus({ positionId: listingId, status }));
  };

  const handleInviteMarketplacePlayer = (freeAgentId: string, name: string) => {
    if (!teamId) {
      Alert.alert('Team unavailable', 'Create a team before inviting free agents.');
      return;
    }

    dispatch(inviteFreeAgent({ freeAgentId, teamId }));
    Alert.alert('Invite sent', `${name} has received your scouting invite.`);
  };

  const handleToggleShortlistPlayer = (playerId: string) => {
    if (!teamId) {
      Alert.alert('Team unavailable', 'Create a team before managing a shortlist.');
      return;
    }

    dispatch(toggleShortlistEntry({ teamId, playerId }));
  };

  const handlePlaceBidOnListing = (listing: TransferListing) => {
    if (!teamId) {
      Alert.alert('Team unavailable', 'Create a team before placing transfer bids.');
      return;
    }

    const nextBid = listing.currentBid > 0 ? listing.currentBid + 5 : listing.askingPrice;
    dispatch(placeTransferBid({ listingId: listing.id, teamId, amount: nextBid }));
    Alert.alert('Bid submitted', `Bid of ${nextBid} credits placed for this player.`);
  };

  const handleToggleTrainingSession = (sessionId: string, completed: boolean) => {
    if (!trainingPlan) {
      return;
    }

    dispatch(markSessionCompleted({ planId: trainingPlan.id, sessionId, completed }));
  };

  const handleRecordDevelopmentGain = (playerId: string, attribute: string) => {
    dispatch(recordAttributeGain({ playerId, attribute, delta: 1 }));
    Alert.alert('Progress logged', `${attribute} focus added to this player.`);
  };

  const handleInviteFromContacts = () => {
    Alert.alert(
      'Invite from contacts',
      'This would open your phone book so you can pick players to invite directly from your contacts.',
    );
  };

  const handleInviteByUsername = () => {
    const trimmedQuery = usernameQuery.trim();

    if (!trimmedQuery) {
      Alert.alert('Enter a username', 'Search for a player by typing their Football App username.');
      return;
    }

    Alert.alert('Invite sent', `${trimmedQuery} has been invited to join ${teamName || 'your team'}.`);
    setUsernameQuery('');
  };

  const performTeamSearch = useCallback(
    async (scope: TeamDiscoveryScope, query: string) => {
      setIsSearchingTeams(true);
      setSearchError(null);

      try {
        const results = await searchTeams(scope, query);
        setSearchResults(results);

        if (results.length === 0) {
          setSearchError('No teams match your search yet. Try broadening the keywords.');
        }
      } catch (error) {
        setSearchError('We could not load teams right now. Please try again shortly.');
      } finally {
        setIsSearchingTeams(false);
      }
    },
    [],
  );

  const handleSearchTeams = useCallback(() => {
    performTeamSearch(searchScope, teamSearchQuery.trim());
  }, [performTeamSearch, searchScope, teamSearchQuery]);

  const handleScopeChange = useCallback(
    (nextScope: TeamDiscoveryScope) => {
      if (nextScope === searchScope) {
        return;
      }

      setSearchScope(nextScope);
      performTeamSearch(nextScope, teamSearchQuery.trim());
    },
    [performTeamSearch, searchScope, teamSearchQuery],
  );

  useEffect(() => {
    performTeamSearch('local', '');
  }, [performTeamSearch]);

  const handleChallengeTeam = (opponent: DiscoveredTeam) => {
    const trimmedName = teamName.trim();
    const displayTeamName = trimmedName.length > 0 ? trimmedName : 'your team';

    Alert.alert(
      'Challenge sent',
      `We'll notify ${opponent.name} that ${displayTeamName} would like to arrange a match. We'll message you when they respond.`,
    );
  };

  const openLink = useCallback(async (url: string, unavailableMessage: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert('Unavailable', unavailableMessage);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Unable to share', 'Something went wrong while trying to open the selected app.');
    }
  }, []);

  const encodedMessage = useMemo(() => encodeURIComponent(`${invitationMessage}`), [invitationMessage]);
  const encodedLink = useMemo(() => encodeURIComponent(invitationLink), [invitationLink]);

  const handleInviteViaWhatsApp = () =>
    openLink(
      `whatsapp://send?text=${encodedMessage}`,
      'WhatsApp does not appear to be installed on this device.',
    );

  const handleInviteViaEmail = () =>
    openLink(
      `mailto:?subject=${encodeURIComponent('Join my Football App team')}&body=${encodedMessage}`,
      'Email sharing is not available on this device.',
    );

  const handleInviteViaFacebook = () =>
    openLink(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedMessage}`,
      'Facebook sharing is not available right now.',
    );

  const handleInviteViaX = () =>
    openLink(
      `https://twitter.com/intent/tweet?text=${encodedMessage}`,
      'X (Twitter) is not available right now.',
    );

  const handleInviteViaInstagram = () =>
    openLink(
      `https://www.instagram.com/direct/new/?text=${encodedMessage}`,
      'Instagram Direct sharing is not available on this device.',
    );

  const handleSaveChanges = () => {
    const trimmedName = teamName.trim();

    if (!trimmedName) {
      Alert.alert('Missing team name', 'Add a team name so your players know who they are joining.');
      return;
    }

    const cleanedMembers = members
      .map((member) => ({
        ...member,
        name: member.name.trim(),
      }))
      .filter((member) => member.name.length > 0);

    const ensuredCaptainMembers = cleanedMembers.some((member) => member.isCaptain)
      ? cleanedMembers
      : cleanedMembers.map((member, index) => ({
          ...member,
          isCaptain: index === 0,
        }));

    if (!teamId) {
      Alert.alert('Team unavailable', 'We could not determine which team to update.');
      return;
    }

    dispatch(
      updateTeam({
        id: teamId,
        name: trimmedName,
        members: ensuredCaptainMembers,
        settings,
      }),
    );

    Alert.alert('Team updated', `${trimmedName} has been updated.`);
    navigation.goBack();
  };

  if (!teamId) {
    return (
      <AuthenticatedScreenContainer style={styles.safeArea} contentStyle={styles.messageContainer}>
        <View style={styles.messageCard}>
          <Text style={styles.title}>Team unavailable</Text>
          <Text style={styles.subtitle}>
            We could not determine which team you wanted to manage. Please go back and try again.
          </Text>
        </View>
      </AuthenticatedScreenContainer>
    );
  }

  if (!team) {
    return (
      <AuthenticatedScreenContainer style={styles.safeArea} contentStyle={styles.messageContainer}>
        <View style={styles.messageCard}>
          <Text style={styles.title}>Team not found</Text>
          <Text style={styles.subtitle}>The team you are trying to manage could not be located.</Text>
        </View>
      </AuthenticatedScreenContainer>
    );
  }

  return (
    <AuthenticatedScreenContainer style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.title}>Team details</Text>
          <Text style={styles.subtitle}>Update your team name and roster.</Text>

          <View style={styles.formField}>
            <Text style={styles.label}>Team name</Text>
            <TextInput
              value={teamName}
              onChangeText={setTeamName}
              placeholder="e.g. Hackney FC"
              style={styles.input}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Current roster</Text>
            {members.length === 0 ? (
              <Text style={styles.emptyState}>No members yet. Start by inviting your first player.</Text>
            ) : (
              <View style={styles.memberList}>
                {members.map((member) => (
                  <View
                    key={member.id}
                    style={[styles.memberCard, selectedMemberId === member.id && styles.memberCardSelected]}
                  >
                    <TouchableOpacity
                      style={styles.memberCardBody}
                      onPress={() => handleSelectMember(member.id)}
                    >
                      <View style={styles.memberHeaderRow}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        {member.isCaptain ? <Text style={styles.captainBadge}>Captain</Text> : null}
                      </View>
                      <Text style={styles.memberPositionText}>
                        {member.position ? `Pitch position: ${member.position}` : 'Not placed on the pitch yet'}
                      </Text>
                      <Text style={styles.memberSelectHint}>
                        {selectedMemberId === member.id
                          ? 'Selected for pitch placement'
                          : 'Tap to select and place on the pitch'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.memberFooterRow}>
                      <TouchableOpacity
                        style={styles.roleButton}
                        onPress={() => handleCycleRole(member.id)}
                      >
                        <Text style={styles.roleButtonText}>{member.role}</Text>
                        <Text style={styles.roleButtonHint}>Change role</Text>
                      </TouchableOpacity>

                      <View style={styles.memberActionGroup}>
                        <TouchableOpacity
                          style={styles.secondaryAction}
                          onPress={() => handleClearPosition(member.id)}
                        >
                          <Text style={styles.secondaryActionText}>Clear spot</Text>
                        </TouchableOpacity>
                        {member.isCaptain ? null : (
                          <TouchableOpacity
                            style={styles.secondaryAction}
                            onPress={() => handleSetCaptain(member.id)}
                          >
                            <Text style={styles.secondaryActionText}>Make captain</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.removeAction}
                          onPress={() => handleRemoveMember(member.id)}
                        >
                          <Text style={styles.removeActionText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
        </View>

        <View style={styles.addMemberRow}>
          <TextInput
            value={newMember}
              onChangeText={setNewMember}
              placeholder="Add member by name or email"
              style={[styles.input, styles.addMemberInput]}
            />
            <TouchableOpacity style={styles.addMemberButton} onPress={handleAddMember}>
              <Text style={styles.addMemberButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team structure</Text>
          <Text style={styles.sectionSubtitle}>
            Select a player from the roster, then tap a marker to place them on the pitch.
          </Text>

          <PitchFormation
            members={members}
            selectedMemberId={selectedMemberId}
            onSpotPress={handleSpotPress}
          />

          <Text style={styles.pitchInstructions}>
            The captain is highlighted with a badge and can be reassigned at any time.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team settings</Text>
          <Text style={styles.sectionSubtitle}>
            Control how teammates join and how they receive updates.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Allow join requests</Text>
              <Text style={styles.settingDescription}>
                Let players request to join using your public team link.
              </Text>
            </View>
            <Switch
              value={settings.allowJoinRequests}
              onValueChange={() => toggleSetting('allowJoinRequests')}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Notify roster changes</Text>
              <Text style={styles.settingDescription}>
                Send a push notification to members whenever you update the squad.
              </Text>
            </View>
            <Switch
              value={settings.notifyMembersOfChanges}
              onValueChange={() => toggleSetting('notifyMembersOfChanges')}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Share availability calendar</Text>
              <Text style={styles.settingDescription}>
                Give teammates access to see availability and match commitments.
              </Text>
            </View>
            <Switch
              value={settings.shareAvailabilityCalendar}
              onValueChange={() => toggleSetting('shareAvailabilityCalendar')}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Auto collect match stats</Text>
              <Text style={styles.settingDescription}>
                Automatically collect player stats when matches are recorded.
              </Text>
            </View>
            <Switch
              value={settings.autoCollectMatchStats}
              onValueChange={() => toggleSetting('autoCollectMatchStats')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team communication</Text>
          <Text style={styles.sectionSubtitle}>
            Coordinate announcements, automate reminders, and capture squad feedback in one place.
          </Text>

          <View style={styles.communicationSummaryCard}>
            <View style={styles.communicationSummaryRow}>
              <View style={styles.communicationMetric}>
                <Text style={styles.communicationMetricValue}>{communicationStats.sent}</Text>
                <Text style={styles.communicationMetricLabel}>Sent</Text>
              </View>
              <View style={styles.communicationMetric}>
                <Text style={styles.communicationMetricValue}>{communicationStats.upcoming}</Text>
                <Text style={styles.communicationMetricLabel}>Scheduled</Text>
              </View>
              <View style={styles.communicationMetric}>
                <Text style={styles.communicationMetricValue}>
                  {communicationStats.averageResponseRate}%
                </Text>
                <Text style={styles.communicationMetricLabel}>Avg. response</Text>
              </View>
            </View>
            <Text style={styles.communicationSummaryFooter}>{lastCommunicationSummary}</Text>
            {latestSentCommunication ? (
              <Text style={styles.communicationSummaryHighlight}>
                Latest: {latestSentCommunication.title}
              </Text>
            ) : null}
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Template</Text>
            <View style={styles.communicationChipRow}>
              {COMMUNICATION_CATEGORIES.map((category) => {
                const isActive = communicationCategory === category.value;
                return (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.communicationChip,
                      isActive && styles.communicationChipActive,
                    ]}
                    onPress={() => setCommunicationCategory(category.value)}
                  >
                    <Text
                      style={[
                        styles.communicationChipText,
                        isActive && styles.communicationChipTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.helperText}>
              {COMMUNICATION_CATEGORIES.find((category) => category.value === communicationCategory)
                ?.helper || ''}
            </Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Headline</Text>
            <TextInput
              value={communicationTitle}
              onChangeText={setCommunicationTitle}
              placeholder="e.g. Availability for Saturday"
              style={styles.input}
            />
          </View>

          <View style={[styles.formField, styles.communicationMessageField]}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              value={communicationMessage}
              onChangeText={setCommunicationMessage}
              placeholder="Cover kickoff time, travel plans, and kit colours."
              style={[styles.input, styles.multilineInput]}
              multiline
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Audience</Text>
            <View style={styles.communicationAudienceList}>
              {COMMUNICATION_AUDIENCES.map((audience) => {
                const isActive = communicationAudience === audience.value;
                return (
                  <TouchableOpacity
                    key={audience.value}
                    style={[
                      styles.communicationAudienceCard,
                      isActive && styles.communicationAudienceCardActive,
                    ]}
                    onPress={() => setCommunicationAudience(audience.value)}
                  >
                    <Text style={styles.communicationAudienceTitle}>{audience.label}</Text>
                    <Text
                      style={[
                        styles.communicationAudienceDescription,
                        isActive && styles.communicationAudienceDescriptionActive,
                      ]}
                    >
                      {audience.helper}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Channels</Text>
            <View style={styles.communicationChannelRow}>
              {COMMUNICATION_CHANNELS.map((channel) => {
                const isActive = communicationChannels.includes(channel.value);
                return (
                  <TouchableOpacity
                    key={channel.value}
                    style={[
                      styles.communicationChannelChip,
                      isActive && styles.communicationChannelChipActive,
                    ]}
                    onPress={() => handleToggleCommunicationChannel(channel.value)}
                  >
                    <Text
                      style={[
                        styles.communicationChannelChipText,
                        isActive && styles.communicationChannelChipTextActive,
                      ]}
                    >
                      {channel.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.helperText}>Select one or more channels for delivery.</Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Send time (optional)</Text>
            <TextInput
              value={communicationSchedule}
              onChangeText={setCommunicationSchedule}
              placeholder="2024-07-18 19:30"
              style={styles.input}
            />
            <Text style={styles.helperText}>Leave blank to send immediately.</Text>
          </View>

          <View style={styles.communicationToggleRow}>
            <View style={styles.communicationToggleText}>
              <Text style={styles.settingLabel}>Schedule reminder</Text>
              <Text style={styles.settingDescription}>
                We'll nudge teammates 24 hours before the event when this is enabled.
              </Text>
            </View>
            <Switch
              value={communicationReminderEnabled}
              onValueChange={setCommunicationReminderEnabled}
            />
          </View>

          <View style={styles.communicationToggleRow}>
            <View style={styles.communicationToggleText}>
              <Text style={styles.settingLabel}>Require RSVP</Text>
              <Text style={styles.settingDescription}>
                Track confirmations from {members.length} teammates and keep absences visible.
              </Text>
            </View>
            <Switch
              value={communicationRequiresResponse}
              onValueChange={setCommunicationRequiresResponse}
            />
          </View>

          <TouchableOpacity style={styles.primaryActionButton} onPress={handlePlanCommunication}>
            <Text style={styles.primaryActionButtonText}>
              {communicationSchedule.trim() ? 'Schedule update' : 'Send update'}
            </Text>
          </TouchableOpacity>

          <View style={styles.communicationTimeline}>
            <Text style={styles.timelineHeading}>Upcoming messages</Text>
            {upcomingCommunications.length === 0 ? (
              <Text style={styles.emptyState}>
                No scheduled updates yet. Plan one so nobody misses vital information.
              </Text>
            ) : (
              upcomingCommunications.map((communication) => (
                <View key={communication.id} style={styles.timelineCard}>
                  <Text style={styles.timelineTitle}>{communication.title}</Text>
                  <Text style={styles.timelineMeta}>
                    {communication.scheduledFor
                      ? new Date(communication.scheduledFor).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Send manually'}
                  </Text>
                  <Text style={styles.timelineMeta}>
                    Channels: {communication.channels.join(', ')}
                  </Text>
                  <TouchableOpacity
                    style={styles.secondaryChip}
                    onPress={() => handleMarkCommunicationSent(communication.id)}
                  >
                    <Text style={styles.secondaryChipText}>Mark as sent</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <View style={styles.communicationTimeline}>
            <Text style={styles.timelineHeading}>Recent delivery</Text>
            {communications.filter((communication) => communication.status === 'sent').length === 0 ? (
              <Text style={styles.emptyState}>
                Send your first message to begin tracking player responses.
              </Text>
            ) : (
              communications
                .filter((communication) => communication.status === 'sent')
                .slice(0, 3)
                .map((communication) => {
                  const audienceLabel =
                    COMMUNICATION_AUDIENCES.find((audience) => audience.value === communication.audience)
                      ?.label ?? communication.audience;
                  return (
                    <View key={communication.id} style={styles.timelineCard}>
                      <Text style={styles.timelineTitle}>{communication.title}</Text>
                      <Text style={styles.timelineMeta}>
                        Sent{' '}
                        {new Date(communication.createdAt).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Text style={styles.timelineMeta}>Audience: {audienceLabel}</Text>
                      {communication.requiresResponse ? (
                        <>
                          <View style={styles.responseRow}>
                            <Text style={styles.responseStat}>
                              {communication.responseSummary.confirmed} confirmed
                            </Text>
                            <Text style={styles.responseStat}>
                              {communication.responseSummary.declined} declined
                            </Text>
                            <Text style={styles.responseStat}>
                              {communication.responseSummary.awaiting} awaiting
                            </Text>
                          </View>
                          <View style={styles.responseActions}>
                            <TouchableOpacity
                              style={[styles.secondaryChip, styles.responseActionChip]}
                              onPress={() => handleLogCommunicationResponse(communication.id, 'confirmed')}
                            >
                              <Text style={styles.secondaryChipText}>Log confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.secondaryChip, styles.responseActionChip]}
                              onPress={() => handleLogCommunicationResponse(communication.id, 'declined')}
                            >
                              <Text style={styles.secondaryChipText}>Log decline</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      ) : (
                        <Text style={styles.timelineMeta}>No RSVP required for this update.</Text>
                      )}
                    </View>
                  );
                })
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kit identity</Text>
          <Text style={styles.sectionSubtitle}>
            Spin up AI-powered designs, collect structured feedback, and hand off final assets to production without
            leaving the app.
          </Text>
          <KitDesignBoard teamId={teamId} teamName={team.name} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live chat control room</Text>
          <Text style={styles.sectionSubtitle}>
            Keep design debates, matchday logistics, and squad-wide announcements organised with contextual threads and
            polls.
          </Text>
          <TeamChatPanel teamId={teamId} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match scheduling</Text>
          <Text style={styles.sectionSubtitle}>
            Propose fixtures, gather kickoff votes, and sync accepted matches to player calendars.
          </Text>

          <View style={styles.formField}>
            <Text style={styles.label}>Opponent</Text>
            <TextInput
              value={fixtureOpponent}
              onChangeText={setFixtureOpponent}
              placeholder="e.g. West End Select"
              style={styles.input}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              value={fixtureLocation}
              onChangeText={setFixtureLocation}
              placeholder="Pitch or venue"
              style={styles.input}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Kickoff options</Text>
            <TextInput
              value={fixtureOptionOne}
              onChangeText={setFixtureOptionOne}
              placeholder="2024-07-14 19:30"
              style={styles.input}
            />
            <TextInput
              value={fixtureOptionTwo}
              onChangeText={setFixtureOptionTwo}
              placeholder="2024-07-15 18:00"
              style={styles.input}
            />
            <Text style={styles.helperText}>Use 24-hour time (YYYY-MM-DD HH:MM).</Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              value={fixtureNotes}
              onChangeText={setFixtureNotes}
              placeholder="Share broadcast or parking details"
              style={[styles.input, styles.multilineInput]}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.primaryActionButton} onPress={handleProposeFixture}>
            <Text style={styles.primaryActionButtonText}>Propose fixture</Text>
          </TouchableOpacity>

          <View style={styles.fixtureList}>
            {sortedFixtures.length === 0 ? (
              <Text style={styles.emptyState}>No fixtures yet. Start by proposing your first match.</Text>
            ) : (
              sortedFixtures.map((fixture) => {
                const statusLabel =
                  fixture.status === 'proposed'
                    ? 'Awaiting votes'
                    : fixture.status === 'scheduled'
                    ? fixture.calendarSynced
                      ? 'Synced to calendars'
                      : 'Kickoff locked in'
                    : fixture.result === 'win'
                    ? 'Result: Win'
                    : fixture.result === 'loss'
                    ? 'Result: Loss'
                    : 'Result: Draw';

                const kickoffDate = getFixtureStartDate(fixture);
                const kickoffLabel = kickoffDate
                  ? kickoffDate.toLocaleString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Kickoff to be confirmed';

                return (
                  <View key={fixture.id} style={styles.fixtureAdminCard}>
                    <View style={styles.fixtureHeaderRow}>
                      <View>
                        <Text style={styles.fixtureHeading}>{fixture.opponent}</Text>
                        <Text style={styles.fixtureSubheading}>{fixture.location}</Text>
                        <Text style={styles.fixtureSubheading}>{kickoffLabel}</Text>
                      </View>
                      <Text style={styles.fixtureStatusPill}>{statusLabel}</Text>
                    </View>

                    {fixture.notes ? <Text style={styles.fixtureNotes}>{fixture.notes}</Text> : null}

                    <View style={styles.kickoffOptionList}>
                      {fixture.kickoffOptions.map((option) => {
                        const isAccepted = fixture.acceptedKickoffOptionId === option.id;
                        return (
                          <View key={option.id} style={styles.kickoffOptionRow}>
                            <View style={styles.kickoffOptionInfo}>
                              <Text style={styles.kickoffOptionLabel}>{formatKickoffTime(option.isoTime)}</Text>
                              <Text style={styles.kickoffOptionVotes}>{option.votes} votes</Text>
                            </View>
                            {fixture.status === 'proposed' ? (
                              <View style={styles.kickoffOptionActions}>
                                <TouchableOpacity
                                  style={styles.secondaryChip}
                                  onPress={() => handleVoteOnKickoff(fixture.id, option.id)}
                                >
                                  <Text style={styles.secondaryChipText}>Vote</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.secondaryChip}
                                  onPress={() => handleAcceptKickoff(fixture.id, option.id)}
                                >
                                  <Text style={styles.secondaryChipText}>Accept</Text>
                                </TouchableOpacity>
                              </View>
                            ) : isAccepted ? (
                              <Text style={styles.acceptedLabel}>Chosen slot</Text>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>

                    {fixture.status === 'scheduled' && !fixture.calendarSynced ? (
                      <TouchableOpacity
                        style={styles.secondaryChip}
                        onPress={() => handleSyncFixture(fixture.id)}
                      >
                        <Text style={styles.secondaryChipText}>Mark as synced</Text>
                      </TouchableOpacity>
                    ) : null}

                    {fixture.status === 'scheduled' ? (
                      <View style={styles.resultActionBlock}>
                        <Text style={styles.resultActionTitle}>Record result</Text>
                        <View style={styles.resultActionRow}>
                          <TouchableOpacity
                            style={[styles.resultChip, styles.resultChipWin]}
                            onPress={() => handleRecordFixtureResult(fixture.id, 'win')}
                          >
                            <Text style={styles.resultChipText}>Win</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.resultChip, styles.resultChipDraw]}
                            onPress={() => handleRecordFixtureResult(fixture.id, 'draw')}
                          >
                            <Text style={styles.resultChipText}>Draw</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.resultChip, styles.resultChipLoss]}
                            onPress={() => handleRecordFixtureResult(fixture.id, 'loss')}
                          >
                            <Text style={styles.resultChipText}>Loss</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scouting marketplace</Text>
          <Text style={styles.sectionSubtitle}>
            Publish open positions, review interested free agents, and invite them with one tap.
          </Text>

          <View style={styles.formField}>
            <Text style={styles.label}>Role headline</Text>
            <TextInput
              value={positionTitle}
              onChangeText={setPositionTitle}
              placeholder="e.g. Ball-playing centre back"
              style={styles.input}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Commitment</Text>
            <View style={styles.commitmentToggle}>
              {(['competitive', 'casual'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.commitmentPill,
                    positionCommitment === level && styles.commitmentPillActive,
                  ]}
                  onPress={() => setPositionCommitment(level)}
                >
                  <Text
                    style={[
                      styles.commitmentPillText,
                      positionCommitment === level && styles.commitmentPillTextActive,
                    ]}
                  >
                    {level === 'competitive' ? 'Competitive' : 'Casual'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Listing details</Text>
            <TextInput
              value={positionDescription}
              onChangeText={setPositionDescription}
              placeholder="Share playing style, availability windows, or perks"
              style={[styles.input, styles.multilineInput]}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.primaryActionButton} onPress={handleCreateOpenPosition}>
            <Text style={styles.primaryActionButtonText}>Publish listing</Text>
          </TouchableOpacity>

          <View style={styles.marketplaceSection}>
            <Text style={styles.marketplaceHeading}>Active listings</Text>
            {openPositions.length === 0 ? (
              <Text style={styles.emptyState}>No openings right now. Publish a listing above.</Text>
            ) : (
              openPositions.map((position) => {
                const createdDate = new Date(position.createdAt);
                return (
                  <View key={position.id} style={styles.listingCard}>
                    <View style={styles.listingHeader}>
                      <Text style={styles.listingTitle}>{position.position}</Text>
                      <Text style={styles.listingStatus}>{position.status.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.listingMeta}>
                      {position.commitmentLevel === 'competitive'
                        ? 'Competitive weekly commitment'
                        : 'Casual / flexible availability'}
                    </Text>
                    <Text style={styles.listingDescription}>{position.description}</Text>
                    <Text style={styles.listingMeta}>
                      Posted {createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                    <View style={styles.listingActions}>
                      {position.status !== 'filled' ? (
                        <TouchableOpacity
                          style={styles.secondaryChip}
                          onPress={() => handleUpdateListingStatus(position.id, 'filled')}
                        >
                          <Text style={styles.secondaryChipText}>Mark filled</Text>
                        </TouchableOpacity>
                      ) : null}
                      {position.status === 'open' ? (
                        <TouchableOpacity
                          style={styles.secondaryChip}
                          onPress={() => handleUpdateListingStatus(position.id, 'inviting')}
                        >
                          <Text style={styles.secondaryChipText}>Start inviting</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.marketplaceSection}>
            <Text style={styles.marketplaceHeading}>Recommended free agents</Text>
            {marketplaceFreeAgents.length === 0 ? (
              <Text style={styles.emptyState}>Marketplace is quiet right now. Check back soon.</Text>
            ) : (
              marketplaceFreeAgents.map((agent) => {
                const alreadyInvited = teamId
                  ? agent.invitedByTeamIds.includes(teamId)
                  : false;
                return (
                  <View key={agent.id} style={styles.freeAgentCard}>
                    <View style={styles.freeAgentHeader}>
                      <View style={styles.freeAgentInfo}>
                        <Text style={styles.freeAgentName}>{agent.name}</Text>
                        <Text style={styles.freeAgentRole}>
                          {agent.primaryPosition}
                          {agent.secondaryPosition ? ` • ${agent.secondaryPosition}` : ''}
                        </Text>
                        <Text style={styles.freeAgentLocation}>{agent.location}</Text>
                      </View>
                      {alreadyInvited ? (
                        <Text style={styles.invitedBadge}>Invited</Text>
                      ) : (
                        <TouchableOpacity
                          style={styles.secondaryChip}
                          onPress={() => handleInviteMarketplacePlayer(agent.id, agent.name)}
                        >
                          <Text style={styles.secondaryChipText}>Invite</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.freeAgentStrengths}>
                      Key strengths: {agent.strengths.join(', ')}
                    </Text>
                    <View style={styles.socialRow}>
                      {agent.socialHandles.instagram ? (
                        <Text style={styles.socialHandle}>IG {agent.socialHandles.instagram}</Text>
                      ) : null}
                      {agent.socialHandles.twitter ? (
                        <Text style={styles.socialHandle}>X {agent.socialHandles.twitter}</Text>
                      ) : null}
                      {agent.socialHandles.tiktok ? (
                        <Text style={styles.socialHandle}>TikTok {agent.socialHandles.tiktok}</Text>
                      ) : null}
                    </View>
                    {agent.highlightReelUrl ? (
                      <Text style={styles.highlightLink}>{agent.highlightReelUrl}</Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.marketplaceSection}>
            <Text style={styles.marketplaceHeading}>Transfer market auctions</Text>
            {transferListings.length === 0 ? (
              <Text style={styles.emptyState}>No auctions available. Check back later today.</Text>
            ) : (
              transferListings.map((listing) => (
                <View key={listing.id} style={styles.listingCard}>
                  <View style={styles.listingHeader}>
                    <Text style={styles.listingTitle}>Bid for {listing.playerId}</Text>
                    <Text style={styles.listingStatus}>{listing.status.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.listingMeta}>
                    Current bid: {listing.currentBid} credits • Asking price: {listing.askingPrice} credits
                  </Text>
                  <Text style={styles.listingDescription}>{listing.note}</Text>
                  <Text style={styles.listingMeta}>
                    Closes {new Date(listing.closingAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <View style={styles.listingActions}>
                    <TouchableOpacity
                      style={styles.secondaryChip}
                      onPress={() => handlePlaceBidOnListing(listing)}
                    >
                      <Text style={styles.secondaryChipText}>Bid +5 credits</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryChip}
                      onPress={() => handleToggleShortlistPlayer(listing.playerId)}
                    >
                      <Text style={styles.secondaryChipText}>Toggle shortlist</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.marketplaceSection}>
            <Text style={styles.marketplaceHeading}>Shortlist</Text>
            {shortlistWithReports.length === 0 ? (
              <Text style={styles.emptyState}>Use the buttons above to add targets to your shortlist.</Text>
            ) : (
              shortlistWithReports.map(({ entry, report }) => (
                <View key={entry.playerId} style={styles.shortlistCard}>
                  <Text style={styles.shortlistName}>{entry.playerId}</Text>
                  <Text style={styles.shortlistMeta}>Priority: {entry.priority.toUpperCase()}</Text>
                  {report ? (
                    <Text style={styles.shortlistMeta}>
                      {report.summary} • Potential {report.potentialRating}/100 • Risk {report.riskLevel}
                    </Text>
                  ) : null}
                  {entry.notes ? <Text style={styles.shortlistNotes}>{entry.notes}</Text> : null}
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training plan & development</Text>
          {trainingPlan ? (
            <>
              <Text style={styles.sectionSubtitle}>
                {trainingPlan.weekLabel} • Completion rate {Math.round(trainingPlan.completionRate * 100)}%
              </Text>
              <View style={styles.trainingCard}>
                {trainingPlan.sessions.map((session) => (
                  <View key={session.id} style={styles.trainingSessionRow}>
                    <View style={styles.trainingSessionInfo}>
                      <Text style={styles.trainingSessionTitle}>
                        {session.day} • {session.drill}
                      </Text>
                      <Text style={styles.trainingSessionMeta}>
                        {session.durationMinutes} mins • {session.intensity.toUpperCase()} • {session.focus}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.secondaryChip, session.completed && styles.trainingCompletedChip]}
                      onPress={() => handleToggleTrainingSession(session.id, !session.completed)}
                    >
                      <Text style={styles.secondaryChipText}>
                        {session.completed ? 'Mark pending' : 'Mark done'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <Text style={styles.trainingSummary}>{trainingPlan.wellnessNote}</Text>
            </>
          ) : (
            <Text style={styles.emptyState}>Build a weekly training plan to keep players progressing.</Text>
          )}

          <Text style={styles.marketplaceHeading}>Recommended drills</Text>
          <View style={styles.recommendedDrillList}>
            {recommendedDrills.slice(0, 3).map((drill) => (
              <View key={drill.id} style={styles.recommendedDrillCard}>
                <Text style={styles.recommendedDrillTitle}>{drill.title}</Text>
                <Text style={styles.recommendedDrillMeta}>
                  {drill.focus} • {drill.durationMinutes} mins • {drill.intensity.toUpperCase()}
                </Text>
                <Text style={styles.recommendedDrillSummary}>{drill.description}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.marketplaceHeading}>Player development snapshot</Text>
          <View style={styles.developmentList}>
            {developmentSnapshot.map((profile) => (
              <View key={profile.playerId} style={styles.developmentCard}>
                <Text style={styles.developmentName}>{profile.playerName}</Text>
                <Text style={styles.developmentMeta}>
                  {profile.position} • Focus: {profile.focusArea}
                </Text>
                {profile.attributes.slice(0, 2).map((attribute) => (
                  <View key={attribute.attribute} style={styles.developmentAttributeRow}>
                    <Text style={styles.developmentAttributeLabel}>{attribute.attribute}</Text>
                    <Text style={styles.developmentAttributeMeta}>
                      {attribute.current}/{attribute.target} • +{attribute.weeklyGain.toFixed(1)} per week
                    </Text>
                    <TouchableOpacity
                      style={styles.secondaryChip}
                      onPress={() => handleRecordDevelopmentGain(profile.playerId, attribute.attribute)}
                    >
                      <Text style={styles.secondaryChipText}>Log +1</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenge other teams</Text>
          <Text style={styles.sectionSubtitle}>
            Search nearby clubs or take on opponents from across the country.
          </Text>

          <View style={styles.scopeToggle}>
            <TouchableOpacity
              style={[styles.scopeButton, searchScope === 'local' && styles.scopeButtonActive]}
              onPress={() => handleScopeChange('local')}
            >
              <Text
                style={[styles.scopeButtonText, searchScope === 'local' && styles.scopeButtonTextActive]}
              >
                Local area
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scopeButton, searchScope === 'national' && styles.scopeButtonActive]}
              onPress={() => handleScopeChange('national')}
            >
              <Text
                style={[styles.scopeButtonText, searchScope === 'national' && styles.scopeButtonTextActive]}
              >
                National search
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              value={teamSearchQuery}
              onChangeText={setTeamSearchQuery}
              placeholder="Search by team name, city or ranking"
              style={[styles.input, styles.searchInput]}
              returnKeyType="search"
              onSubmitEditing={handleSearchTeams}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearchTeams}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {isSearchingTeams ? (
            <View style={styles.searchStatus}>
              <ActivityIndicator size="small" color="#1d4ed8" />
              <Text style={styles.searchStatusText}>Searching teams…</Text>
            </View>
          ) : (
            <>
              {searchError ? <Text style={styles.searchError}>{searchError}</Text> : null}
              {searchResults.length > 0 ? (
                <View style={styles.challengeList}>
                  {searchResults.map((opponent) => (
                    <View key={opponent.id} style={styles.challengeCard}>
                      <View style={styles.challengeDetails}>
                        <Text style={styles.challengeName}>{opponent.name}</Text>
                        <Text style={styles.challengeLocation}>
                          {opponent.city}, {opponent.region}
                          {typeof opponent.distanceKm === 'number'
                            ? ` • ${opponent.distanceKm}km away`
                            : ''}
                        </Text>
                        <Text style={styles.challengeMeta}>{opponent.ranking}</Text>
                        <Text style={styles.challengeMeta}>{opponent.preferredMatchDay}</Text>
                        <Text style={styles.challengeForm}>Form: {opponent.recentForm}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.challengeButton}
                        onPress={() => handleChallengeTeam(opponent)}
                      >
                        <Text style={styles.challengeButtonText}>Challenge</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite players</Text>
          <Text style={styles.sectionSubtitle}>
            Share your team with contacts or send invites directly from Football App.
          </Text>

          <TouchableOpacity style={styles.inviteCard} onPress={handleInviteFromContacts}>
            <Text style={styles.inviteTitle}>Phone contacts</Text>
            <Text style={styles.inviteDescription}>Pick players directly from your phone book.</Text>
          </TouchableOpacity>

          <View style={styles.usernameRow}>
            <TextInput
              value={usernameQuery}
              onChangeText={setUsernameQuery}
              placeholder="Search by Football App username"
              style={[styles.input, styles.usernameInput]}
            />
            <TouchableOpacity style={styles.usernameButton} onPress={handleInviteByUsername}>
              <Text style={styles.usernameButtonText}>Invite</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.inviteCard} onPress={handleInviteViaWhatsApp}>
            <Text style={styles.inviteTitle}>WhatsApp</Text>
            <Text style={styles.inviteDescription}>Share a direct message with your team link.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inviteCard} onPress={handleInviteViaEmail}>
            <Text style={styles.inviteTitle}>Email</Text>
            <Text style={styles.inviteDescription}>Send a personalised invite to the squad.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inviteCard} onPress={handleInviteViaFacebook}>
            <Text style={styles.inviteTitle}>Facebook</Text>
            <Text style={styles.inviteDescription}>Share your team to Facebook with one tap.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inviteCard} onPress={handleInviteViaX}>
            <Text style={styles.inviteTitle}>X (Twitter)</Text>
            <Text style={styles.inviteDescription}>Post a recruitment tweet for your team.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inviteCard} onPress={handleInviteViaInstagram}>
            <Text style={styles.inviteTitle}>Instagram</Text>
            <Text style={styles.inviteDescription}>Send the link via Instagram Direct messages.</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Save changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </AuthenticatedScreenContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
    gap: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#475569',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    color: '#475569',
  },
  scopeToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  scopeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#eef2ff',
  },
  scopeButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  scopeButtonText: {
    fontWeight: '600',
    color: '#1e293b',
  },
  scopeButtonTextActive: {
    color: '#fff',
  },
  formField: {
    gap: 12,
  },
  label: {
    fontWeight: '600',
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
  },
  communicationSummaryCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    gap: 12,
  },
  communicationSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  communicationMetric: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  communicationMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  communicationMetricLabel: {
    fontSize: 12,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  communicationSummaryFooter: {
    fontSize: 12,
    color: '#4c1d95',
  },
  communicationSummaryHighlight: {
    fontSize: 13,
    color: '#1e1b4b',
    fontWeight: '600',
  },
  communicationChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  communicationChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  communicationChipActive: {
    backgroundColor: '#4338ca',
    borderColor: '#4338ca',
  },
  communicationChipText: {
    fontWeight: '600',
    color: '#3730a3',
  },
  communicationChipTextActive: {
    color: '#fff',
  },
  communicationMessageField: {
    marginTop: 4,
  },
  communicationAudienceList: {
    gap: 12,
  },
  communicationAudienceCard: {
    borderWidth: 1,
    borderColor: '#e0e7ff',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
    gap: 6,
  },
  communicationAudienceCardActive: {
    borderColor: '#4338ca',
    backgroundColor: '#ede9fe',
  },
  communicationAudienceTitle: {
    fontWeight: '700',
    color: '#312e81',
  },
  communicationAudienceDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  communicationAudienceDescriptionActive: {
    color: '#312e81',
  },
  communicationChannelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  communicationChannelChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  communicationChannelChipActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  communicationChannelChipText: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  communicationChannelChipTextActive: {
    color: '#fff',
  },
  communicationToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  communicationToggleText: {
    flex: 1,
    gap: 4,
  },
  communicationTimeline: {
    marginTop: 16,
    gap: 12,
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#312e81',
  },
  timelineCard: {
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    backgroundColor: '#f5f3ff',
  },
  timelineTitle: {
    fontWeight: '700',
    color: '#312e81',
    fontSize: 15,
  },
  timelineMeta: {
    fontSize: 12,
    color: '#4c1d95',
  },
  responseRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  responseStat: {
    fontSize: 12,
    color: '#1e1b4b',
    fontWeight: '600',
  },
  responseActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  responseActionChip: {
    backgroundColor: '#ede9fe',
    borderColor: '#c4b5fd',
  },
  searchInput: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchStatusText: {
    color: '#475569',
  },
  searchError: {
    color: '#ef4444',
    fontWeight: '500',
  },
  challengeList: {
    gap: 16,
  },
  challengeCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  challengeDetails: {
    flex: 1,
    gap: 4,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  challengeLocation: {
    color: '#475569',
  },
  challengeMeta: {
    color: '#1e293b',
    fontSize: 13,
  },
  challengeForm: {
    color: '#334155',
    fontSize: 12,
    fontStyle: 'italic',
  },
  challengeButton: {
    alignSelf: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  challengeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  memberList: {
    marginTop: 8,
  },
  memberCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  memberCardSelected: {
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  memberCardBody: {
    marginBottom: 12,
  },
  memberHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberName: {
    fontWeight: '700',
    color: '#0f172a',
    fontSize: 16,
  },
  captainBadge: {
    backgroundColor: '#facc15',
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  memberPositionText: {
    color: '#1f2937',
    fontSize: 14,
  },
  memberSelectHint: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 12,
  },
  memberFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  roleButton: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 8,
  },
  roleButtonText: {
    fontWeight: '700',
    color: '#1d4ed8',
  },
  roleButtonHint: {
    fontSize: 11,
    color: '#1d4ed8',
  },
  memberActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 12,
  },
  secondaryAction: {
    marginRight: 12,
  },
  secondaryActionText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  removeAction: {
    marginRight: 0,
  },
  removeActionText: {
    color: '#ef4444',
    fontWeight: '700',
  },
  addMemberRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  addMemberInput: {
    flex: 1,
  },
  addMemberButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addMemberButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    fontWeight: '600',
    color: '#1e293b',
  },
  settingDescription: {
    color: '#64748b',
    fontSize: 13,
  },
  inviteCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  inviteTitle: {
    fontWeight: '700',
    color: '#0f172a',
  },
  inviteDescription: {
    color: '#475569',
    fontSize: 13,
  },
  usernameRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  usernameInput: {
    flex: 1,
  },
  usernameButton: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  usernameButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  primaryActionButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryActionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  fixtureList: {
    gap: 16,
  },
  fixtureAdminCard: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    backgroundColor: '#f8fbff',
  },
  fixtureHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fixtureHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  fixtureSubheading: {
    color: '#1e293b',
    fontSize: 13,
  },
  fixtureStatusPill: {
    backgroundColor: '#1d4ed820',
    color: '#1d4ed8',
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
  },
  fixtureNotes: {
    fontSize: 13,
    color: '#475569',
  },
  kickoffOptionList: {
    gap: 12,
  },
  kickoffOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kickoffOptionInfo: {
    gap: 4,
  },
  kickoffOptionLabel: {
    fontWeight: '600',
    color: '#1e293b',
  },
  kickoffOptionVotes: {
    fontSize: 12,
    color: '#64748b',
  },
  kickoffOptionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryChip: {
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryChipText: {
    color: '#0369a1',
    fontWeight: '600',
  },
  acceptedLabel: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  resultActionBlock: {
    gap: 8,
  },
  resultActionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  resultActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  resultChip: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultChipWin: {
    backgroundColor: '#dcfce7',
  },
  resultChipDraw: {
    backgroundColor: '#e0f2fe',
  },
  resultChipLoss: {
    backgroundColor: '#fee2e2',
  },
  resultChipText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  commitmentToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  commitmentPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#eef2ff',
  },
  commitmentPillActive: {
    backgroundColor: '#312e81',
    borderColor: '#312e81',
  },
  commitmentPillText: {
    fontWeight: '600',
    color: '#312e81',
  },
  commitmentPillTextActive: {
    color: '#fff',
  },
  marketplaceSection: {
    marginTop: 20,
    gap: 12,
  },
  marketplaceHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  listingCard: {
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    backgroundColor: '#fffbeb',
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingTitle: {
    fontWeight: '700',
    color: '#92400e',
    fontSize: 15,
  },
  listingStatus: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '700',
  },
  listingMeta: {
    fontSize: 12,
    color: '#b45309',
  },
  listingDescription: {
    color: '#92400e',
    fontSize: 13,
  },
  listingActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  freeAgentCard: {
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    backgroundColor: '#f0f9ff',
  },
  freeAgentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  freeAgentInfo: {
    gap: 4,
    flex: 1,
  },
  freeAgentName: {
    fontWeight: '700',
    color: '#0c4a6e',
    fontSize: 15,
  },
  freeAgentRole: {
    color: '#0c4a6e',
    fontSize: 13,
  },
  freeAgentLocation: {
    color: '#0369a1',
    fontSize: 12,
  },
  invitedBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  freeAgentStrengths: {
    fontSize: 13,
    color: '#0c4a6e',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  socialHandle: {
    fontSize: 12,
    color: '#0369a1',
  },
  highlightLink: {
    color: '#1d4ed8',
    fontSize: 12,
  },
  pitchInstructions: {
    marginTop: 12,
    color: '#475569',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ManageTeamScreen;
