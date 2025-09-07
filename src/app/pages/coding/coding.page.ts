import {
  Component,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonLabel,
  IonList,
  IonItem,
  IonTextarea,
  IonAccordionGroup,
  IonAccordion,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
// Icons are used directly in the template with their names
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

declare const SerialPort: any;

interface AnimationTemplate {
  name: string;
  code: string;
}

@Component({
  selector: 'app-coding',
  templateUrl: './coding.page.html',
  styleUrls: ['./coding.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonLabel,
    IonList,
    IonItem,
    IonTextarea,
    IonAccordionGroup,
    IonAccordion,
    BottomNavComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CodingPage implements OnInit, OnDestroy {
  // Matrix state
  matrix: number[] = Array(16).fill(0);
  matrixJson: string = '';
  logMessages: string[] = [];
  isConnected = false;

  // Animation templates
  templates: AnimationTemplate[] = [
    {
      name: 'Animasi 1',
      code: `void anim1() {
  for (int i=0; i<4; i++) {
    digitalWrite(layerPins[i], HIGH);
    delay(200);
    digitalWrite(layerPins[i], LOW);
  }
}`,
    },
    {
      name: 'Animasi 2',
      code: `void anim2() {
  for (int i=0; i<16; i++) {
    digitalWrite(ledPins[i], HIGH);
    delay(100);
    digitalWrite(ledPins[i], LOW);
  }
}`,
    },
    {
      name: 'Animasi 3',
      code: `void anim3() {
  for (int i=0; i<4; i++) {
    digitalWrite(layerPins[i], HIGH);
    for (int j=0; j<16; j++) digitalWrite(ledPins[j], HIGH);
    delay(200);
    for (int j=0; j<16; j++) digitalWrite(ledPins[j], LOW);
    digitalWrite(layerPins[i], LOW);
  }
}`,
    },
    {
      name: 'Animasi 4',
      code: `void anim4() {
  for (int j=0; j<16; j++) {
    digitalWrite(ledPins[j], HIGH);
  }
  delay(500);
  for (int j=0; j<16; j++) {
    digitalWrite(ledPins[j], LOW);
  }
}`,
    },
    {
      name: 'Animasi 5',
      code: `void anim5() {
  for (int l=0; l<4; l++) {
    digitalWrite(layerPins[l], HIGH);
    delay(100);
    digitalWrite(layerPins[l], LOW);
  }
}`,
    },
  ];

  // Animation names for the buttons
  animations: string[] = this.templates.map((t) => t.name);

  private port: SerialPort | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkSerialSupport();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  onNavigate(event: string) {
    this.router.navigate([event]);
  }

  // Check if Web Serial API is supported
  private checkSerialSupport(): boolean {
    const isSupported = 'serial' in navigator;
    if (!isSupported) {
      this.log('Web Serial API is not supported in this browser');
      this.presentToast(
        'Web Serial API is not supported in this browser',
        'warning'
      );
    }
    return isSupported;
  }

  // Toggle cell state in the matrix
  toggleCell(index: number): void {
    this.matrix[index] = this.matrix[index] ? 0 : 1;
  }

  // Connect to a serial port
  async connect(): Promise<void> {
    try {
      if (!this.checkSerialSupport() || !navigator.serial) {
        throw new Error('Web Serial API not supported');
      }

      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 115200 });
      this.writer = this.port.writable?.getWriter() || null;
      this.isConnected = true;
      this.log('Connected to Edubox');
      await this.presentToast('Connected to Edubox', 'success');

      // Run light test sequence
      await this.runLightTest();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.log(`Connection failed: ${errorMessage}`);
      await this.presentToast(`Connection failed: ${errorMessage}`, 'danger');
    }
  }

  // Turn on all LEDs in 4x4x4 cube
  private async runLightTest(): Promise<void> {
    if (!this.writer) return;

    try {
      // 1. First, turn off all LEDs
      await this.sendCommand('ANIM0\n');
      await this.delay(300);

      // 2. Try different methods to turn on all LEDs
      // Method 1: Turn on all layers individually
      for (let layer = 0; layer < 4; layer++) {
        await this.sendCommand(`LAYER${layer}ON\n`);
        await this.delay(100);
      }

      // 3. Also try the ALLON command
      await this.sendCommand('ALLON\n');
      this.log('All LEDs should be ON');
      await this.delay(2000);

      // 4. Turn off all LEDs
      await this.sendCommand('ALLOFF\n');
      await this.delay(300);

      this.log('Light test sequence completed');
    } catch (error) {
      console.error('Error during light test:', error);
    }
  }

  // Helper method for delays
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Helper method to send commands to Arduino
  private async sendCommand(cmd: string): Promise<void> {
    if (!this.writer) {
      throw new Error('Not connected to Edubox');
    }
    // Remove any existing newlines and add exactly one at the end
    const command = cmd.trim() + '\n';
    await this.writer.write(new TextEncoder().encode(command));
    console.log(`Sent: ${command.trim()}`);
    this.log(`Sent: ${command.trim()}`);
  }

  // Disconnect from the serial port
  async disconnect(): Promise<void> {
    try {
      if (this.writer) {
        try {
          // 1. Send ANIM0 to stop any running animation (assuming ANIM0 is stop)
          const stopCmd = 'ANIM0\n';
          await this.writer.write(new TextEncoder().encode(stopCmd));
          this.log('Sent ANIM0 to stop animations');

          // 2. Small delay to ensure command is processed
          await new Promise((resolve) => setTimeout(resolve, 100));

          // 3. Close the writer
          await this.writer.releaseLock();
          this.writer = null;
        } catch (e) {
          console.warn('Error during disconnection sequence:', e);
        }
      }

      // Close the port if it exists
      if (this.port) {
        try {
          // Close the port
          await this.port.close();
          this.log('Serial port closed successfully');
        } catch (e) {
          console.warn('Error closing serial port:', e);
        } finally {
          this.port = null;
        }
      }

      // Update connection state
      this.isConnected = false;
      this.log('Successfully disconnected from Edubox');
      await this.presentToast(
        'Successfully disconnected from Edubox',
        'warning'
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during disconnection';
      console.error('Disconnection error:', error);
      this.log(`Disconnection error: ${errorMessage}`);
      await this.presentToast(`Disconnection error: ${errorMessage}`, 'danger');

      // Force cleanup in case of error
      this.writer = null;
      this.port = null;
      this.isConnected = false;
    }
  }

  async sendAnim(animNumber: number) {
    if (!this.writer) {
      this.log('Not connected!');
      this.presentToast('Not connected to device', 'warning');
      return;
    }

    try {
      const cmd = `ANIM${animNumber}\n`;
      await this.writer.write(new TextEncoder().encode(cmd));
      this.log(`Sent: ANIM${animNumber}`);
      this.presentToast(`Sent animation ${animNumber}`, 'success');
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.log('Send error: ' + errorMsg);
      this.presentToast(`Failed to send command: ${errorMsg}`, 'danger');
    }
  }

  exportMatrix() {
    if (this.matrix) {
      this.matrixJson = JSON.stringify(this.matrix);
    }
  }

  clearMatrix() {
    this.matrix = new Array(16).fill(0);
    this.matrixJson = '';
  }

  clearLog() {
    this.logMessages = [];
  }

  log(message: string) {
    this.logMessages.push(message);
  }

  async presentToast(message: string, color: string = 'medium') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
    });
    await toast.present();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
