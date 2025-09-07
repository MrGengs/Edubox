import { Injectable, Inject } from '@angular/core';
import { 
  Firestore, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  collection,
  DocumentData,
  DocumentReference,
  serverTimestamp,
  getDocs,
  query,
  limit as firestoreLimit,
  DocumentSnapshot
} from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string | null;
  createdAt: Date;
  updatedAt: Date;
  role?: 'admin' | 'user';
  // Add any additional user fields here
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly COLLECTION_NAME = 'users';

  constructor(
    @Inject('FIREBASE_FIRESTORE') private firestore: Firestore
  ) {}

  private get userCollection() {
    return collection(this.firestore, this.COLLECTION_NAME);
  }

  private userDoc(uid: string) {
    return doc(this.userCollection, uid);
  }

  // Create or update user profile
  async createOrUpdateUser(userData: Omit<UserProfile, 'createdAt' | 'updatedAt' | 'role'>): Promise<void> {
    const timestamp = serverTimestamp();
    const userRef = this.userDoc(userData.uid);
    
    return setDoc(userRef, {
      ...userData,
      updatedAt: timestamp,
      createdAt: timestamp,
      role: 'user' // Default role
    }, { merge: true });
  }

  // Get user profile by UID
  getUser(uid: string): Observable<UserProfile | undefined> {
    const userRef = this.userDoc(uid);
    return from(getDoc(userRef)).pipe(
      map(docSnap => docSnap.exists() ? docSnap.data() as UserProfile : undefined)
    );
  }

  // Update user profile
  updateUser(uid: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = this.userDoc(uid);
    return updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  // Delete user profile
  async deleteUser(uid: string): Promise<void> {
    const userRef = this.userDoc(uid);
    await updateDoc(userRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    });
  }

  // Get all users (with pagination)
  getUsers(limit = 10): Observable<UserProfile[]> {
    const usersRef = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(usersRef, firestoreLimit(limit));
    
    return from(getDocs(q)).pipe(
      map(querySnapshot => 
        querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as UserProfile))
      )
    );
  }

  // Check if user exists
  async userExists(uid: string): Promise<boolean> {
    const userDoc = await getDoc(this.userDoc(uid));
    return userDoc.exists();
  }
}
