import React from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type TournamentStackParamList = {
  Tournaments: undefined;
};

type TournamentScreenProps = NativeStackScreenProps<TournamentStackParamList, 'Tournaments'>;

const TournamentScreen: React.FC<TournamentScreenProps> = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Tournament listings will appear here!</Text>
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
};

export default TournamentScreen;
