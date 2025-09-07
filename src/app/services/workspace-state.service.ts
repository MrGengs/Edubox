import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DeviceConnection } from './device-manager.service';

export interface WorkspaceState {
  isConnected: boolean;
  connectedDeviceName: string | null;
  devices: DeviceConnection[];
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceStateService {
  private initialState: WorkspaceState = {
    isConnected: false,
    connectedDeviceName: null,
    devices: [],
    isLoading: false,
    error: null
  };

  private stateSubject = new BehaviorSubject<WorkspaceState>(this.initialState);
  state$ = this.stateSubject.asObservable();

  // Getters for current state values
  get currentState(): WorkspaceState {
    return this.stateSubject.value;
  }

  // State update methods
  setLoading(isLoading: boolean): void {
    this.updateState({ isLoading });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }

  updateDevices(devices: DeviceConnection[]): void {
    const connectedDevice = devices.find(d => d.connected);
    this.updateState({
      devices: [...devices],
      isConnected: !!connectedDevice,
      connectedDeviceName: connectedDevice?.name || null
    });
  }

  setConnected(deviceName: string | null): void {
    this.updateState({
      isConnected: !!deviceName,
      connectedDeviceName: deviceName
    });
  }

  private updateState(partialState: Partial<WorkspaceState>): void {
    this.stateSubject.next({
      ...this.currentState,
      ...partialState
    });
  }

  // Reset to initial state
  reset(): void {
    this.stateSubject.next({ ...this.initialState });
  }
}
