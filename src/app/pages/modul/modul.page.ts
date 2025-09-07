import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  NavController, 
  ToastController, 
  AlertController, 
  IonicModule 
} from '@ionic/angular';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

interface LearningPath {
  id: string;
  icon: string;
  title: string;
  desc: string;
  progress: number;
}

interface Module {
  id: string;
  category: string;
  icon: string;
  title: string;
  duration: string;
  exercises: string;
  rating: number;
  status: 'Selesai' | 'Berlangsung' | 'Terkunci' | 'Tersedia';
  desc: string;
  tags: string[];
}

@Component({
  selector: 'app-modul',
  templateUrl: './modul.page.html',
  styleUrls: ['./modul.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BottomNavComponent
  ]
})
export class ModulPage {

  activeFilter: string = 'all';
  searchTerm: string = '';
  
  filters = [
    { label: 'Semua', value: 'all', icon: '🌟' },
    { label: 'Arduino', value: 'arduino', icon: '🔧' },
    { label: 'AI/ML', value: 'ai', icon: '🤖' },
    { label: 'Web', value: 'web', icon: '🌐' },
    { label: 'Python', value: 'python', icon: '🐍' },
    { label: 'JavaScript', value: 'javascript', icon: '⚡' },
  ];

  progressStats = [
    { label: 'Modul Selesai', value: 24 },
    { label: 'Sedang Belajar', value: 8 },
    { label: 'XP Earned', value: 156 },
  ];

  learningPaths: LearningPath[] = [
    { id: 'arduino-basics', icon: '🔧', title: 'Arduino Basics', desc: 'Pelajari dasar-dasar pemrograman Arduino', progress: 75 },
    { id: 'led-matrix', icon: '🎮', title: 'LED Matrix', desc: 'Simulasi dan kontrol LED matrix', progress: 45 },
    { id: 'ai-fundamentals', icon: '🤖', title: 'AI Fundamentals', desc: 'Konsep dasar Artificial Intelligence', progress: 20 },
    { id: 'web-development', icon: '🌐', title: 'Web Development', desc: 'HTML, CSS, JavaScript modern', progress: 60 },
  ];

  allModules: Module[] = [
    { id: 'arduino-intro', category: 'arduino', icon: '🔧', title: 'Pengenalan Arduino', duration: '45 menit', exercises: '12 latihan', rating: 4.8, status: 'Selesai', desc: 'Pelajari dasar-dasar Arduino, dari instalasi IDE hingga program pertama Anda.', tags: ['Beginner', 'Hardware', 'C++'] },
    { id: 'led-control', category: 'arduino', icon: '💡', title: 'Kontrol LED & PWM', duration: '60 menit', exercises: '15 latihan', rating: 4.9, status: 'Berlangsung', desc: 'Menguasai teknik kontrol LED, dari blinking sederhana hingga PWM.', tags: ['Intermediate', 'PWM', 'LED'] },
    { id: 'matrix-programming', category: 'arduino', icon: '🎮', title: 'LED Matrix Programming', duration: '90 menit', exercises: '20 latihan', rating: 4.7, status: 'Terkunci', desc: 'Belajar memprogram LED matrix untuk menampilkan teks, gambar, dan animasi.', tags: ['Advanced', 'Animation', 'FastLED'] },
    { id: 'ai-basics', category: 'ai', icon: '🤖', title: 'AI & Machine Learning Basics', duration: '120 menit', exercises: '25 latihan', rating: 4.6, status: 'Tersedia', desc: 'Pengenalan konsep Artificial Intelligence dan Machine Learning.', tags: ['Beginner', 'Theory', 'Python'] },
    { id: 'web-basics', category: 'web', icon: '🌐', title: 'HTML & CSS Fundamentals', duration: '80 menit', exercises: '18 latihan', rating: 4.8, status: 'Selesai', desc: 'Membangun fondasi web development dengan HTML5 dan CSS3.', tags: ['Beginner', 'Frontend', 'Responsive'] },
    { id: 'javascript-intro', category: 'javascript', icon: '⚡', title: 'JavaScript Programming', duration: '100 menit', exercises: '22 latihan', rating: 4.9, status: 'Berlangsung', desc: 'Menguasai JavaScript dari dasar hingga konsep advanced.', tags: ['Intermediate', 'ES6+', 'Interactive'] },
    { id: 'python-basics', category: 'python', icon: '🐍', title: 'Python Programming', duration: '75 menit', exercises: '16 latihan', rating: 4.7, status: 'Tersedia', desc: 'Memulai perjalanan programming dengan Python.', tags: ['Beginner', 'Syntax', 'OOP'] },
  ];

  filteredModules: Module[] = [];

  // Inject services
  private navCtrl = inject(NavController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  constructor() {
    this.filteredModules = [...this.allModules];
  }

  goBack() {
    this.navCtrl.back();
  }

  setActiveFilter(filterValue: string) {
    this.activeFilter = filterValue;
    this.filterModules();
  }

  filterModules() {
    let tempModules = [...this.allModules];

    // Filter by category
    if (this.activeFilter !== 'all') {
      tempModules = tempModules.filter(m => m.category === this.activeFilter);
    }

    // Filter by search term
    if (this.searchTerm.trim() !== '') {
      const query = this.searchTerm.toLowerCase();
      tempModules = tempModules.filter(m => 
        m.title.toLowerCase().includes(query) ||
        m.desc.toLowerCase().includes(query) ||
        m.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    this.filteredModules = tempModules;
  }

  async openPath(path: LearningPath) {
    const alert = await this.alertCtrl.create({
      header: `🛤️ ${path.title}`,
      message: `Anda akan diarahkan ke serangkaian modul yang tersusun secara sistematis untuk menguasai ${path.title}.`,
      buttons: ['Mulai Belajar'],
    });
    await alert.present();
  }
  
  async openModule(module: Module) {
    const alert = await this.alertCtrl.create({
      header: `📚 ${module.title}`,
      message: 'Anda akan mulai belajar dengan materi interaktif, latihan praktis, dan quiz untuk mengukur pemahaman.',
      buttons: ['Lanjutkan'],
    });
    await alert.present();
  }

  async openAIHelper() {
    const alert = await this.alertCtrl.create({
      header: '🤖 AI Assistant EduVox',
      message: 'Halo! Saya siap membantu Anda dengan penjelasan konsep, rekomendasi belajar, atau bantuan coding. Ada yang bisa saya bantu?',
      buttons: ['Tutup'],
    });
    await alert.present();
  }
  
  async showRandomAchievement() {
    const achievements = [
      '🏆 Achievement Unlocked: "Quick Learner"!',
      '🌟 Achievement Unlocked: "Code Master"!',
      '🚀 Achievement Unlocked: "Problem Solver"!',
      '💡 Achievement Unlocked: "Creative Thinker"!',
      '🎯 Achievement Unlocked: "Goal Achiever"!'
    ];
    
    setTimeout(async () => {
      const toast = await this.toastCtrl.create({
        message: achievements[Math.floor(Math.random() * achievements.length)],
        duration: 3000,
        position: 'top',
        color: 'success',
        cssClass: 'achievement-toast'
      });
      await toast.present();
    }, 2000);
  }
}