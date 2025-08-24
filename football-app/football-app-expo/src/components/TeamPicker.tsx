import React from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  visible: boolean;
  teams: any[];
  onSelect: (teamId: string) => void;
  onClose: () => void;
};

const TeamPicker: React.FC<Props> = ({ visible, teams, onSelect, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Choose a team</Text>
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => onSelect(item.id)}>
              <Text style={styles.itemText}>{item.teamName || item.name}</Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity onPress={onClose} style={styles.close}>
          <Text style={{ color: '#fff' }}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16 },
  close: { backgroundColor: '#007bff', padding: 12, marginTop: 12, alignItems: 'center', borderRadius: 6 },
});

export default TeamPicker;
