import { Component, inject, OnInit, OnDestroy, NgZone } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  AlertController,
  LoadingController,
  ToastController,
  IonicModule,
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, ReactiveFormsModule],
})
export class LoginPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  rememberMe = false;

  // Inject services
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private ngZone = inject(NgZone);
  googleAccounts: any[] = [];
  showGoogleAccounts = false;
  isGoogleLoading = false;

  constructor() {
    // Load saved credentials if 'remember me' was checked
    const savedEmail = localStorage.getItem('rememberedEmail') || '';
    const savedPassword = localStorage.getItem('rememberedPassword') || '';
    const rememberMe = localStorage.getItem('rememberMe') === 'true';

    this.loginForm = this.fb.group({
      email: [savedEmail, [Validators.required, Validators.email]],
      password: [savedPassword, [Validators.required, Validators.minLength(6)]],
      rememberMe: [rememberMe],
    });

    this.rememberMe = rememberMe;
  }

  ngOnInit() {
    this.authService
      .getCurrentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.router.navigate(['/home']);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getFormValidationError(): string {
    const emailControl = this.loginForm.get('email');
    const passwordControl = this.loginForm.get('password');

    if (
      emailControl?.hasError('required') ||
      passwordControl?.hasError('required')
    ) {
      return 'Email dan password wajib diisi';
    }
    if (emailControl?.hasError('email')) {
      return 'Format email tidak valid';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'Password minimal 6 karakter';
    }
    return 'Periksa kembali input Anda';
  }

  private getErrorMessage(error: any): string {
    if (!error) return 'Terjadi kesalahan. Silakan coba lagi.';

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Email atau password salah';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan. Coba lagi nanti.';
      case 'auth/network-request-failed':
        return 'Masalah jaringan. Periksa koneksi Anda.';
      default:
        return error.message || 'Terjadi kesalahan. Silakan coba lagi.';
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  private async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async loginWithGoogle() {
    if (this.isGoogleLoading) return;
    this.isGoogleLoading = true;
    try {
      const email = this.loginForm.get('email')?.value;

      if (email) {
        const accounts = await this.authService.getGoogleAccounts(email);
        if (accounts.length > 0) {
          this.googleAccounts = accounts;
          this.showGoogleAccounts = true;
          return;
        }
      }

      // Jika tidak ada akun Google yang terdaftar, lanjutkan dengan login Google biasa
      await this.signInWithGoogle();
    } catch (error) {
      console.error('Error checking Google accounts:', error);
      this.showError('Terjadi kesalahan saat memeriksa akun Google');
    } finally {
      this.isGoogleLoading = false;
    }
  }

  async selectGoogleAccount(account: any) {
    try {
      const result = await this.authService.signInWithGoogle();
      if (result.success) {
        this.router.navigate(['/home']);
      } else {
        this.showError(result.message || 'Gagal masuk dengan Google');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      this.showError('Terjadi kesalahan saat masuk dengan Google');
    } finally {
      this.showGoogleAccounts = false;
    }
  }

  async login() {
    // Prevent double submission
    if (this.isLoading) return;

    // Validate form
    if (this.loginForm.invalid) {
      const msg = this.getFormValidationError();
      this.showToast(msg, 'danger');
      return;
    }

    this.isLoading = true;
    this.errorMessage = ''; // Reset error message

    let loading: HTMLIonLoadingElement | null = null;

    try {
      // Show loading indicator
      loading = await this.loadingCtrl.create({
        message: 'Sedang masuk...',
        spinner: 'crescent',
        backdropDismiss: false,
      });
      await loading.present();

      const { email, password, rememberMe } = this.loginForm.value;

      // Save or clear credentials based on remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
        localStorage.setItem('rememberMe', 'false');
      }

      // Sign in with email and password
      const result = await this.authService.signIn(email, password);

      if (!result.success) {
        throw new Error(result.message || 'Gagal masuk. Silakan coba lagi.');
      }

      // Check if email is verified
      const isEmailVerified = await this.authService.checkEmailVerification();

      if (!isEmailVerified) {
        // Dismiss loading before showing alert
        if (loading) {
          await loading.dismiss();
          loading = null;
        }

        const alert = await this.alertCtrl.create({
          header: 'Verifikasi Email',
          message:
            'Email Anda belum diverifikasi. Periksa kotak masuk Anda untuk email verifikasi atau klik tombol di bawah untuk mengirim ulang.',
          buttons: [
            {
              text: 'Nanti',
              role: 'cancel',
              handler: () => {
                // Sign out the user if they choose to verify later
                this.authService.signOut();
              },
            },
            {
              text: 'Kirim Ulang',
              handler: async () => {
                try {
                  await this.authService.sendEmailVerification();
                  this.showToast(
                    'Email verifikasi telah dikirim ulang. Silakan periksa kotak masuk di bagian Anda di bagian spam.',
                    'success'
                  );
                  // Sign out the user after sending verification
                  await this.authService.signOut();
                } catch (error) {
                  console.error('Error sending verification email:', error);
                  this.showToast(
                    'Gagal mengirim ulang email verifikasi. Silakan coba lagi nanti.',
                    'danger'
                  );
                }
              },
            },
          ],
        });

        await alert.present();
        return;
      }

      // Dismiss loading before navigation
      if (loading) {
        await loading.dismiss();
        loading = null;
      }

      // Get the return URL from route parameters or default to '/home'
      const returnUrl =
        this.activatedRoute.snapshot.queryParams['returnUrl'] || '/home';

      // Show success message
      this.showToast('Login berhasil', 'success');

      // Navigate to the return URL or home
      this.ngZone.run(() => {
        this.router.navigateByUrl(returnUrl, { replaceUrl: true });
      });
    } catch (error: any) {
      console.error('Login error:', error);
      this.errorMessage = this.getErrorMessage(error);
      this.showToast(this.errorMessage, 'danger');
    } finally {
      this.isLoading = false;

      // Safely dismiss loading if it exists
      if (loading) {
        try {
          await loading.dismiss();
        } catch (e) {
          console.warn('Error dismissing loading:', e);
        }
      }
    }
  }

  async signInWithGoogle() {
    const loading = await this.loadingCtrl.create({
      message: 'Signing in with Google...',
    });
    await loading.present();

    try {
      const result = await this.authService.signInWithGoogle();
      if (result.success) {
        this.showToast('Login Google berhasil', 'success');
        this.router.navigate(['/home']);
      } else {
        this.showToast(result.message || 'Gagal masuk dengan Google', 'danger');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      this.showToast(this.getErrorMessage(error), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async onForgotPassword() {
    const alert = await this.alertCtrl.create({
      header: 'Reset Password',
      message: 'Masukkan email Anda untuk menerima link reset password',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email',
          attributes: { required: true },
        },
      ],
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Kirim Link',
          handler: async (data) => {
            if (!data.email) {
              this.showToast('Email wajib diisi', 'danger');
              return false;
            }
            const loading = await this.loadingCtrl.create({
              message: 'Mengirim link reset...',
            });
            await loading.present();
            try {
              await this.authService.forgotPassword(data.email);
              this.showToast('Link reset dikirim ke email Anda', 'success');
              return true;
            } catch (error) {
              this.showToast(this.getErrorMessage(error), 'danger');
              return false;
            } finally {
              await loading.dismiss();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
