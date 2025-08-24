// Dev-only auth helper used for local testing without Firebase.
type DevUser = { uid: string; email: string } | null;

let _devUser: DevUser = null;

const subscribers = new Set<(u: DevUser) => void>();

export const setDevUser = (u: DevUser) => {
  _devUser = u;
  for (const s of subscribers) s(_devUser);
};

export const getDevUser = (): DevUser => _devUser;

export const clearDevUser = () => {
  _devUser = null;
  for (const s of subscribers) s(_devUser);
};

export const subscribeDevUser = (cb: (u: DevUser) => void) => {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
};

export default { setDevUser, getDevUser, clearDevUser, subscribeDevUser };
