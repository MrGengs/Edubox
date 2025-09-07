import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class ForgotPasswordPage {
  email = '';
  isMobile = false;

  constructor(
    private authService: AuthService,
    public router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {
    this.checkPlatform();
  }

  private checkPlatform() {
    // Set isMobile based on screen width
    this.isMobile = window.innerWidth < 768; // Common tablet breakpoint
  }

  async resetPassword() {
    if (!this.email) {
      this.showAlert('Error', 'Silakan masukkan email Anda');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Mengirim link reset...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.authService.forgotPassword(this.email);
      await loading.dismiss();
      await this.showSuccessAlert();
    } catch (error: any) {
      await loading.dismiss();
      this.showAlert('Error', this.getErrorMessage(error));
    }
  }

  private async showSuccessAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Email Terkirim',
      message: 'Link reset password telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam Anda.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private getErrorMessage(error: any): string {
    if (!error) return 'Terjadi kesalahan. Silakan coba lagi.';

    switch (error.code) {
      case 'auth/user-not-found':
        return 'Tidak ada akun yang terdaftar dengan email ini';
      case 'auth/invalid-email':
        return 'Format email tidak valid';
      case 'auth/too-many-requests':
        return 'Terlalu banyak permintaan. Silakan coba lagi nanti.';
      default:
        return error.message || 'Terjadi kesalahan. Silakan coba lagi.';
    }
  }
}
