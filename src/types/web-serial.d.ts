// Type definitions for Web Serial API
// TypeScript Version: 4.0

// Import the global SerialPort type from @types/w3c-web-serial
import '@types/w3c-web-serial';

declare global {
  // Extend the existing Navigator interface with the serial property
  interface Navigator {
    readonly serial: Navigator['serial'];
  }
}

export {};
