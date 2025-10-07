import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectCurrentUser,
  selectUsers,
  toggleUserStatus,
  updateMarketingPreference,
} from '../store/slices/authSlice';
import {
  addMarketingCampaign,
  markCampaignAsSent,
  recordManualPayment,
  selectAdminError,
  selectAdminInitialized,
  selectAdminLoading,
  selectMarketingCampaigns,
  selectPayments,
  updatePaymentStatus,
} from '../store/slices/adminSlice';
import type { MarketingAudience, PaymentStatus } from '../types/admin';

interface AdminDashboardScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AdminDashboard'>;
}

const paymentStatuses: PaymentStatus[] = ['pending', 'completed', 'failed'];
const marketingAudiences: MarketingAudience[] = ['all', 'premium', 'free'];

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const users = useAppSelector(selectUsers);
  const payments = useAppSelector(selectPayments);
  const campaigns = useAppSelector(selectMarketingCampaigns);
  const adminLoading = useAppSelector(selectAdminLoading);
  const adminInitialized = useAppSelector(selectAdminInitialized);
  const adminError = useAppSelector(selectAdminError);

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updatingMarketingUserId, setUpdatingMarketingUserId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(null);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  const [paymentEmail, setPaymentEmail] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('USD');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('completed');

  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignAudience, setCampaignAudience] = useState<MarketingAudience>('all');
  const [campaignScheduledFor, setCampaignScheduledFor] = useState('');
  const [campaignNotes, setCampaignNotes] = useState('');

  const metrics = useMemo(() => {
    const activeUsers = users.filter((user) => user.status === 'active').length;
    const suspendedUsers = users.filter((user) => user.status === 'suspended').length;
    const marketingOptIns = users.filter((user) => user.marketingOptIn).length;
    const completedPayments = payments.filter((payment) => payment.status === 'completed');
    const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingPayments = payments.filter((payment) => payment.status === 'pending').length;

    return {
      activeUsers,
      suspendedUsers,
      marketingOptIns,
      totalRevenue,
      pendingPayments,
    };
  }, [payments, users]);

  const handleToggleUserStatus = useCallback(
    async (userId: string) => {
      setUpdatingUserId(userId);
      try {
        await dispatch(toggleUserStatus({ userId })).unwrap();
      } catch (error) {
        const message = typeof error === 'string' ? error : 'Unable to update user status.';
        Alert.alert('Update failed', message);
      } finally {
        setUpdatingUserId(null);
      }
    },
    [dispatch],
  );

  const handleMarketingPreference = useCallback(
    async (userId: string, marketingOptIn: boolean) => {
      setUpdatingMarketingUserId(userId);
      try {
        await dispatch(updateMarketingPreference({ userId, marketingOptIn })).unwrap();
      } catch (error) {
        const message = typeof error === 'string' ? error : 'Unable to update marketing preference.';
        Alert.alert('Update failed', message);
      } finally {
        setUpdatingMarketingUserId(null);
      }
    },
    [dispatch],
  );

  const handleUpdatePaymentStatus = useCallback(
    async (paymentId: string, status: PaymentStatus) => {
      setUpdatingPaymentId(paymentId);
      try {
        await dispatch(updatePaymentStatus({ paymentId, status })).unwrap();
      } catch (error) {
        const message = typeof error === 'string' ? error : 'Unable to update payment status.';
        Alert.alert('Update failed', message);
      } finally {
        setUpdatingPaymentId(null);
      }
    },
    [dispatch],
  );

  const handleRecordPayment = useCallback(async () => {
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid payment amount greater than zero.');
      return;
    }

    setRecordingPayment(true);
    try {
      await dispatch(
        recordManualPayment({
          userEmail: paymentEmail,
          amount,
          currency: paymentCurrency.trim().toUpperCase() || 'USD',
          status: paymentStatus,
          notes: paymentNotes.trim() || undefined,
        }),
      ).unwrap();

      setPaymentEmail('');
      setPaymentAmount('');
      setPaymentCurrency('USD');
      setPaymentNotes('');
      setPaymentStatus('completed');
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Unable to record payment.';
      Alert.alert('Payment error', message);
    } finally {
      setRecordingPayment(false);
    }
  }, [dispatch, paymentAmount, paymentCurrency, paymentEmail, paymentNotes, paymentStatus]);

  const handleCreateCampaign = useCallback(async () => {
    if (!campaignTitle.trim()) {
      Alert.alert('Missing information', 'Campaign title is required.');
      return;
    }

    setCreatingCampaign(true);
    try {
      await dispatch(
        addMarketingCampaign({
          title: campaignTitle,
          audience: campaignAudience,
          scheduledFor: campaignScheduledFor.trim() || undefined,
          notes: campaignNotes.trim() || undefined,
        }),
      ).unwrap();

      setCampaignTitle('');
      setCampaignNotes('');
      setCampaignScheduledFor('');
      setCampaignAudience('all');
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Unable to create campaign.';
      Alert.alert('Campaign error', message);
    } finally {
      setCreatingCampaign(false);
    }
  }, [campaignAudience, campaignNotes, campaignScheduledFor, campaignTitle, dispatch]);

  const handleMarkCampaignSent = useCallback(
    async (campaignId: string) => {
      setUpdatingCampaignId(campaignId);
      try {
        await dispatch(markCampaignAsSent({ campaignId })).unwrap();
      } catch (error) {
        const message = typeof error === 'string' ? error : 'Unable to update campaign status.';
        Alert.alert('Campaign error', message);
      } finally {
        setUpdatingCampaignId(null);
      }
    },
    [dispatch],
  );

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.unauthorisedContainer}>
          <Text style={styles.unauthorisedTitle}>Access restricted</Text>
          <Text style={styles.unauthorisedText}>
            You need an admin account to view the management centre.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!adminInitialized || adminLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading admin data…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Admin centre</Text>
        <Text style={styles.screenSubtitle}>
          Manage accounts, payments, and marketing touchpoints for your football community.
        </Text>

        {adminError ? <Text style={styles.errorText}>{adminError}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User management</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.activeUsers}</Text>
              <Text style={styles.metricLabel}>Active users</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.suspendedUsers}</Text>
              <Text style={styles.metricLabel}>Suspended</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.marketingOptIns}</Text>
              <Text style={styles.metricLabel}>Marketing opt-ins</Text>
            </View>
          </View>

          {users.map((user) => (
            <View key={user.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{user.fullName}</Text>
                <Text
                  style={[
                    styles.badge,
                    user.role === 'admin' ? styles.badgeAdmin : styles.badgeUser,
                  ]}
                >
                  {user.role.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.cardDetail}>{user.email}</Text>
              <Text style={styles.cardDetail}>Joined {new Date(user.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.cardDetail}>
                Status:{' '}
                <Text style={user.status === 'active' ? styles.statusActive : styles.statusSuspended}>
                  {user.status}
                </Text>
              </Text>
              <Text style={styles.cardDetail}>
                Marketing opt-in: {user.marketingOptIn ? 'Enabled' : 'Disabled'}
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.outlineButton]}
                  onPress={() => handleMarketingPreference(user.id, !user.marketingOptIn)}
                  disabled={updatingMarketingUserId === user.id}
                >
                  <Text style={styles.outlineButtonText}>
                    {updatingMarketingUserId === user.id
                      ? 'Updating…'
                      : user.marketingOptIn
                      ? 'Disable marketing'
                      : 'Enable marketing'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.destructiveButton]}
                  onPress={() => handleToggleUserStatus(user.id)}
                  disabled={user.role === 'admin' || updatingUserId === user.id}
                >
                  <Text style={styles.destructiveText}>
                    {user.role === 'admin'
                      ? 'Admin protected'
                      : updatingUserId === user.id
                      ? 'Updating…'
                      : user.status === 'active'
                      ? 'Suspend'
                      : 'Activate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payments</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.pendingPayments}</Text>
              <Text style={styles.metricLabel}>Pending</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                ${metrics.totalRevenue.toFixed(2)}
              </Text>
              <Text style={styles.metricLabel}>Completed revenue</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Record manual payment</Text>
            <Text style={styles.cardDetail}>Add offline payments or adjustments.</Text>
            <View style={styles.inlineFieldGroup}>
              <View style={styles.inlineField}>
                <Text style={styles.inlineLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={paymentEmail}
                  onChangeText={setPaymentEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="fan@club.com"
                />
              </View>
              <View style={styles.inlineFieldSmall}>
                <Text style={styles.inlineLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="decimal-pad"
                  placeholder="49.99"
                />
              </View>
              <View style={styles.inlineFieldTiny}>
                <Text style={styles.inlineLabel}>Currency</Text>
                <TextInput
                  style={styles.input}
                  value={paymentCurrency}
                  onChangeText={(value) => setPaymentCurrency(value.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={3}
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.inlineLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={paymentNotes}
                onChangeText={setPaymentNotes}
                placeholder="Add context for this payment"
                multiline
              />
            </View>
            <View style={styles.chipRow}>
              {paymentStatuses.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.chip, paymentStatus === status && styles.chipActive]}
                  onPress={() => setPaymentStatus(status)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      paymentStatus === status && styles.chipTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleRecordPayment}
              disabled={recordingPayment}
            >
              <Text style={styles.primaryButtonText}>
                {recordingPayment ? 'Recording…' : 'Record payment'}
              </Text>
            </TouchableOpacity>
          </View>

          {payments.map((payment) => (
            <View key={payment.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{payment.userEmail}</Text>
                <Text
                  style={[
                    styles.badge,
                    payment.status === 'completed'
                      ? styles.badgeSuccess
                      : payment.status === 'pending'
                      ? styles.badgeWarning
                      : styles.badgeDanger,
                  ]}
                >
                  {payment.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.cardDetail}>
                Amount {payment.amount.toFixed(2)} {payment.currency}
              </Text>
              <Text style={styles.cardDetail}>
                Recorded {new Date(payment.recordedAt).toLocaleString()}
              </Text>
              {payment.notes ? (
                <Text style={styles.cardDetail}>Notes: {payment.notes}</Text>
              ) : null}
              <View style={styles.chipRow}>
                {paymentStatuses.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.chip,
                      payment.status === status && styles.chipActive,
                    ]}
                    onPress={() => handleUpdatePaymentStatus(payment.id, status)}
                    disabled={updatingPaymentId === payment.id}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        payment.status === status && styles.chipTextActive,
                      ]}
                    >
                      {updatingPaymentId === payment.id && payment.status !== status
                        ? '…'
                        : status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marketing campaigns</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Launch campaign</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.inlineLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={campaignTitle}
                onChangeText={setCampaignTitle}
                placeholder="Summer five-a-side blitz"
              />
            </View>
            <View style={styles.chipRow}>
              {marketingAudiences.map((audience) => (
                <TouchableOpacity
                  key={audience}
                  style={[styles.chip, campaignAudience === audience && styles.chipActive]}
                  onPress={() => setCampaignAudience(audience)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      campaignAudience === audience && styles.chipTextActive,
                    ]}
                  >
                    {audience}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.inlineLabel}>Scheduled for</Text>
              <TextInput
                style={styles.input}
                value={campaignScheduledFor}
                onChangeText={setCampaignScheduledFor}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.inlineLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={campaignNotes}
                onChangeText={setCampaignNotes}
                placeholder="What channels will you use?"
                multiline
              />
            </View>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleCreateCampaign}
              disabled={creatingCampaign}
            >
              <Text style={styles.primaryButtonText}>
                {creatingCampaign ? 'Scheduling…' : 'Create campaign'}
              </Text>
            </TouchableOpacity>
          </View>

          {campaigns.map((campaign) => (
            <View key={campaign.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{campaign.title}</Text>
                <Text
                  style={[
                    styles.badge,
                    campaign.status === 'sent'
                      ? styles.badgeSuccess
                      : campaign.status === 'scheduled'
                      ? styles.badgeWarning
                      : styles.badgeUser,
                  ]}
                >
                  {campaign.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.cardDetail}>Audience: {campaign.audience}</Text>
              <Text style={styles.cardDetail}>
                Created {new Date(campaign.createdAt).toLocaleString()}
              </Text>
              {campaign.scheduledFor ? (
                <Text style={styles.cardDetail}>
                  Scheduled for {campaign.scheduledFor}
                </Text>
              ) : null}
              {campaign.sentAt ? (
                <Text style={styles.cardDetail}>Sent {new Date(campaign.sentAt).toLocaleString()}</Text>
              ) : null}
              {campaign.notes ? <Text style={styles.cardDetail}>Notes: {campaign.notes}</Text> : null}
              {campaign.status !== 'sent' ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => handleMarkCampaignSent(campaign.id)}
                  disabled={updatingCampaignId === campaign.id}
                >
                  <Text style={styles.primaryButtonText}>
                    {updatingCampaignId === campaign.id ? 'Updating…' : 'Mark as sent'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minWidth: 120,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardDetail: {
    color: '#475569',
    marginBottom: 6,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  outlineButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  destructiveButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  destructiveText: {
    color: '#dc2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  badgeAdmin: {
    backgroundColor: '#fde68a',
  },
  badgeUser: {
    backgroundColor: '#e0f2fe',
  },
  badgeSuccess: {
    backgroundColor: '#bbf7d0',
  },
  badgeWarning: {
    backgroundColor: '#fef08a',
  },
  badgeDanger: {
    backgroundColor: '#fecaca',
  },
  statusActive: {
    color: '#16a34a',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusSuspended: {
    color: '#dc2626',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  inlineFieldGroup: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 12,
  },
  inlineField: {
    flex: 1,
    marginRight: 8,
  },
  inlineFieldSmall: {
    width: 120,
    marginRight: 8,
  },
  inlineFieldTiny: {
    width: 90,
  },
  inlineLabel: {
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    color: '#0f172a',
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  chipText: {
    color: '#334155',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#475569',
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 16,
  },
  unauthorisedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unauthorisedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  unauthorisedText: {
    color: '#475569',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
});

export default AdminDashboardScreen;
