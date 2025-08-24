import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import EditProfileScreen from '../screens/EditProfileScreen';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import * as storage from '../services/storage';
// mock our firestore helpers so firestore module doesn't call real Firebase at import time
jest.mock('../services/firestore', () => ({
  updateUserProfile: jest.fn(),
}));

// will require the mocked module later when needed
// mock firebase storage low-level API so uploadAvatar/uploadUserAvatar run normally
jest.mock('firebase/storage', () => {
  return {
    ref: jest.fn((storageObj: any, path: string) => ({ storageObj, path })),
    uploadBytesResumable: jest.fn((ref: any, file: any) => {
      return {
        on: (_event: string, next: (snap: any) => void, _err: (e: any) => void, complete: () => void) => {
          // simulate progress then completion
          setTimeout(() => next({ bytesTransferred: 20, totalBytes: 100 }), 5);
          setTimeout(() => next({ bytesTransferred: 60, totalBytes: 100 }), 10);
          setTimeout(() => next({ bytesTransferred: 100, totalBytes: 100 }), 20);
          setTimeout(() => complete(), 25);
          return () => {};
        },
      };
    }),
    getDownloadURL: jest.fn(async (ref: any) => 'https://example.com/avatar.jpg'),
  };
});

// mock the storage export from our firebase service
jest.mock('../services/firebase', () => ({ storage: {} }));

// Mock navigation
const navigation: any = { goBack: jest.fn() };

const mockStore = configureStore([]);

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: 'file://local/image.jpg' }] }),
  MediaTypeOptions: { Images: 'Images' },
}));

describe('EditProfile upload flow', () => {
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({
      user: { id: 'user1', name: 'Test', displayName: 'T', bio: '', position: '', email: 't@example.com', teams: [] },
    });
  // mock global.fetch used to fetch local uri -> blob
  (global as any).fetch = jest.fn().mockResolvedValue({ blob: async () => new Blob(['a'], { type: 'image/jpeg' }) });
  });

  it('shows upload progress and disables save while uploading (native flow)', async () => {
  const firestore = require('../services/firestore');
  const mockUpdateProfile = jest.spyOn(firestore, 'updateUserProfile').mockResolvedValue(undefined as any);

    const element = React.createElement(
      (Provider as any),
      { store },
      React.createElement(EditProfileScreen as any, { navigation }, null)
    );
  const { getByText, queryByText, getByTestId } = render(element);

    // Trigger native choose avatar and assert Save becomes disabled immediately
    // Trigger native choose avatar and assert Save becomes disabled immediately
    const choose = getByTestId('choose-avatar');
    const save = getByTestId('save-button');

    // trigger native choose avatar using react-native testing fireEvent
    fireEvent.press(choose);
    // Save button should be disabled while upload is in progress
    expect(save.props.accessibilityState?.disabled || save.props.disabled).toBeTruthy();

  // Wait for upload to finish (firebase/storage mock will have completed)
  const storageMock = require('firebase/storage');
  await waitFor(() => expect(storageMock.uploadBytesResumable).toHaveBeenCalled(), { timeout: 2000 });

    // Save should be enabled again after upload
    await waitFor(() => expect(save.props.accessibilityState?.disabled || save.props.disabled).toBeFalsy(), { timeout: 2000 });

    expect(mockUpdateProfile).toHaveBeenCalledWith('user1', expect.objectContaining({ avatarUrl: 'https://example.com/avatar.jpg' }));
  });
});
