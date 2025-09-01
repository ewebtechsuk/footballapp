import { collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, deleteDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const teamsCollection = collection(db, 'teams');
const tournamentsCollection = collection(db, 'tournaments');

export const createTeam = async (teamData: any) => {
  const ref = await addDoc(teamsCollection, teamData);
  return { id: ref.id, ...teamData };
};

export const getTeam = async (teamId: string) => {
  const ref = doc(db, 'teams', teamId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const listTeamsByOwner = async (ownerId: string) => {
  const q = query(teamsCollection, where('ownerId', '==', ownerId));
  const snaps = await getDocs(q);
  return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const enterTournament = async (tournamentId: string, teamId: string) => {
  const ref = doc(db, 'tournaments', tournamentId);
  // Add the teamId to an entries array (create if missing)
  await updateDoc(ref, {
    entries: arrayUnion(teamId)
  });
  return true;
};

export const deleteTeam = async (teamId: string) => {
  const ref = doc(db, 'teams', teamId);
  await deleteDoc(ref);
  return true;
};

// Update the user's profile document in the 'users' collection. This will create
// or update the document with the provided fields.
export const updateUserProfile = async (userId: string, fields: Record<string, any>) => {
  if (!userId) throw new Error('Missing userId');
  const ref = doc(db, 'users', userId);
  // Use updateDoc to update only provided fields; if doc doesn't exist, set it via update then catch and create
  try {
    await updateDoc(ref, fields);
  } catch (e: any) {
    // If updateDoc failed because the document is missing, create it.
    // Firestore error codes may vary by SDK; best-effort: if updateDoc fails, try setDoc.
    try {
      await setDoc(ref, fields);
    } catch (e2) {
      throw e2;
    }
  }
  return true;
};

// Fetch a user's profile document (returns null if missing)
export const getUserProfile = async (userId: string): Promise<Record<string, any> | null> => {
  if (!userId) throw new Error('Missing userId');
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
