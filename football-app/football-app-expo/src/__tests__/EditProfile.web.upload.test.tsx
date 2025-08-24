import React from 'react';
// mock expo-image-picker to avoid importing ESM code in Jest
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: 'file://local/image.jpg' }] }),
  MediaTypeOptions: { Images: 'Images' },
}));
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditProfileScreen from '../screens/EditProfileScreen';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

// Mock firebase storage low-level API
jest.mock('firebase/storage', () => ({
  ref: jest.fn((s: any, p: string) => ({ s, p })),
  uploadBytesResumable: jest.fn((ref: any, file: any) => ({
    on: (_event: string, next: (snap: any) => void, _err: any, complete: () => void) => {
      setTimeout(() => next({ bytesTransferred: 50, totalBytes: 100 }), 5);
      setTimeout(() => next({ bytesTransferred: 100, totalBytes: 100 }), 10);
      setTimeout(() => complete(), 12);
      return () => {};
    }
  })),
  getDownloadURL: jest.fn(async () => 'https://example.com/web-avatar.jpg')
}));

jest.mock('../services/firebase', () => ({ storage: {} }));
jest.mock('../services/firestore', () => ({ updateUserProfile: jest.fn() }));

const mockStore = configureStore([]);
const navigation: any = { goBack: jest.fn() };

describe('EditProfile web upload flow', () => {
  it('uploads via web input and disables Save during upload', async () => {
    const store = mockStore({ user: { id: 'web1', name: 'Web', displayName: 'W', bio: '', position: '', email: 'w@example.com', teams: [] } });
    const element = React.createElement((Provider as any), { store }, React.createElement(EditProfileScreen as any, { navigation }, null));
  // set mocked platform to web so the component renders the <input> branch
  const rn = require('react-native');
  rn.Platform = { OS: 'web' };
  const { getByTestId } = render(element);
  // find the file input by test id
  const input: any = getByTestId('web-file-input');
    // create a fake File-like object for web
    const file = new File(['a'], 'pic.jpg', { type: 'image/jpeg' });
    // simulate file selection by invoking onChange if present, otherwise set files and dispatch event
  // invoke the input change handler inside act so state updates flush
  const { act } = require('react-test-renderer');
  await act(async () => {
    input.props.onChange && input.props.onChange({ target: { files: [file] } });
  });

    // Save should be disabled during upload (immediately after act)
  const save = getByTestId('save-button');
    expect(save.props.accessibilityState?.disabled || save.props.disabled).toBeTruthy();

    // Wait for storage upload to finish
    const storageMock = require('firebase/storage');
    await waitFor(() => expect(storageMock.uploadBytesResumable).toHaveBeenCalled(), { timeout: 2000 });

    // After finish, save re-enabled
    await waitFor(() => expect(save.props.accessibilityState?.disabled || save.props.disabled).toBeFalsy(), { timeout: 2000 });
  });
});

// Negative tests for uploadUserAvatar helper
import { uploadUserAvatar } from '../services/avatarFlow';
import * as storage from '../services/storage';

describe('avatarFlow validation', () => {
  it('rejects invalid mime types', async () => {
    // mock uploadAvatar to never be called
    const spy = jest.spyOn(storage, 'uploadAvatar');
    const blob = new Blob(['a'], { type: 'text/plain' }) as any;
    await expect(uploadUserAvatar('u2', blob, false)).rejects.toThrow('Invalid file type');
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejects oversized files', async () => {
    const big = { size: 6 * 1024 * 1024, type: 'image/jpeg' } as any;
    await expect(uploadUserAvatar('u3', big, false)).rejects.toThrow('File too large');
  });
});
