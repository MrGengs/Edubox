export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
  role?: 'student' | 'admin' | 'teacher' | string;
  level?: number;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;
}
