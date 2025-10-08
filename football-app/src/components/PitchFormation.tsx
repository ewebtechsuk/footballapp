import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FormationPositionKey, TeamMember } from '../store/slices/teamsSlice';

interface FormationSpot {
  key: FormationPositionKey;
  label: string;
  top: string;
  left: string;
}

const formationSpots: FormationSpot[] = [
  { key: 'GK', label: 'GK', top: '82%', left: '50%' },
  { key: 'RB', label: 'RB', top: '66%', left: '18%' },
  { key: 'RCB', label: 'RCB', top: '60%', left: '38%' },
  { key: 'LCB', label: 'LCB', top: '60%', left: '62%' },
  { key: 'LB', label: 'LB', top: '66%', left: '82%' },
  { key: 'CDM', label: 'CDM', top: '46%', left: '50%' },
  { key: 'RM', label: 'RM', top: '38%', left: '22%' },
  { key: 'CM', label: 'CM', top: '32%', left: '50%' },
  { key: 'LM', label: 'LM', top: '38%', left: '78%' },
  { key: 'RW', label: 'RW', top: '16%', left: '30%' },
  { key: 'ST', label: 'ST', top: '12%', left: '50%' },
  { key: 'LW', label: 'LW', top: '16%', left: '70%' },
];

interface PitchFormationProps {
  members: TeamMember[];
  selectedMemberId: string | null;
  onSpotPress: (positionKey: FormationPositionKey, occupantId: string | null) => void;
}

const PitchFormation: React.FC<PitchFormationProps> = ({ members, selectedMemberId, onSpotPress }) => {
  const captainId = React.useMemo(() => members.find((member) => member.isCaptain)?.id ?? null, [members]);

  return (
    <View style={styles.pitchWrapper}>
      <View style={styles.pitch}>
        <View style={styles.centerCircle} />
        <View style={styles.penaltyBoxTop} />
        <View style={styles.penaltyBoxBottom} />
        <View style={styles.sixYardBoxTop} />
        <View style={styles.sixYardBoxBottom} />
        <View style={styles.centerLine} />
        {formationSpots.map((spot) => {
          const occupant = members.find((member) => member.position === spot.key);
          const isSelected = occupant?.id === selectedMemberId;
          const isCaptain = occupant?.id && occupant.id === captainId;

          return (
            <TouchableOpacity
              key={spot.key}
              style={[
                styles.spot,
                { top: spot.top, left: spot.left },
                isSelected && styles.spotSelected,
                !occupant && styles.spotEmpty,
              ]}
              onPress={() => onSpotPress(spot.key, occupant ? occupant.id : null)}
            >
              <View style={styles.spotContent}>
                <Text style={styles.spotLabel} numberOfLines={1}>
                  {occupant ? occupant.name : spot.label}
                </Text>
                {occupant ? (
                  <Text style={styles.spotRole} numberOfLines={1}>
                    {occupant.role}
                  </Text>
                ) : (
                  <Text style={styles.spotHint}>Tap to assign</Text>
                )}
                {isCaptain ? <Text style={styles.captainTag}>C</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pitchWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0f766e',
  },
  pitch: {
    flex: 1,
    backgroundColor: '#0f5132',
    position: 'relative',
    padding: 16,
  },
  centerCircle: {
    position: 'absolute',
    width: '26%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    top: '37%',
    left: '37%',
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ translateX: -1 }],
  },
  penaltyBoxTop: {
    position: 'absolute',
    top: '6%',
    left: '20%',
    width: '60%',
    height: '18%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  penaltyBoxBottom: {
    position: 'absolute',
    bottom: '6%',
    left: '20%',
    width: '60%',
    height: '18%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  sixYardBoxTop: {
    position: 'absolute',
    top: '6%',
    left: '34%',
    width: '32%',
    height: '10%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  sixYardBoxBottom: {
    position: 'absolute',
    bottom: '6%',
    left: '34%',
    width: '32%',
    height: '10%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  spot: {
    position: 'absolute',
    width: 96,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(13, 148, 136, 0.9)',
    transform: [{ translateX: -48 }],
  },
  spotSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    borderColor: '#3b82f6',
  },
  spotEmpty: {
    backgroundColor: 'rgba(15, 118, 110, 0.7)',
  },
  spotContent: {
    alignItems: 'center',
  },
  spotLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  spotRole: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    marginTop: 2,
  },
  spotHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 2,
  },
  captainTag: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    color: '#0f172a',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default PitchFormation;
