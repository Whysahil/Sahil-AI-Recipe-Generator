import type { Recipe } from './gemini';
import { auth, db } from './firebase';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  FieldValue,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

export type { Recipe };

export interface User extends FirebaseUser {
  $id: string;
  name?: string | null;
  $createdAt?: string;
  $updatedAt?: string;
  uid: string;
}

type TimestampLike = {
  toDate: () => Date;
};

type FirestoreUserProfileData = UserProfileData & {
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
};

type FirestoreRecipeData = {
  userId: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  difficulty?: string;
  macrosJson?: string[];
  reasoning?: string;
  tipsJson?: string[];
  tags?: string[];
  userRating?: number;
  userNotes?: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
};

// Provide a stub to satisfy existing imports that referenced Appwrite Query
// (not used with Firebase implementation)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Query: any = {};

const COLLECTION_SAVED_RECIPES =
  import.meta.env.VITE_FIREBASE_COLLECTION_RECIPES ||
  import.meta.env.VITE_APPWRITE_COLLECTION_RECIPES ||
  'recipes';
const COLLECTION_USER_PROFILES =
  import.meta.env.VITE_FIREBASE_COLLECTION_USER_PROFILES ||
  import.meta.env.VITE_APPWRITE_COLLECTION_USER_PROFILES ||
  'userProfiles';

const mapUser = (user: FirebaseUser | null): User | null => {
  if (!user) return null;
  return {
    ...user,
    $id: user.uid,
    name: user.displayName,
    $createdAt: user.metadata?.creationTime,
    $updatedAt: user.metadata?.lastSignInTime,
  } as User;
};

export interface ExtendedRecipe extends Recipe {
  tags?: string[];
  userRating?: number;
  userNotes?: string;
}

export interface SavedRecipeDocument {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
  userId: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  difficulty?: string;
  macrosJson?: string[];
  reasoning?: string;
  tipsJson?: string[];
  tags?: string[];
  userRating?: number;
  userNotes?: string;
}

export interface UserProfileData {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  dietaryPreferences?: string[];
  cuisinePreferences?: string[];
  skillLevel?: string;
  darkMode?: boolean;
  savedIngredients?: string[];
  defaultServings?: number;
}

export interface UserProfileDocument extends UserProfileData {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
}

const hasToDate = (value: unknown): value is TimestampLike => {
  return typeof value === 'object' && value !== null && typeof (value as TimestampLike).toDate === 'function';
};

const toIsoString = (
  value: Timestamp | TimestampLike | FieldValue | string | null | undefined
): string | undefined => {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (hasToDate(value)) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return undefined;
};

const getCurrentUserInternal = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        unsub();
        resolve(mapUser(user));
      },
      () => {
        unsub();
        resolve(null);
      }
    );
  });
};

const ensureUserProfileExists = async (userId: string, name?: string): Promise<UserProfileDocument> => {
  const ref = doc(db, COLLECTION_USER_PROFILES, userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data() as FirestoreUserProfileData;
    return {
      $id: ref.id,
      ...data,
      $createdAt: toIsoString(data?.createdAt),
      $updatedAt: toIsoString(data?.updatedAt),
    };
  }

  const initial: FirestoreUserProfileData = {
    userId,
    displayName: name || '',
    dietaryPreferences: [],
    cuisinePreferences: [],
    skillLevel: 'Any',
    darkMode: false,
    savedIngredients: [],
    defaultServings: 2,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, initial);

  return {
    $id: ref.id,
    ...initial,
    $createdAt: undefined,
    $updatedAt: undefined,
  };
};

export const createUserAccount = async (
  email: string,
  password: string,
  name?: string
): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
  await ensureUserProfileExists(cred.user.uid, name || cred.user.displayName || '');
  return mapUser(cred.user) as User;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return mapUser(cred.user) as User;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const getCurrentUser = async (): Promise<User | null> => getCurrentUserInternal();

export const getUserProfile = async (): Promise<UserProfileDocument | null> => {
  const user = await getCurrentUserInternal();
  if (!user) return null;
  const ref = doc(db, COLLECTION_USER_PROFILES, user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return ensureUserProfileExists(user.uid, user.displayName || '');
  }
  const data = snap.data() as FirestoreUserProfileData;
  return {
    $id: ref.id,
    ...data,
    $createdAt: toIsoString(data?.createdAt),
    $updatedAt: toIsoString(data?.updatedAt),
  };
};

export const updateUserProfile = async (
  profileUpdateData: Partial<UserProfileData>
): Promise<UserProfileDocument | null> => {
  const user = await getCurrentUserInternal();
  if (!user) throw new Error('Not authenticated. Cannot update profile.');

  const ref = doc(db, COLLECTION_USER_PROFILES, user.uid);
  await setDoc(
    ref,
    {
      ...profileUpdateData,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const snap = await getDoc(ref);
  const data = snap.data() as FirestoreUserProfileData;
  return {
    $id: ref.id,
    ...data,
    $createdAt: toIsoString(data?.createdAt),
    $updatedAt: toIsoString(data?.updatedAt),
  };
};

export const clearSavedIngredients = async (): Promise<void> => {
  await updateUserProfile({ savedIngredients: [] });
};

const prepareRecipePayload = (recipe: Partial<ExtendedRecipe>, userId?: string) => {
  const payload: Partial<SavedRecipeDocument> = {};
  if (userId) payload.userId = userId;
  if (recipe.title !== undefined) payload.title = recipe.title;
  if (recipe.instructions !== undefined) payload.instructions = recipe.instructions;
  if (recipe.ingredients !== undefined) payload.ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  if (recipe.tips !== undefined) payload.tipsJson = Array.isArray(recipe.tips) ? recipe.tips : [];
  if (recipe.tags !== undefined) payload.tags = Array.isArray(recipe.tags) ? recipe.tags : [];
  if (recipe.macros !== undefined) {
    const formatted: string[] = [];
    if (recipe.macros.calories) formatted.push(`Calories: ${recipe.macros.calories}`);
    if (recipe.macros.protein) formatted.push(`Protein: ${recipe.macros.protein}`);
    if (recipe.macros.carbs) formatted.push(`Carbs: ${recipe.macros.carbs}`);
    if (recipe.macros.fat) formatted.push(`Fat: ${recipe.macros.fat}`);
    if (formatted.length > 0) payload.macrosJson = formatted;
  }
  if (recipe.description !== undefined) payload.description = recipe.description;
  if (recipe.prepTime !== undefined) payload.prepTime = recipe.prepTime;
  if (recipe.cookTime !== undefined) payload.cookTime = recipe.cookTime;
  if (recipe.totalTime !== undefined) payload.totalTime = recipe.totalTime;
  if (recipe.servings !== undefined) payload.servings = recipe.servings;
  if (recipe.difficulty !== undefined) payload.difficulty = recipe.difficulty;
  if (recipe.reasoning !== undefined) payload.reasoning = recipe.reasoning;
  if (recipe.userRating !== undefined) payload.userRating = recipe.userRating;
  if (recipe.userNotes !== undefined) payload.userNotes = recipe.userNotes;
  return payload;
};

export const saveRecipe = async (recipe: ExtendedRecipe): Promise<SavedRecipeDocument> => {
  const user = await getCurrentUserInternal();
  if (!user) throw new Error('Not authenticated. Cannot save recipe.');

  const payload = prepareRecipePayload(recipe, user.uid);
  if (!payload.userId || !payload.title || !payload.ingredients || !payload.instructions) {
    throw new Error('Cannot save recipe: Missing required fields (userId, title, ingredients, instructions).');
  }

  const now = serverTimestamp();
  const docRef = await addDoc(collection(db, COLLECTION_SAVED_RECIPES), {
    ...payload,
    createdAt: now,
    updatedAt: now,
  });

  return {
    $id: docRef.id,
    $createdAt: new Date().toISOString(),
    ...payload,
  } as SavedRecipeDocument;
};

export const updateRecipe = async (
  documentId: string,
  updatedRecipeData: Partial<ExtendedRecipe>
): Promise<SavedRecipeDocument> => {
  const user = await getCurrentUserInternal();
  if (!user) throw new Error('Not authenticated. Cannot update recipe.');

  const payload = prepareRecipePayload(updatedRecipeData);
  await updateDoc(doc(db, COLLECTION_SAVED_RECIPES, documentId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });

  const updatedSnap = await getDoc(doc(db, COLLECTION_SAVED_RECIPES, documentId));
  const data = updatedSnap.data() as FirestoreRecipeData | undefined;
  if (!data) throw new Error('Recipe not found');
  return {
    $id: documentId,
    ...data,
    $createdAt: toIsoString(data.createdAt),
    $updatedAt: toIsoString(data.updatedAt),
    ingredients: data.ingredients || [],
    tipsJson: data.tipsJson || [],
    tags: data.tags || [],
  } as SavedRecipeDocument;
};

export const fetchUserRecipes = async (): Promise<SavedRecipeDocument[]> => {
  const user = await getCurrentUserInternal();
  if (!user) return [];

  const q = query(collection(db, COLLECTION_SAVED_RECIPES), where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data() as FirestoreRecipeData;
    return {
      $id: d.id,
      ...data,
      $createdAt: toIsoString(data.createdAt),
      $updatedAt: toIsoString(data.updatedAt),
      ingredients: data.ingredients || [],
      tipsJson: data.tipsJson || [],
      tags: data.tags || [],
    } as SavedRecipeDocument;
  });
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION_SAVED_RECIPES, recipeId));
};

export const getRecipeById = async (documentId: string): Promise<SavedRecipeDocument> => {
  const snap = await getDoc(doc(db, COLLECTION_SAVED_RECIPES, documentId));
  if (!snap.exists()) {
    throw new Error('Recipe not found');
  }
  const data = snap.data() as FirestoreRecipeData;
  return {
    $id: snap.id,
    ...data,
    $createdAt: toIsoString(data.createdAt),
    $updatedAt: toIsoString(data.updatedAt),
    ingredients: data.ingredients || [],
    tipsJson: data.tipsJson || [],
    tags: data.tags || [],
  } as SavedRecipeDocument;
};

export const parseIngredients = (docData: SavedRecipeDocument): string[] => {
  if (Array.isArray(docData.ingredients)) return docData.ingredients;
  return [];
};

export const parseTips = (docData: SavedRecipeDocument): string[] => {
  if (Array.isArray(docData.tipsJson)) return docData.tipsJson;
  return [];
};

export const parseMacros = (docData: SavedRecipeDocument): Recipe['macros'] | undefined => {
  if (!Array.isArray(docData.macrosJson) || docData.macrosJson.length === 0) return undefined;
  const macrosObj: Recipe['macros'] = {};
  docData.macrosJson.forEach((item) => {
    const [key, ...rest] = item.split(':');
    if (key && rest.length) {
      const normalizedKey = key.trim().toLowerCase();
      const value = rest.join(':').trim();
      if (normalizedKey === 'calories') macrosObj.calories = value;
      if (normalizedKey === 'protein') macrosObj.protein = value;
      if (normalizedKey === 'carbs') macrosObj.carbs = value;
      if (normalizedKey === 'fat') macrosObj.fat = value;
    }
  });
  return Object.keys(macrosObj).length > 0 ? macrosObj : undefined;
};

export const convertDocumentToRecipe = (docData: SavedRecipeDocument) => {
  return {
    title: docData.title,
    ingredients: parseIngredients(docData),
    instructions: docData.instructions || 'No instructions provided.',
    description: docData.description,
    prepTime: docData.prepTime,
    cookTime: docData.cookTime,
    totalTime: docData.totalTime,
    servings: docData.servings,
    difficulty: docData.difficulty,
    macros: parseMacros(docData),
    reasoning: docData.reasoning,
    tips: parseTips(docData),
    tags: Array.isArray(docData.tags) ? docData.tags : [],
    userRating: docData.userRating,
    userNotes: docData.userNotes,
  } as Recipe;
};
