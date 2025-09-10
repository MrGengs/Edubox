// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // Set to true to connect to local Firebase emulators
  firebaseEmulators: false,
  firebaseConfig: {
    apiKey: "AIzaSyDAPhGAb4hDaPGT_Vy60zVm_pZGEgpyPws",
    authDomain: "edubox-48c54.firebaseapp.com",
    projectId: "edubox-48c54",
    storageBucket: "edubox-48c54.firebasestorage.app",
    messagingSenderId: "456233826793",
    appId: "1:456233826793:web:2d4da57204ca5e33d6f378"
  }
};

export const geminiApiKey = "AIzaSyAkIyXZk5Xk36eG4hrQ0aKlRlkg6B5gaw8";

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
