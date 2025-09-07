import { Injectable, OnDestroy, Inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  DocumentData,
  DocumentReference,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subject, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './auth.service';

export interface CodeWorkspaceFile {
  [key: string]: string;
}

export interface CodeWorkspace {
  id?: string;
  name: string;
  description?: string;
  code: string;
  language: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  files?: CodeWorkspaceFile;
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CodeWorkspaceService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private _currentWorkspace = new BehaviorSubject<CodeWorkspace | null>(null);
  currentWorkspace$ = this._currentWorkspace.asObservable();
  private workspacesCollection = 'codeWorkspaces';

  constructor(
    @Inject(Firestore) private firestore: Firestore,
    private authService: AuthService
  ) {}

  // Create a new workspace
  async createWorkspace(
    workspace: Omit<CodeWorkspace, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ id: string } & Omit<CodeWorkspace, 'id'>> {
    try {
      const timestamp = new Date();
      const workspaceWithTimestamps = {
        ...workspace,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const docRef = await addDoc(
        collection(this.firestore, this.workspacesCollection),
        workspaceWithTimestamps
      );
      const newWorkspace = {
        id: docRef.id,
        ...workspaceWithTimestamps,
      };

      this._currentWorkspace.next(newWorkspace);
      return newWorkspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }

  // Get all workspaces for a user
  getUserWorkspaces(userId: string): Observable<CodeWorkspace[]> {
    const q = query(
      collection(this.firestore, this.workspacesCollection),
      where('userId', '==', userId)
    );
    return collectionData(q, { idField: 'id' }) as Observable<CodeWorkspace[]>;
  }

  // Get a single workspace by ID
  async getWorkspace(id: string): Promise<CodeWorkspace | null> {
    const docRef = doc(this.firestore, `${this.workspacesCollection}/${id}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CodeWorkspace;
    }
    return null;
  }

  // Update a workspace
  async updateWorkspace(
    id: string,
    updates: Partial<CodeWorkspace>
  ): Promise<void> {
    try {
      const docRef = doc(this.firestore, `${this.workspacesCollection}/${id}`);
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await updateDoc(docRef, updateData);

      // Update the current workspace if it's the one being updated
      const current = this._currentWorkspace.value;
      if (current && current.id === id) {
        this._currentWorkspace.next({ ...current, ...updateData });
      }
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw error;
    }
  }

  // Set the current workspace
  setCurrentWorkspace(workspace: CodeWorkspace | null): void {
    this._currentWorkspace.next(workspace);
  }

  // Clear the current workspace
  clearCurrentWorkspace(): void {
    this._currentWorkspace.next(null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Delete a workspace
  async deleteWorkspace(id: string): Promise<void> {
    const docRef = doc(this.firestore, `${this.workspacesCollection}/${id}`);
    await deleteDoc(docRef);
  }
}
