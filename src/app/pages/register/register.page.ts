import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonIcon,
  IonNote,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonSpinner,
  IonImg,
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService, AuthResponse } from '../../services/auth.service';
import { getAuth, sendEmailVerification } from 'firebase/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonIcon,
    IonNote,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonSpinner,
    IonImg,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  isGoogleLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  passwordStrengthText = '';
  termsAccepted = false;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    public router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.initializeForm();
  }

  private initializeForm() {
    this.registerForm = this.fb.group(
      {
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            this.noWhitespaceValidator(),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            this.passwordStrengthValidator(),
          ],
        ],
        confirmPassword: ['', Validators.required],
        terms: [false, [Validators.required, Validators.requiredTrue]],
      },
      {
        validators: [this.passwordMatchValidator()],
      }
    );
  }

  ngOnInit() {
    // Subscribe to password changes to update strength meter
    this.registerForm
      .get('password')
      ?.valueChanges.subscribe((value: string) => {
        this.calculatePasswordStrength(value);
      });
  }

  // Handle terms checkbox change
  onTermsChange(event: any) {
    this.registerForm.get('terms')?.setValue(event.detail.checked);
  }

  get name(): AbstractControl | null {
    return this.registerForm.get('name');
  }

  get email(): AbstractControl | null {
    return this.registerForm.get('email');
  }

  get password(): AbstractControl | null {
    return this.registerForm.get('password');
  }

  get termsControl(): FormControl {
    return this.registerForm.get('terms') as FormControl;
  }

  get confirmPassword(): AbstractControl | null {
    return this.registerForm.get('confirmPassword');
  }

  async onRegister() {
    if (this.registerForm.valid) {
      const { name, email, password } = this.registerForm.value;
      const loading = await this.loadingController.create({
        message: 'Mendaftarkan akun...',
        spinner: 'crescent',
      });

      try {
        await loading.present();
        this.isLoading = true;

        // Sign up with email and password
        await this.authService.signUp(email, password, name);

        // Send email verification
        const auth = getAuth();
        if (auth.currentUser) {
          await sendEmailVerification(auth.currentUser);
        }

        // Show success message
        const toast = await this.toastController.create({
          message:
            'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.',
          duration: 5000,
          color: 'success',
          buttons: [
            {
              icon: 'close',
              role: 'cancel',
            },
          ],
        });

        await toast.present();
        this.router.navigate(['/home']);
      } catch (error: any) {
        console.error('Registration error:', error);
        const alert = await this.alertController.create({
          header: 'Registrasi Gagal',
          message: this.getErrorMessage(error),
          buttons: [
            {
              text: 'Mengerti',
              role: 'cancel',
            },
          ],
          cssClass: 'error-alert',
        });

        await alert.present();
      } finally {
        if (loading) {
          await loading.dismiss();
        }
        this.isLoading = false;
      }
    } else {
      // Mark all fields as touched to show validation messages
      Object.keys(this.registerForm.controls).forEach((field) => {
        const control = this.registerForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
    }
  }

  getPasswordStrengthClass(): string {
    if (this.passwordStrength < 50) return 'strength-weak';
    if (this.passwordStrength < 80) return 'strength-medium';
    return 'strength-strong';
  }

  // Calculate password strength
  private calculatePasswordStrength(password: string) {
    let strength = 0;

    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthText = '';
      return;
    }

    // Length check
    if (password.length >= 8) strength += 1;

    // Contains numbers
    if (/\d/.test(password)) strength += 1;

    // Contains letters
    if (/[a-zA-Z]/.test(password)) strength += 1;

    // Contains special characters
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    // Set strength text and value
    switch (strength) {
      case 1:
        this.passwordStrengthText = 'Lemah';
        this.passwordStrength = 33;
        break;
      case 2:
        this.passwordStrengthText = 'Sedang';
        this.passwordStrength = 66;
        break;
      case 3:
      case 4:
        this.passwordStrengthText = 'Kuat';
        this.passwordStrength = 100;
        break;
      default:
        this.passwordStrengthText = '';
        this.passwordStrength = 0;
    }

    // Update the form control's validity
    const control = this.registerForm.get('password');
    if (control) {
      control.updateValueAndValidity();
    }
  }

  // Helper method to get error message for form controls
  getError(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Field ini harus diisi';
    } else if (control?.hasError('email')) {
      return 'Format email tidak valid';
    } else if (control?.hasError('minlength')) {
      return `Minimal ${control.errors?.['minlength'].requiredLength} karakter`;
    } else if (control?.hasError('whitespace')) {
      return 'Tidak boleh hanya berisi spasi';
    } else if (control?.hasError('passwordMismatch')) {
      return 'Password tidak cocok';
    }
    return '';
  }

  // Custom validators
  private noWhitespaceValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const isWhitespace = (control.value || '').trim().length === 0;
      return !isWhitespace ? null : { whitespace: true };
    };
  }

  private passwordMatchValidator(): ValidatorFn {
    return (formGroup: AbstractControl): { [key: string]: any } | null => {
      const password = formGroup.get('password');
      const confirmPassword = formGroup.get('confirmPassword');

      if (!password || !confirmPassword) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        confirmPassword.setErrors(null);
        return null;
      }
    };
  }

  private getErrorMessage(error: any): string {
    if (!error || !error.code) {
      return 'Terjadi kesalahan. Silakan coba lagi nanti.';
    }

    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'Email sudah digunakan. Silakan gunakan email lain.';
      case 'auth/invalid-email':
        return 'Format email tidak valid.';
      case 'auth/operation-not-allowed':
        return 'Operasi tidak diizinkan. Hubungi dukungan.';
      case 'auth/weak-password':
        return 'Password terlalu lemah. Gunakan minimal 6 karakter dengan kombinasi huruf dan angka.';
      case 'auth/network-request-failed':
        return 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda.';
      case 'auth/too-many-requests':
        return 'Terlalu banyak permintaan. Silakan coba lagi nanti.';
      default:
        return 'Terjadi kesalahan. Silakan coba lagi nanti.';
    }
  }

  private passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value || '';
      if (!value) return null;

      const hasNumber = /\d/.test(value);
      const hasLetter = /[a-zA-Z]/.test(value);

      const valid = value.length >= 8 && hasNumber && hasLetter;
      return valid ? null : { weakPassword: true };
    };
  }

  // Toggle password visibility
  togglePassword(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // Handle password input and update strength meter
  onPasswordInput(event: any) {
    const input = event.target as HTMLInputElement;
    const value = input.value || '';
    this.calculatePasswordStrength(value);
    // Update the form control value without triggering additional events
    const control = this.registerForm.get('password');
    if (control) {
      control.setValue(value, { emitEvent: false, onlySelf: true });
      control.updateValueAndValidity();
    }
  }

  // Handle confirm password input
  onConfirmPasswordInput(event: any) {
    const input = event.target as HTMLInputElement;
    const value = input.value || '';
    // Update the form control value without triggering additional events
    const control = this.registerForm.get('confirmPassword');
    if (control) {
      control.setValue(value, { emitEvent: false, onlySelf: true });
      control.updateValueAndValidity();
    }
  }

  // Open terms and conditions dialog
  async openTerms() {
    const alert = await this.alertController.create({
      header: 'Syarat dan Ketentuan',
      message: 'Dengan menggunakan layanan ini, Anda menyetujui syarat dan ketentuan yang berlaku.',
      buttons: ['Mengerti']
    });
    await alert.present();
  }

  // Open privacy policy dialog
  async openPrivacyPolicy() {
    const alert = await this.alertController.create({
      header: 'Kebijakan Privasi',
      message: 'Kami menghargai privasi Anda. Data pribadi Anda akan dilindungi sesuai dengan kebijakan privasi kami.',
      buttons: ['Mengerti']
    });
    await alert.present();
  }

  // Handle Google sign in
  async signInWithGoogle() {
    if (this.isGoogleLoading) return;
    
    this.isGoogleLoading = true;
    const loading = await this.loadingController.create({
      message: 'Sedang masuk dengan Google...',
      spinner: 'crescent',
    });

    try {
      await loading.present();
      const result = await this.authService.signInWithGoogle();
      
      if (result?.success) {
        this.router.navigate(['/home']);
      } else {
        await this.showError(result?.message || 'Gagal masuk dengan Google');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      await this.showError('Terjadi kesalahan saat mencoba masuk dengan Google');
    } finally {
      this.isGoogleLoading = false;
      await loading.dismiss();
    }
  }

  // Show error message
  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

}
