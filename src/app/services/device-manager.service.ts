import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { WorkspaceStateService } from './workspace-state.service';

// Define a minimal interface for the serial port we need
interface SimpleSerialPort {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  [key: string]: any; // Allow additional properties
}

export interface DeviceConnection {
  id: string;
  name: string;
  type: 'arduino' | 'led-cube' | 'other';
  connected: boolean;
  port?: SimpleSerialPort;
  lastSeen?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceManagerService {
  private devices: DeviceConnection[] = [];
  private stateSubscription: Subscription;

  constructor(private stateService: WorkspaceStateService) {
    // Initialize with any saved devices or default state
    this.stateSubscription = this.stateService.state$.subscribe(state => {
      this.devices = state.devices;
    });
  }

  ngOnDestroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  /**
   * Scans for available devices and updates the devices list
   */
  async scanForDevices(): Promise<void> {
    try {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported in this browser');
      }

      // Request permission to access serial ports
      const nav = navigator as any;
      if (!nav.serial) {
        throw new Error('Web Serial API not available');
      }

      // Get available ports
      const ports = await nav.serial.getPorts();
      
      // Update devices list
      const newDevices = ports.map((port: any) => ({
        id: port.getInfo().usbVendorId ? 
             `usb-${port.getInfo().usbVendorId}-${port.getInfo().usbProductId}` : 
             `port-${Math.random().toString(36).substr(2, 9)}`,
        name: port.getInfo().usbProductDescription || 'Unknown Device',
        type: 'other',
        connected: false
      }));
      
      this.stateService.updateDevices(newDevices);
    } catch (error) {
      console.error('Error scanning for devices:', error);
      throw error;
    }
  }

  async connectToDevice(deviceType: 'arduino' | 'led-cube'): Promise<void> {
    try {
      this.stateService.setLoading(true);
      
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported in this browser');
      }

      const nav = navigator as any;
      if (!nav.serial) {
        throw new Error('Web Serial API not available');
      }
      
      const port = await nav.serial.requestPort() as SimpleSerialPort;
      await port.open({ baudRate: 9600 });
      
      const device: DeviceConnection = {
        id: `device-${Date.now()}`,
        name: `${deviceType}-${this.devices.length + 1}`,
        type: deviceType,
        connected: true,
        port: port,
        lastSeen: new Date()
      };
      
      // Update state with new device
      const updatedDevices = [...this.devices, device];
      this.stateService.updateDevices(updatedDevices);
      
      this.setupReader(port, device);
      
    } catch (error: any) {
      console.error('Error connecting to device:', error);
      this.stateService.setError(`Error connecting to device: ${error.message}`);
      throw error;
    } finally {
      this.stateService.setLoading(false);
    }
  }
  
  async disconnectDevice(deviceId: string): Promise<void> {
    try {
      this.stateService.setLoading(true);
      
      const device = this.devices.find(d => d.id === deviceId);
      if (!device || !device.port) return;

      await device.port.close();
      
      // Update state with disconnected device
      const updatedDevices = this.devices.map(d => 
        d.id === deviceId ? { ...d, connected: false, port: undefined } : d
      );
      
      this.stateService.updateDevices(updatedDevices);
      
    } catch (error: any) {
      console.error('Error disconnecting device:', error);
      this.stateService.setError(`Error disconnecting device: ${error.message}`);
      throw error;
    } finally {
      this.stateService.setLoading(false);
    }
  }
  
  async sendCommand(deviceId: string, command: string): Promise<void> {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device || !device.port || !device.connected) {
      throw new Error('Device not connected');
    }
    
    const encoder = new TextEncoder();
    const writer = device.port.writable?.getWriter();
    
    if (!writer) {
      throw new Error('Cannot write to device');
    }
    
    try {
      await writer.write(encoder.encode(command + '\n'));
    } finally {
      writer.releaseLock();
    }
  }
  
  getConnectedDevices(): DeviceConnection[] {
    return this.devices.filter(d => d.connected);
  }
  
  private async setupReader(port: SimpleSerialPort, device: DeviceConnection): Promise<void> {
    if (!port.readable) return;
    
    const decoder = new TextDecoder();
    const reader = port.readable.getReader();
    
    const readChunk = async () => {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            reader.releaseLock();
            break;
          }
          
          if (value) {
            const text = decoder.decode(value);
            // Handle incoming data (you can emit this to components)
            console.log(`Data from ${device.name}:`, text);
          }
        }
      } catch (error) {
        console.error('Error reading from device:', error);
        this.stateService.setError(`Error reading from device: ${error}`);
      } finally {
        reader.releaseLock();
        await this.disconnectDevice(device.id).catch(console.error);
      }
    };
    
    readChunk().catch(console.error);
  }
}
