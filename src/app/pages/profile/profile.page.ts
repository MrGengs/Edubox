import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  Camera,
  CameraResultType,
  CameraSource,
  CameraOptions,
} from '@capacitor/camera';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  LoadingController,
  ToastController,
  Platform,
  ModalController,
} from '@ionic/angular';
import {
  Firestore,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  collection,
} from '@angular/fire/firestore';
import {
  Auth,
  User,
  onAuthStateChanged,
  Unsubscribe,
} from '@angular/fire/auth';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection as getCollection } from 'firebase/firestore';

// Services
import { AuthService } from '../../services/auth.service';

// Interfaces
export interface AppUserProfile {
  uid?: string;
  displayName?: string;
  email?: string;
  photoURL?: string | null;
  role?: string;
  bio?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  locked: boolean;
}

interface Activity {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
}

interface SettingItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  iconClass: string;
  settings?: SettingItem[];
}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonicModule,
    BottomNavComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class ProfilePage implements OnInit, OnDestroy {
  // Swiper modules will be loaded when needed

  // Services
  private platform = inject(Platform);
  private auth = inject(Auth);
  private authUnsubscribe: Unsubscribe | null = null;

  // User data
  user: User | null = null;
  userName: string = 'Loading...';
  userEmail: string = '';
  userRole: string = 'Student';
  userBio: string = '';
  userPhone: string = '';
  userInitials: string = '??';
  avatarImage: string | null = null;
  currentAvatar: string = '??';
  showEditModal = false;
  imageLoaded = false;
  imageError = false;
  debugMode = false;

  // Loading states
  isLoading: boolean = true;
  isSaving: boolean = false;

  // Form state
  editForm: Partial<AppUserProfile> = {
    displayName: '',
    bio: '',
    email: '',
    phoneNumber: '',
  };

  // UI state
  showModal = false;
  modalData: any = {};

  // Dependencies
  private userSubscription: Subscription | null = null;
  private loading: HTMLIonLoadingElement | null = null;

  // Stats and achievements
  stats = {
    xp: 156,
    completed: 24,
    certificates: 12,
  };

  levelInfo = {
    current: 1,
    title: 'Beginner',
    currentXp: 0,
    nextLevelXp: 100,
    xpToNextLevel: 100,
  };

  achievements: Achievement[] = [
    {
      id: 'first-code',
      icon: '',
      title: 'First Code',
      description: 'Completed first program',
      locked: false,
    },
    {
      id: 'quick-learner',
      icon: '',
      title: 'Quick Learner',
      description: '3 modules in 1 day',
      locked: false,
    },
    {
      id: 'perfectionist',
      icon: '',
      title: 'Perfectionist',
      description: '100% quiz score',
      locked: false,
    },
    {
      id: 'code-master',
      icon: '',
      title: 'Code Master',
      description: 'Complete 50 modules',
      locked: true,
    },
  ];

  activities: Activity[] = [
    {
      id: 'activity-1',
      icon: '',
      title: 'Completed "LED Control & PWM"',
      description: 'Earned 25 XP points',
      time: '2 hours ago',
    },
    {
      id: 'activity-2',
      icon: '',
      title: 'Achievement Unlocked',
      description: '"Quick Learner" badge earned',
      time: '1 day ago',
    },
  ];

  settings: any[] = [];

  private firestore: Firestore;
  private firestoreInstance: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    firestore: Firestore
  ) {
    this.firestore = firestore;
    this.firestoreInstance = getFirestore();
  }

  async ngOnInit() {
    // Set initial loading state
    this.isLoading = true;
    this.userName = 'Loading...';
    this.userInitials = '??';
    this.cdr.detectChanges();

    try {
      // Ensure Firestore is available
      if (!this.firestore) {
        throw new Error('Firestore service not available');
      }

      // Get the Firebase Auth instance
      const auth = getAuth();

      // Subscribe to auth state changes
      this.authUnsubscribe = onAuthStateChanged(
        auth,
        async (user: User | null) => {
          await this.ngZone.run(async () => {
            try {
              this.user = user;

              if (user) {
                await this.loadUserData();
              } else {
                // If no user is logged in, redirect to login
                this.router.navigate(['/login']);
              }
            } catch (error) {
              console.error('Error in auth state change:', error);
              this.showErrorToast(
                'Terjadi kesalahan saat memuat data pengguna'
              );
            } finally {
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          });
        },
        (error: any) => {
          this.ngZone.run(() => {
            console.error('Auth state change error:', error);
            this.showErrorToast('Gagal memuat status autentikasi');
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        }
      );
    } catch (error) {
      console.error('Error in ngOnInit:', error);
      this.ngZone.run(() => {
        this.showErrorToast('Terjadi kesalahan inisialisasi');
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  ngOnDestroy() {
    // Clean up auth subscription
    if (this.authUnsubscribe) {
      try {
        this.authUnsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from auth state:', error);
      } finally {
        this.authUnsubscribe = null;
      }
    }

    // Clean up any other subscriptions
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
      this.userSubscription = null;
    }
  }

  private async loadUserData() {
    if (!this.user) {
      this.ngZone.run(() => {
        this.userName = 'User';
        this.userInitials = '??';
        this.isLoading = false;
        this.cdr.detectChanges();
      });
      return;
    }

    try {
      this.ngZone.run(() => {
        this.isLoading = true;
        this.userName = 'Loading...';
        this.userInitials = '??';
        this.avatarImage = null;
        this.cdr.detectChanges();
      });

      // Ensure Firestore is properly initialized
      if (!this.firestore) {
        throw new Error('Firestore service not available');
      }

      // Get a reference to the user's document using the Firestore instance
      const userDocRef = doc(this.firestoreInstance, 'users', this.user.uid);

      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      );

      // Race between the getDoc and the timeout
      const userDoc = (await Promise.race([
        getDoc(userDocRef),
        timeoutPromise,
      ])) as any;

      await this.ngZone.run(async () => {
        try {
          if (userDoc?.exists()) {
            const userData = userDoc.data() as AppUserProfile;
            const currentUser = this.user; // Store in a variable to avoid repeated null checks

            this.userName =
              userData.displayName || currentUser?.displayName || 'User';
            this.userEmail = userData.email || currentUser?.email || '';
            this.userRole = userData.role || 'Student';
            this.userBio = userData.bio || '';
            this.userPhone =
              userData.phoneNumber || currentUser?.phoneNumber || '';
            this.userInitials = this.generateInitials(this.userName);

            const photoUrl = userData.photoURL || currentUser?.photoURL;
            this.avatarImage = photoUrl
              ? photoUrl.replace(/=s96-c$/, '=s400-c')
              : null;
          } else {
            console.log('No user document found, creating profile...');
            await this.createUserProfile();
          }
        } catch (error) {
          console.error('Error processing user data:', error);
          this.userName = 'Error';
          this.userInitials = '!!';
          this.showErrorToast('Gagal memproses data pengguna');
        } finally {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      this.ngZone.run(() => {
        this.userName = 'Error';
        this.userInitials = '!!';
        this.showErrorToast(
          'Gagal memuat data pengguna: ' +
            (error instanceof Error ? error.message : 'Unknown error')
        );
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  private async createUserProfile(): Promise<void> {
    if (!this.user) {
      console.error('No user available to create profile');
      return;
    }

    try {
      // Set loading state
      this.ngZone.run(() => {
        this.isLoading = true;
        this.userName = 'Menyimpan...';
        this.userInitials = '??';
        this.cdr.detectChanges();
      });

      // Ensure Firestore is available
      if (!this.firestore) {
        throw new Error('Firestore service not available');
      }

      // Prepare user data with fallbacks
      const displayName = this.user.displayName || 'User';
      const email = this.user.email || '';
      const phoneNumber = this.user.phoneNumber || '';
      const photoURL = this.user.photoURL || null;

      // Create user data object with proper types for Firestore
      const userData = {
        uid: this.user.uid,
        displayName: displayName,
        email: email,
        photoURL: photoURL,
        role: 'Student',
        bio: '',
        phoneNumber: phoneNumber,
        emailVerified: this.user.emailVerified || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Create or update the user document using the Firestore instance
      const userDocRef = doc(this.firestoreInstance, 'users', this.user.uid);
      await setDoc(userDocRef, userData, { merge: true });

      // Update local state
      await this.ngZone.run(async () => {
        this.userName = displayName;
        this.userEmail = email;
        this.userPhone = phoneNumber;
        this.userInitials = this.generateInitials(displayName);
        this.avatarImage = photoURL
          ? photoURL.replace(/=s96-c$/, '=s400-c')
          : null;
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      this.ngZone.run(() => {
        this.showErrorToast('Gagal membuat profil pengguna');
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  // Removed initializeUserData as it's no longer needed
  // The functionality has been consolidated into loadUserData

  // Helper function to show toast messages
  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success'
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  // Helper function to show error toast
  private async showErrorToast(message: string) {
    await this.showToast(message, 'danger');
  }

  // Handle image load event
  onImageLoad(event: Event) {
    this.imageLoaded = true;
    this.imageError = false;
    this.cdr.detectChanges();
  }

  // Handle image error event
  onImageError(event: Event) {
    console.error('Error loading profile image:', event);
    this.imageError = true;
    this.imageLoaded = false;
    this.avatarImage = null;
    this.currentAvatar = this.userInitials;
    this.cdr.detectChanges();
  }

  // Generate initials from user's name
  private generateInitials(name: string): string {
    if (!name) return '??';

    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (
      nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
    ).toUpperCase();
  }

  // Edit profile method - initialize form with current user data
  editProfile() {
    this.editForm = {
      displayName: this.userName,
      bio: this.userBio,
      email: this.userEmail,
      phoneNumber: this.userPhone,
    };
    this.showEditModal = true;
  }

  // Close edit modal and reset form
  closeEditModal() {
    this.showEditModal = false;
    // Reset form to empty values when closing
    this.editForm = {
      displayName: '',
      bio: '',
      email: '',
      phoneNumber: '',
    };
  }

  // Save profile changes to Firebase
  async saveProfile() {
    if (!this.user) {
      this.showErrorToast('Anda harus login terlebih dahulu');
      return;
    }

    // Validate required fields
    if (!this.editForm.displayName?.trim()) {
      this.showErrorToast('Nama tidak boleh kosong');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Menyimpan perubahan...',
      spinner: 'crescent',
    });

    try {
      await loading.present();
      this.isSaving = true;

      // Get current timestamp
      const timestamp = serverTimestamp();

      // Prepare user data for Firestore
      const userData: Partial<AppUserProfile> = {
        displayName: this.editForm.displayName.trim(),
        bio: this.editForm.bio?.trim() || '',
        email: this.editForm.email?.trim() || this.user.email || '',
        phoneNumber: this.editForm.phoneNumber?.trim() || '',
        updatedAt: timestamp,
      };

      // Get user document reference using the Firestore instance
      const userDocRef = doc(this.firestoreInstance, 'users', this.user.uid);

      // Check if document exists
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userDocRef, userData);
      } else {
        // Create new document with additional fields
        await setDoc(userDocRef, {
          ...userData,
          uid: this.user.uid,
          email: this.user.email || '',
          emailVerified: this.user.emailVerified || false,
          photoURL: this.user.photoURL || '',
          role: 'user',
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }

      // Update local state
      this.userName = userData.displayName || '';
      this.userBio = userData.bio || '';
      this.userEmail = userData.email || '';
      this.userPhone = userData.phoneNumber || '';
      this.userInitials = this.generateInitials(this.userName);

      // Show success message
      const toast = await this.toastController.create({
        message: 'Profil berhasil diperbarui',
        duration: 2000,
        color: 'success',
        position: 'top',
      });
      await toast.present();

      // Close modal
      this.closeEditModal();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error saving profile:', error);
      this.showErrorToast('Gagal menyimpan profil. Silakan coba lagi.');

      // Show error message
      const toast = await this.toastController.create({
        message: 'Gagal menyimpan profil. Silakan coba lagi.',
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
    } finally {
      // Dismiss loading
      if (loading) {
        await loading.dismiss();
      }
    }
  }

  viewCertificates() {
    this.router.navigate(['/certificates']);
  }

  showAchievement(achievement: Achievement) {
    if (!achievement.locked) {
      const achievements = {
        'first-code': {
          icon: '🚀',
          title: 'First Code',
          description:
            'Selamat! Anda telah menyelesaikan program pertama Anda. Ini adalah langkah awal yang luar biasa dalam perjalanan coding Anda!',
        },
        'quick-learner': {
          icon: '⚡',
          title: 'Quick Learner',
          description:
            'Wow! Anda menyelesaikan 3 modul dalam satu hari. Kecepatan belajar Anda sangat mengesankan!',
        },
        perfectionist: {
          icon: '💎',
          title: 'Perfectionist',
          description:
            'Luar biasa! Anda meraih skor sempurna 100% pada quiz. Dedikasi Anda patut diacungi jempol!',
        },
      };

      const achievementData =
        achievements[achievement.id as keyof typeof achievements];
      if (achievementData) {
        this.modalData = {
          icon: achievementData.icon,
          title: achievementData.title,
          description: achievementData.description,
        };
        this.showModal = true;
      }
    }
  }

  async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'primary' = 'primary'
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [
        {
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await toast.present();
  }

  async changeAvatar() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Pilih Sumber Gambar',
      buttons: [
        {
          text: 'Ambil Foto',
          icon: 'camera',
          handler: () => {
            this.captureImage(CameraSource.Camera);
          },
        },
        {
          text: 'Pilih dari Galeri',
          icon: 'image',
          handler: () => {
            this.captureImage(CameraSource.Photos);
          },
        },
        {
          text: 'Hapus Foto Profil',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.removeProfileImage();
          },
        },
        {
          text: 'Batal',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  async captureImage(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: source,
        width: 500,
        height: 500,
        correctOrientation: true,
      });

      if (image && image.webPath) {
        // For web and mobile, use webPath
        this.avatarImage = image.webPath;

        // If you need to upload the image to a server, you can use:
        // const response = await fetch(image.webPath);
        // const blob = await response.blob();
        // Then upload the blob to your server

        // Show success message
        this.presentToast('Foto profil berhasil diubah', 'success');
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      this.presentToast('Gagal mengambil gambar', 'danger');
    }
  }

  private async takePhoto(source: CameraSource) {
    await this.captureImage(source);
  }

  async removeProfileImage(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Hapus Foto Profil',
      message: 'Apakah Anda yakin ingin menghapus foto profil?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
        },
        {
          text: 'Hapus',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Menghapus foto...',
              spinner: 'crescent',
            });

            try {
              await loading.present();

              // Use the current user from the component state
              if (!this.user) {
                throw new Error('Pengguna tidak terautentikasi');
              }

              // Update user profile in Firestore using the Firestore instance
              const userDocRef = doc(
                this.firestoreInstance,
                'users',
                this.user.uid
              );
              await updateDoc(userDocRef, {
                photoURL: null,
                updatedAt: serverTimestamp(),
              });

              // Reset all image related states
              this.avatarImage = null;
              this.imageLoaded = false;
              this.imageError = false;

              // Update user initials based on name
              this.ngZone.run(() => {
                const names = (this.userName || 'User').split(' ');
                this.userInitials =
                  names.length > 1
                    ? `${names[0][0]}${
                        names[names.length - 1][0]
                      }`.toUpperCase()
                    : (this.userName || 'Us').substring(0, 2).toUpperCase();

                // Reset avatar image
                this.avatarImage = null;
                this.cdr.detectChanges();
              });

              // Show success message
              await this.presentToast(
                'Foto profil berhasil dihapus',
                'success'
              );
            } catch (error) {
              console.error('Error removing profile image:', error);
              const errorMessage =
                error instanceof Error ? error.message : 'Terjadi kesalahan';
              await this.presentToast(
                `Gagal menghapus foto profil: ${errorMessage}`,
                'danger'
              );
            } finally {
              if (loading) {
                await loading.dismiss();
              }
            }
          },
        },
      ],
    });

    await alert.present();
  }

  private async compressImage(
    blob: Blob,
    initialQuality = 0.7,
    retryCount = 0
  ): Promise<Blob> {
    console.log(
      `🔄 [Profile] Starting image compression with quality: ${initialQuality}`
    );

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions
        const maxDimension = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((maxDimension / width) * height);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((maxDimension / height) * width);
            height = maxDimension;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        try {
          // Draw image with new dimensions
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with specified quality
          canvas.toBlob(
            async (result) => {
              if (result) {
                console.log(
                  `✅ [Profile] Image compressed to ${(
                    result.size / 1024
                  ).toFixed(2)}KB`
                );
                resolve(result);
              } else if (initialQuality > 0.3 && retryCount < 3) {
                // Retry with lower quality if compression fails
                console.warn(
                  `⚠️ [Profile] Compression failed, retrying with lower quality (${
                    initialQuality - 0.1
                  })`
                );
                try {
                  const retryBlob = await this.compressImage(
                    blob,
                    initialQuality - 0.1,
                    retryCount + 1
                  );
                  resolve(retryBlob);
                } catch (retryError) {
                  reject(retryError);
                }
              } else {
                reject(
                  new Error('Failed to compress image after multiple attempts')
                );
              }
            },
            'image/jpeg',
            initialQuality
          );
        } catch (error) {
          reject(
            new Error(
              `Error during image processing: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            )
          );
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        console.error('❌ [Profile] Error loading image for compression');
        reject(new Error('Gagal memuat gambar untuk kompresi'));
      };

      img.onabort = () => {
        URL.revokeObjectURL(url);
        console.error('❌ [Profile] Image loading was aborted');
        reject(new Error('Pemrosesan gambar dibatalkan'));
      };

      img.src = url;
    });
  }

  getProgressPercentage(): number {
    return (this.levelInfo.currentXp / this.levelInfo.nextLevelXp) * 100;
  }

  // Method to handle settings navigation
  async openSettings(settingId: string) {
    switch (settingId) {
      case 'notifications':
        this.router.navigate(['/settings/notifications']);
        break;
      case 'language':
        this.router.navigate(['/settings/language']);
        break;
      case 'help':
        this.router.navigate(['/help']);
        break;
      default:
        console.log('Setting not implemented:', settingId);
    }
  }

  // Method to open privacy policy
  // Method to open about page
  async openAboutPage() {
    this.router.navigate(['/about']);
  }

  // Method to handle logout
  async openPrivacyPolicy() {
    this.router.navigate(['/privacy-policy']);
  }

  async logout() {
    const loading = await this.loadingController.create({
      message: 'Logging out...',
      spinner: 'crescent',
    });

    try {
      await loading.present();
      await this.authService.signOut();
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Logout error:', error);
      this.presentToast('Gagal logout. Silakan coba lagi.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  // Method to close modal
  closeModal() {
    this.showModal = false;
  }
}
