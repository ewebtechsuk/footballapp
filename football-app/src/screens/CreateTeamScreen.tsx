import React from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type CreateTeamStackParamList = {
  'Create Team': undefined;
};

type CreateTeamScreenProps = NativeStackScreenProps<CreateTeamStackParamList, 'Create Team'>;

const CreateTeamScreen: React.FC<CreateTeamScreenProps> = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Create a new team coming soon!</Text>
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
};

export default CreateTeamScreen;
