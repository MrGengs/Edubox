import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { DeviceManagerService, DeviceConnection } from '../../services/device-manager.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-device-manager',
  templateUrl: './device-manager.component.html',
  styleUrls: ['./device-manager.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class DeviceManagerComponent implements OnInit, OnDestroy {
  devices: DeviceConnection[] = [];
  isLoading = false;
  error: string | null = null;
  testCommand = '';
  isConnecting = false;

  constructor(private deviceManager: DeviceManagerService) { }

  private subscription: any;

  ngOnInit() {
    // Subscribe to devices updates
    this.subscription = this.deviceManager.devices$.subscribe({
      next: (devices) => {
        this.devices = devices;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error loading devices';
        this.isLoading = false;
        console.error('Devices subscription error:', err);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async connectToDevice(deviceType: 'arduino' | 'led-cube') {
    if (this.isConnecting) return;
    
    this.isConnecting = true;
    this.isLoading = true;
    this.error = null;
    
    try {
      await this.deviceManager.connectToDevice(deviceType);
      // The devices list will be updated via the subscription in ngOnInit
    } catch (err: any) {
      this.error = err.message || 'Failed to connect to device';
      console.error('Connection error:', err);
    } finally {
      this.isLoading = false;
      this.isConnecting = false;
    }
  }

  disconnectDevice(deviceId: string) {
    this.deviceManager.disconnectDevice(deviceId);
  }

  sendTestCommand(device: DeviceConnection) {
    if (device.type === 'arduino') {
      this.deviceManager.sendCommand(device.id, 'TEST')
        .catch(err => console.error('Error sending command:', err));
    } else if (device.type === 'led-cube') {
      this.deviceManager.sendCommand(device.id, 'PATTERN:TEST')
        .catch(err => console.error('Error sending command:', err));
    }
  }
}
