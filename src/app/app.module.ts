import {
  NgModule,
  APP_INITIALIZER,
  ErrorHandler,
  Injectable,
  Injector,
  InjectionToken,
  inject,
  isDevMode,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  IonicModule,
  IonicRouteStrategy,
  Platform,
  isPlatform,
} from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';

// Firebase v9+ Modular API
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  CACHE_SIZE_UNLIMITED,
  Firestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

import { NewsService } from './services/news.service';

// AngularFire (for compatibility)
import { AngularFireModule } from '@angular/fire/compat';
import {
  AngularFireAuthModule,
  USE_EMULATOR as USE_AUTH_EMULATOR,
} from '@angular/fire/compat/auth';
import {
  AngularFirestoreModule,
  USE_EMULATOR as USE_FIRESTORE_EMULATOR,
} from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import {
  AngularFireFunctionsModule,
  USE_EMULATOR as USE_FUNCTIONS_EMULATOR,
} from '@angular/fire/compat/functions';

// Environment
import { environment } from '../environments/environment';

// RxJS operators
import 'firebase/compat/firestore'; // For FieldValue.arrayUnion() etc.

// Components
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// Services
import { AuthService } from './services/auth.service';
import { CodeWorkspaceService } from './services/code-workspace.service';

// Shared Module
import { SharedModule } from './shared/shared.module';
import { ServiceWorkerModule } from '@angular/service-worker';

// Global Error Handler
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private platform = inject(Platform);

  handleError(error: any): void {
    console.error('Global Error Handler:', error);

    if (this.platform.is('cordova')) {
      // Handle native errors
      console.error('Native Error:', error);
    }
  }
}

// Firebase Services
export let firebaseApp: any;

export function initializeFirebaseServices() {
  if (!firebaseApp) {
    throw new Error('Firebase app not initialized');
  }

  // Initialize Auth
  const auth = getAuth(firebaseApp);
  
  // Initialize Firestore with simpler configuration
  const firestore = getFirestore(firebaseApp);
  
  // Enable offline persistence
  enableIndexedDbPersistence(firestore).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Offline persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support offline persistence.');
    }
  });

  return { firestore, auth };
}

// Helper function to get Auth instance
export function getAuthInstance() {
  if (!firebaseApp) {
    console.error('Firebase app not initialized when requesting Auth');
    throw new Error(
      'Firebase app not initialized. Please check your Firebase configuration.'
    );
  }
  try {
    return getAuth(firebaseApp);
  } catch (error) {
    console.error('Failed to get Auth instance:', error);
    throw new Error(
      'Failed to initialize Firebase Authentication. Please check your configuration.'
    );
  }
}

// Firebase Initialization
export function initializeFirebase(platform: Platform) {
  return (): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        console.log('Initializing Firebase...');

        // Validate environment configuration
        if (!environment.firebaseConfig) {
          throw new Error('Firebase configuration is missing in environment');
        }

        try {
          // Initialize Firebase
          firebaseApp = initializeApp(environment.firebaseConfig);
          console.log('Firebase app initialized');

          // Initialize Firebase services
          const { auth, firestore } = initializeFirebaseServices();
          console.log('Firebase services initialized');

          // Initialize Firestore with specific settings
          try {
            initializeFirestore(firebaseApp, {
              cacheSizeBytes: CACHE_SIZE_UNLIMITED,
              localCache: persistentLocalCache()
            });
            console.log('Firestore initialized with persistent cache');
          } catch (err) {
            console.warn('Failed to initialize Firestore with persistent cache:', err);
          }

          // Set auth persistence
          try {
            await setPersistence(auth, browserLocalPersistence);
            console.log('Auth persistence set to LOCAL');
          } catch (err) {
            console.warn('Failed to set auth persistence:', err);
          }

          // Set up emulators in development
          if (!environment.production && environment.firebaseEmulators) {
            try {
              connectAuthEmulator(auth, 'http://localhost:9099', {
                disableWarnings: true,
              });
              connectFirestoreEmulator(firestore, 'localhost', 8080);
              console.log('Firebase emulators connected');
            } catch (e) {
              console.warn('Failed to connect to Firebase emulators:', e);
            }
          }

          resolve();
        } catch (error) {
          console.error('Error initializing Firebase services:', error);
          throw error;
        }
      } catch (error) {
        console.error('Critical error during Firebase initialization:', error);
        reject(error);
      }
    });
  };
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      mode: 'md', // Use material design mode
    }),
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    IonicStorageModule.forRoot({
      driverOrder: ['indexeddb', 'localstorage'],
    }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireFunctionsModule,
    SharedModule,
  ],
  providers: [
    // Core Services
    AuthService,
    NewsService,

    // Route Strategy
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // Error Handling
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    // Firebase App
    {
      provide: 'FIREBASE_APP',
      useFactory: () => initializeApp(environment.firebaseConfig)
    },

    // Firestore
    {
      provide: Firestore,
      useFactory: (platform: Platform, app: any) => {
        const firestore = getFirestore(app);
        if (environment.firebaseEmulators && !platform.is('capacitor')) {
          connectFirestoreEmulator(firestore, 'localhost', 8080);
        }
        return firestore;
      },
      deps: [Platform, 'FIREBASE_APP']
    },

    // Auth
    {
      provide: 'FIREBASE_AUTH',
      useFactory: (app: any) => getAuth(app),
      deps: ['FIREBASE_APP']
    },

    // Firebase Initialization
    {
      provide: APP_INITIALIZER,
      useFactory: (platform: Platform) => () => initializeFirebase(platform),
      deps: [Platform],
      multi: true,
    },

    // CodeWorkspaceService (provide it here to avoid circular deps)
    {
      provide: CodeWorkspaceService,
      useFactory: (firestore: Firestore, authService: AuthService) => {
        return new CodeWorkspaceService(firestore, authService);
      },
      deps: [Firestore, AuthService]
    },

    // AngularFire emulator settings
    ...(!environment.production && environment.firebaseEmulators
      ? [
          { provide: USE_AUTH_EMULATOR, useValue: ['localhost', 9099] },
          { provide: USE_FIRESTORE_EMULATOR, useValue: ['localhost', 8080] },
        ]
      : []),
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
