import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailComposer } from '@awesome-cordova-plugins/email-composer/ngx';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonLabel,
} from '@ionic/angular/standalone';
import { AlertController, Platform } from '@ionic/angular/standalone';
// Icons are now automatically available in Ionic 6+

interface FaqItem {
  question: string;
  answer: string;
  expanded: boolean;
}

@Component({
  selector: 'app-help-support',
  templateUrl: './help-support.page.html',
  styleUrls: ['./help-support.page.scss'],
  standalone: true,
  providers: [EmailComposer],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonLabel,
  ],
})
export class HelpSupportPage {
  // Inject services
  private alertCtrl = inject(AlertController);
  private platform = inject(Platform);
  faqs: FaqItem[] = [
    {
      question: 'Bagaimana cara mengubah profil saya?',
      answer:
        'Anda dapat mengubah profil dengan menekan tombol edit di bagian atas halaman profil.',
      expanded: false,
    },
    {
      question: 'Bagaimana cara mengubah bahasa?',
      answer:
        'Pergi ke Pengaturan > Bahasa, lalu pilih bahasa yang diinginkan.',
      expanded: false,
    },
    {
      question: 'Apa yang harus dilakukan jika lupa kata sandi?',
      answer:
        'Anda dapat mengatur ulang kata sandi melalui halaman login dengan menekan "Lupa Kata Sandi?".',
      expanded: false,
    },
    {
      question: 'Bagaimana cara menghubungi dukungan?',
      answer:
        'Anda dapat menghubungi tim dukungan kami melalui email di support@edubox.id',
      expanded: false,
    },
    {
      question: 'Bagaimana cara melaporkan masalah teknis?',
      answer:
        'Anda dapat melaporkan masalah teknis melalui menu Bantuan > Laporkan Masalah atau langsung mengirim email ke support@edubox.id',
      expanded: false,
    },
  ];

  // Inject services
  private emailComposer = inject(EmailComposer);
  private alertController = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);
  private location = inject(Location);

  toggleFaq(index: number, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    // Toggle the clicked FAQ and close others
    this.faqs = this.faqs.map((faq, i) => ({
      ...faq,
      expanded: i === index ? !faq.expanded : false,
    }));

    // Trigger change detection
    this.cdr.detectChanges();
  }

  goBack() {
    this.location.back();
  }

  async contactSupport() {
    const alert = await this.alertController.create({
      header: 'Hubungi Dukungan',
      message:
        'Anda akan diarahkan ke aplikasi email untuk mengirim pesan ke tim dukungan kami.',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
        },
        {
          text: 'Buka Email',
          handler: () => {
            this.openEmailComposer();
          },
        },
      ],
    });

    await alert.present();
  }

  private async openEmailComposer() {
    if (this.platform.is('cordova')) {
      const email = {
        to: 'support@edubox.id',
        subject: 'Permintaan Bantuan - EduBox',
        body: 'Halo Tim EduBox,<br><br>Saya membutuhkan bantuan mengenai:',
        isHtml: true,
      };

      try {
        await this.emailComposer.open(email);
      } catch (error) {
        console.error('Error opening email composer:', error);
        this.showEmailError();
      }
    } else {
      // Fallback for web
      window.location.href = `mailto:support@edubox.id?subject=Permintaan Bantuan - EduBox&body=Halo Tim EduBox,%0D%0A%0D%0ASaya membutuhkan bantuan mengenai:`;
    }
  }

  private async showEmailError() {
    const alert = await this.alertController.create({
      header: 'Tidak Dapat Membuka Email',
      message: 'Silakan hubungi support@edubox.id secara manual.',
      buttons: ['OK'],
    });
    await alert.present();
  }
}
