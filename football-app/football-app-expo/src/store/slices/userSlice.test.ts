import userReducer, { setUser, updateName, updateProfile } from './userSlice';

describe('user slice', () => {
  const initialState = { id: null, name: null, displayName: null, bio: null, position: null, email: null, teams: [] };

  it('should set user', () => {
    const result = userReducer(initialState as any, setUser({ id: 'u1', name: 'A', email: 'a@example.com', teams: [] } as any));
    expect(result.id).toBe('u1');
    expect(result.name).toBe('A');
  });

  it('should update name', () => {
    const s = { ...initialState, id: 'u1', name: 'Old' } as any;
    const result = userReducer(s, updateName('New'));
    expect(result.name).toBe('New');
  });

  it('should update profile fields', () => {
    const s = { ...initialState, id: 'u1', name: 'Old' } as any;
    const result = userReducer(s, updateProfile({ displayName: 'Display', bio: 'hi', position: 'Forward' } as any));
    expect(result.displayName).toBe('Display');
    expect(result.bio).toBe('hi');
    expect(result.position).toBe('Forward');
  });
});
