import { Injectable, NgZone, Inject, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseAuthUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  onAuthStateChanged,
  getAuth,
  sendEmailVerification as sendEmailVerificationFn,
} from 'firebase/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
  collection,
  getFirestore,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';

declare const window: Window &
  typeof globalThis & {
    cordova?: any;
  };

import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirebaseError } from 'firebase/app';

// ==================== Interfaces ====================
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  bio: string | null;
  role: 'Student' | 'Admin' | 'Teacher' | string;
  level: number;
  emailVerified: boolean;
  createdAt: any;
  updatedAt: any;
  lastLoginAt?: any;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: any;
  user?: UserProfile | null;
}

// ==================== Service ====================
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  public user$ = this.userSubject.asObservable();
  public isLoggedIn$ = this.user$.pipe(map((user) => !!user));
  private authStateUnsubscribe: (() => void) | undefined;
  public currentUser: UserProfile | null = null;

  private auth: Auth;
  private firestore: Firestore;

  constructor(
    private ngZone: NgZone,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    try {
      // Initialize Firebase with the correct config property name
      const app = initializeApp(environment.firebaseConfig);
      this.auth = getAuth(app);
      this.firestore = getFirestore(app);

      // Run auth state listener in the Angular zone
      this.ngZone.run(() => {
        this.setupAuthStateListener();
      });
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw new Error('Failed to initialize Firebase services');
    }
  }

  ngOnDestroy() {
    if (this.authStateUnsubscribe) {
      this.authStateUnsubscribe();
    }
  }

  getCurrentUser$(): Observable<UserProfile | null> {
    return this.user$;
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public getUserDocRef(userId: string): DocumentReference<DocumentData> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      if (!this.firestore) {
        throw new Error('Firestore instance is not available');
      }

      // Create document reference using the firestore instance
      return doc(this.firestore, 'users', userId);
    } catch (error) {
      console.error('Error creating document reference:', error);
      throw new Error(
        'Failed to create document reference: ' + (error as Error).message
      );
    }
  }

  // ==================== Auth Methods ====================

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return this.ngZone.run(async () => {
      try {
        if (!this.auth) {
          throw new Error('Auth service not initialized');
        }

        const userCredential = await signInWithEmailAndPassword(
          this.auth,
          email,
          password
        );

        // Reload user to get the latest email verification status
        await userCredential.user.reload();

        const userDoc = await this.getUserDoc(userCredential.user.uid);

        if (!userDoc) {
          // If user document doesn't exist, create one
          const newUser: UserProfile = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            emailVerified: userCredential.user.emailVerified,
            displayName: userCredential.user.displayName || email.split('@')[0],
            photoURL: userCredential.user.photoURL || null,
            phoneNumber: userCredential.user.phoneNumber || null,
            bio: null,
            role: 'Student',
            level: 1, // Default level for new users
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          };

          await setDoc(this.getUserDocRef(userCredential.user.uid), newUser);
          this.userSubject.next(newUser);
          this.currentUser = newUser;

          return {
            success: true,
            user: newUser,
          };
        }

        const userData = userDoc.data() as UserProfile;

        // Update last login time
        await updateDoc(this.getUserDocRef(userCredential.user.uid), {
          lastLoginAt: serverTimestamp(),
        });

        // Update the user data with the latest from auth
        const updatedUser = {
          ...userData,
          email: userCredential.user.email,
          emailVerified: userCredential.user.emailVerified,
          displayName: userCredential.user.displayName || userData.displayName,
          photoURL: userCredential.user.photoURL || userData.photoURL,
        };

        this.userSubject.next(updatedUser);
        this.currentUser = updatedUser;

        return {
          success: true,
          message: 'Successfully signed in!',
          user: updatedUser,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error,
          message: this.getErrorMessage(error),
        };
      }
    });
  }

  async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResponse> {
    return this.ngZone.run(async () => {
      try {
        if (!this.auth) {
          throw new Error('Auth service not initialized');
        }

        const userCredential = await createUserWithEmailAndPassword(
          this.auth,
          email,
          password
        );
        const user = userCredential.user;

        if (!user) {
          throw new Error('Failed to create user');
        }

        // Update profile with display name
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(user, { displayName });

        // Create user document
        const userData: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: displayName,
          emailVerified: true, // Set emailVerified to true for new registrations
          photoURL: user.photoURL || null,
          phoneNumber: user.phoneNumber || null,
          bio: null,
          role: 'student',
          level: 1, // Default level for new users
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        };

        await setDoc(this.getUserDocRef(user.uid), userData);

        // Update the current user
        this.userSubject.next(userData);
        this.currentUser = userData;

        return {
          success: true,
          message: 'Successfully signed up!',
          user: userData,
        };
      } catch (error: any) {
        console.error('Sign up error:', error);
        return {
          success: false,
          error: this.getErrorMessage(error),
          message: this.getErrorMessage(error),
        };
      }
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(this.auth, email);
  }

  private setupAuthStateListener() {
    this.ngZone.runOutsideAngular(() => {
      // Use the new onAuthStateChanged from the auth instance
      this.authStateUnsubscribe = onAuthStateChanged(
        this.auth,
        async (user) => {
          await this.ngZone.run(async () => {
            try {
              if (user) {
                // Reload user to get the latest email verification status
                try {
                  await user.reload();

                  // Update the user's email verification status in Firestore
                  if (user.emailVerified) {
                    const userRef = this.getUserDocRef(user.uid);
                    await updateDoc(userRef, {
                      emailVerified: true,
                      updatedAt: serverTimestamp(),
                    });
                  }
                } catch (reloadError) {
                  console.error('Error reloading user:', reloadError);
                }

                const docSnap = await this.getUserDoc(user.uid);
                if (docSnap) {
                  const userData = {
                    ...docSnap.data(),
                    uid: user.uid,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    displayName: user.displayName || user.email?.split('@')[0],
                    photoURL: user.photoURL,
                  } as UserProfile;
                  this.userSubject.next(userData);
                  this.currentUser = userData;
                } else {
                  const newUser: UserProfile = {
                    uid: user.uid,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    displayName: user.displayName || 'New User',
                    photoURL: user.photoURL || null,
                    phoneNumber: user.phoneNumber || null,
                    bio: null,
                    role: 'Student',
                    level: 1, // Default level for new users
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastLoginAt: serverTimestamp(),
                  };

                  await setDoc(this.getUserDocRef(user.uid), newUser);
                  this.userSubject.next(newUser);
                  this.currentUser = newUser;
                }
              } else {
                this.userSubject.next(null);
                this.currentUser = null;
              }
            } catch (error) {
              console.error('Error in auth state change:', error);
              this.userSubject.next(null);
              this.currentUser = null;
            }
          });
        }
      );
    });
  }

  private async getUserDoc(
    userId: string
  ): Promise<DocumentSnapshot<DocumentData> | null> {
    if (!userId) {
      console.error('User ID is required');
      return null;
    }

    try {
      // Get the document reference (this is already wrapped in ngZone)
      const userDocRef = this.getUserDocRef(userId);

      // Execute the getDoc in the Angular zone
      return await this.ngZone.run(async () => {
        try {
          const docSnap = await getDoc(userDocRef);
          return docSnap.exists() ? docSnap : null;
        } catch (error) {
          console.error('Error fetching document:', error);
          return null;
        }
      });
    } catch (error) {
      console.error('Error getting document reference:', error);
      return null;
    }
  }

  private getErrorMessage(error: FirebaseError | any): string {
    if (!error || !error.code) return 'An unknown error occurred';
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return error.message || 'An error occurred.';
    }
  }

  private async handleGoogleAuthSuccess(
    user: FirebaseAuthUser
  ): Promise<AuthResponse> {
    return this.ngZone.run(async () => {
      try {
        if (!this.firestore) {
          throw new Error('Firestore instance is not available');
        }

        const userRef = this.getUserDocRef(user.uid);
        const userDoc = await getDoc(userRef);

        // Prepare user data from Google authentication
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || null,
          phoneNumber: user.phoneNumber || null,
          bio: null,
          role: 'Student' as const,
          level: 1, // Default level for new users
          emailVerified: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        };

        if (!userDoc.exists()) {
          // Create new user document with Google profile data
          const newUser: UserProfile = {
            ...userData,
            createdAt: serverTimestamp(),
          };

          await setDoc(userRef, newUser);
          this.ngZone.run(() => {
            this.userSubject.next(newUser);
            this.currentUser = newUser;
          });
          return {
            success: true,
            message: 'Google account successfully linked and signed in!',
            user: newUser,
          };
        } else {
          // Update existing user document with latest Google profile data
          const existingData = userDoc.data() as UserProfile;
          const updates = {
            ...userData,
            // Preserve existing role and creation date
            role: existingData.role || 'Student',
            createdAt: existingData.createdAt || serverTimestamp(),
          };

          await updateDoc(userRef, updates);

          this.ngZone.run(() => {
            this.userSubject.next(updates);
            this.currentUser = updates;
          });

          return {
            success: true,
            message: 'Successfully signed in with Google!',
            user: updates,
          };
        }
      } catch (error) {
        console.error('Error in handleGoogleAuthSuccess:', error);
        return {
          success: false,
          error: error,
          message: 'Failed to process Google sign in',
          user: null,
        };
      }
    });
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      return await this.ngZone.run(async () => {
        // Configure Google provider with additional scopes
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        // Set custom parameters for Google sign-in
        provider.setCustomParameters({
          prompt: 'select_account', // Forces account selection even when one account is available
        });

        // Execute sign-in with popup
        const result = await signInWithPopup(this.auth, provider);

        if (!result.user) {
          throw new Error('No user returned from Google sign in');
        }

        // Process the successful sign-in
        const authResult = await this.handleGoogleAuthSuccess(result.user);

        return {
          success: authResult.success,
          user: authResult.user || undefined,
          message: authResult.message || 'Successfully signed in with Google',
          error: authResult.error,
        };
      });
    } catch (error: any) {
      console.error('Error in signInWithGoogle:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error,
        user: undefined,
      };
    }
  }

  // Sign in with Facebook
  async signInWithFacebook(): Promise<AuthResponse> {
    try {
      return await this.ngZone.run(async () => {
        // Note: You'll need to implement Facebook provider
        // This is a placeholder implementation
        throw new Error('Facebook login not implemented');
      });
    } catch (error: any) {
      console.error('Error in signInWithFacebook:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error,
        user: undefined,
      };
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.userSubject.next(null);
      this.currentUser = null;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get list of registered Google accounts
  async getGoogleAccounts(email: string): Promise<UserProfile[]> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(
        usersRef,
        where('email', '==', email),
        where('providerId', '==', 'google.com')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc: any) =>
          ({
            uid: doc.id,
            ...doc.data(),
          } as UserProfile)
      );
    } catch (error) {
      console.error('Error fetching Google accounts:', error);
      return [];
    }
  }

  async sendEmailVerification(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Tidak ada pengguna yang masuk');
    }

    const actionCodeSettings = {
      url: `${window.location.origin}/login`,
      handleCodeInApp: true,
    };

    await sendEmailVerificationFn(user, actionCodeSettings);

    // Update the user's document to track that verification was sent
    const userRef = this.getUserDocRef(user.uid);
    await updateDoc(userRef, {
      emailVerificationSentAt: serverTimestamp(),
    });
  }

  // Check if user's email is verified
  async checkEmailVerification(): Promise<boolean> {
    try {
      await this.auth.currentUser?.reload();
      return this.auth.currentUser?.emailVerified || false;
    } catch (error) {
      console.error('Gagal memeriksa verifikasi email:', error);
      return false;
    }
  }
}
