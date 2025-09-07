import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  Renderer2,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Firebase services are provided at the app module level

// Components
import { BottomNavComponent } from '../shared/components/bottom-nav/bottom-nav.component';

// Services
import { AuthService } from '../services/auth.service';
import { NewsService } from '../services/news.service';

interface CarouselItem {
  icon: string;
  title: string;
  description: string;
  link: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  providers: [NewsService],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BottomNavComponent,
    // Add any other components/directives/pipes used in the template
  ],
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('carousel', { static: true })
  carouselRef!: ElementRef<HTMLDivElement>;
  @ViewChild('content', { static: true }) content!: ElementRef;

  showNotifications = false;
  currentSlide = 0;
  isScrolling = false;
  isNotificationsOn = true;
  isLoaded = false;
  debugMode: boolean = true; // Set to false in production
  userName: string = 'Pengguna';
  userInitials: string = 'P';
  userPhotoUrl: string | null = null;
  userRole: string = 'Student';
  userLevel: number = 1;
  showInitials: boolean = true; // Controls whether to show initials or profile picture

  // News items with proper type (read-only)
  newsItems: Array<{
    icon: string;
    title: string;
    description: string;
    time: string;
  }> = [];

  isLoadingNews = false;
  newsError: string | null = null;

  // Subscriptions
  private authSub: Subscription | undefined;
  private userSubscription: Subscription | undefined;

  // Navigation is now handled by BottomNavComponent

  // Features data
  features = [
    {
      icon: '🎮',
      title: '3D Workspace',
      description: 'LED Matrix Simulator',
      link: '/workspace',
      gradient: ['#4facfe', '#00f2fe'],
    },
    {
      icon: '💻',
      title: 'Manual Coding',
      description: 'Code Editor',
      link: '/coding',
      gradient: ['#f6d365', '#fda085'],
    },
    {
      icon: '📖',
      title: 'Modul Belajar',
      description: 'Materi & Tutorial',
      link: '/modul',
      gradient: ['#a18cd1', '#fbc2eb'],
    },
    {
      icon: '🏆',
      title: 'Leaderboard',
      description: 'Ranking & Pencapaian',
      link: '/leaderboard',
      gradient: ['#4facfe', '#00f2fe'],
    },
  ];

  // Forum threads
  forumThreads = [
    {
      id: 1,
      userInitials: 'JD',
      userName: 'John Doe',
      timeAgo: '5 menit lalu',
      title: 'Cara menggunakan simulator LED Matrix?',
      preview:
        'Ada yang bisa bantu menjelaskan cara menggunakan simulator LED Matrix untuk pemula?',
      likes: 5,
      replies: 3,
      avatarGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      id: 2,
      userInitials: 'AS',
      userName: 'Andi S',
      timeAgo: '1 jam lalu',
      title: 'Tips belajar pemrograman',
      preview:
        'Bagaimana cara terbaik untuk mulai belajar pemrograman dari nol?',
      likes: 12,
      replies: 8,
      avatarGradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    },
  ];

  private touchStartX: number | null = null;
  private touchEndX: number | null = null;
  private isLowEndDevice = false;
  private isAutoScrolling = false;
  private scrollInterval: ReturnType<typeof setInterval> | null = null;
  private readonly SWIPE_THRESHOLD = 50; // Minimum distance for swipe
  private processCount = 0;
  private readonly MAX_PROCESSING = 3; // Process exactly 3 times

  // Injected services
  private newsSubscription: Subscription | null = null;
  private readonly newsService: NewsService;
  private readonly cdr: ChangeDetectorRef;
  private readonly authService: AuthService;
  private readonly renderer: Renderer2;
  private readonly router: Router;
  private readonly el: ElementRef;
  private readonly alertController: AlertController;

  constructor(
    newsService: NewsService,
    cdr: ChangeDetectorRef,
    authService: AuthService,
    renderer: Renderer2,
    router: Router,
    el: ElementRef,
    alertController: AlertController
  ) {
    this.newsService = newsService;
    this.cdr = cdr;
    this.authService = authService;
    this.renderer = renderer;
    this.router = router;
    this.el = el;
    this.alertController = alertController;
    this.isLowEndDevice = this.checkLowEndDevice();
  }

  /**
   * Format a date to a relative time string (e.g., '2 hours ago')
   * @param date The date to format
   * @returns Formatted time string
   */
  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = {
      tahun: 31536000,
      bulan: 2592000,
      minggu: 604800,
      hari: 86400,
      jam: 3600,
      menit: 60,
      detik: 1,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return interval === 1
          ? `1 ${unit} yang lalu`
          : `${interval} ${unit} yang lalu`;
      }
    }

    return 'Baru saja';
  }

  carouselItems: CarouselItem[] = [
    {
      icon: '🎉',
      title: 'Promo Spesial',
      description:
        'Nikmati akses premium 3 bulan dengan diskon 50% untuk semua fitur pembelajaran.',
      link: '/promo',
    },
    {
      icon: '🚀',
      title: 'Fitur Baru',
      description:
        'LED Matrix Simulator + AI Assistant hadir untuk pengalaman belajar interaktif.',
      link: '/features',
    },
    {
      icon: '📚',
      title: 'Kursus Gratis',
      description:
        'Belajar dasar pemrograman dengan mentor berpengalaman, cocok untuk pemula.',
      link: '/courses',
    },
  ];

  onImageLoad() {
    // Image loaded successfully
    if (this.debugMode) {
      console.log('Profile image loaded successfully');
    }
  }

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    const originalSrc = imgElement.src;

    // Don't retry if we're already showing initials
    if (this.showInitials) {
      return;
    }

    // Process the photo exactly 3 times
    if (this.processCount < this.MAX_PROCESSING) {
      this.processCount++;
      console.log(
        `[Profile] Processing profile photo ${this.processCount} of ${this.MAX_PROCESSING}`
      );

      if (originalSrc.includes('googleusercontent.com')) {
        // For Google profile pictures, try different URL formats
        try {
          const url = new URL(originalSrc);
          const baseUrl = `${url.origin}${url.pathname}`.replace(/=[^/]*$/, '');

          // Try different size parameters in each retry
          const sizes = ['s500-c', 's400-c', 's300-c', 's200-c', 's100-c'];
          const size =
            this.processCount <= sizes.length
              ? sizes[this.processCount - 1]
              : 's200-c';

          // Reconstruct the URL with the new size and cache buster
          const newUrl = `${baseUrl}=${size}&t=${Date.now()}`;
          console.log(`[Profile] Trying new URL: ${newUrl}`);
          imgElement.src = newUrl;
        } catch (e) {
          console.error('[Profile] Error processing Google profile URL:', e);
          this.fallbackToInitials();
        }
      } else {
        // For non-Google URLs, add a cache buster
        try {
          const separator = originalSrc.includes('?') ? '&' : '?';
          const newUrl = `${
            originalSrc.split('?')[0]
          }${separator}t=${Date.now()}`;
          console.log(`[Profile] Trying with cache buster: ${newUrl}`);
          imgElement.src = newUrl;
        } catch (e) {
          console.error('[Profile] Error adding cache buster:', e);
          this.fallbackToInitials();
        }
      }
      return;
    }

    // After 3 processing attempts, try to get the photo URL directly from Firebase Auth
    if (this.authService.currentUser?.photoURL) {
      console.log('[Profile] Trying to get fresh photo URL from auth service');
      const freshUrl = this.processGooglePhotoUrl(
        this.authService.currentUser.photoURL
      );
      if (freshUrl !== this.userPhotoUrl) {
        this.userPhotoUrl = freshUrl;
        this.showInitials = false;
        this.processCount = 0;
        this.cdr.detectChanges();
        return;
      }
    }

    // If all else fails, show initials
    this.fallbackToInitials();
  }

  ngOnInit(): void {
    this.startCarousel();
    this.subscribeToUserChanges();
    this.loadNews();
  }

  private processGooglePhotoUrl(
    photoURL: string | null | undefined
  ): string | null {
    if (!photoURL) {
      return null;
    }

    try {
      // If it's a Google profile picture URL, modify it to get a higher resolution
      if (photoURL.includes('googleusercontent.com')) {
        // Handle Google profile picture URL
        const url = new URL(photoURL);

        // Ensure we're using HTTPS
        url.protocol = 'https:';

        // Extract the base path (everything before any size parameters)
        const basePath = url.pathname.split('=')[0];

        // Use the standard size format with circle mask (s96-c-mo)
        const finalUrl = `${basePath}=s96-c-mo`;

        // Return the clean URL with a cache buster
        return `${url.origin}${finalUrl}`;
      }

      // For other URLs, ensure HTTPS and add cache buster
      try {
        const url = new URL(photoURL);
        if (url.protocol === 'http:') {
          url.protocol = 'https:';
        }

        // Clean up any existing cache busters
        url.searchParams.delete('t');

        // Add new cache buster
        url.searchParams.set('t', Date.now().toString());
        return url.toString();
      } catch (e) {
        console.warn('Error processing non-Google URL:', e);
        return photoURL;
      }
    } catch (e) {
      console.warn('Error processing photo URL:', e);
      return photoURL;
    }
  }

  private loadProfileImage(photoURL: string, processCount = 0): void {
    if (processCount > this.MAX_PROCESSING) {
      console.warn(
        `Max processing attempts (${this.MAX_PROCESSING}) reached for loading profile image`
      );
      this.userPhotoUrl = null;
      this.showInitials = true;
      this.cdr.detectChanges();
      return;
    }

    console.log(
      `Attempting to load profile image (attempt ${processCount + 1} of ${
        this.MAX_PROCESSING
      })`
    );

    // Process the URL first
    const processedUrl = this.processGooglePhotoUrl(photoURL);
    if (!processedUrl) {
      console.warn('Failed to process photo URL');
      this.userPhotoUrl = null;
      this.showInitials = true;
      this.cdr.detectChanges();
      return;
    }

    // For Google Photos, we can directly use the URL without CORS fetch
    if (photoURL.includes('googleusercontent.com')) {
      console.log('Using direct image URL for Google profile photo');
      this.userPhotoUrl = processedUrl;
      this.showInitials = false;
      this.processCount = 0;
      this.cdr.detectChanges();
      return;
    }

    // For other URLs, try to fetch with CORS
    fetch(processedUrl, { mode: 'cors', cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('Profile image loaded successfully');
          this.userPhotoUrl = reader.result as string;
          this.showInitials = false;
          this.processCount = 0;
          this.cdr.detectChanges();
        };
        reader.onerror = () => {
          throw new Error('Failed to read image data');
        };
        reader.readAsDataURL(blob);
      })
      .catch((error) => {
        console.warn(
          `Failed to load profile image (attempt ${processCount + 1} of ${
            this.MAX_PROCESSING
          }):`,
          error
        );
        // Fallback to direct image loading if fetch fails
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          console.log('Profile image loaded via fallback');
          this.userPhotoUrl = processedUrl;
          this.showInitials = false;
          this.processCount = 0;
          this.cdr.detectChanges();
        };
        img.onerror = () => {
          console.warn(
            `Fallback image loading failed (attempt ${processCount + 1} of ${
              this.MAX_PROCESSING
            })`
          );
          // Retry with exponential backoff
          if (processCount < this.MAX_PROCESSING) {
            setTimeout(() => {
              this.loadProfileImage(photoURL, processCount + 1);
            }, Math.min(1000 * Math.pow(2, processCount), 10000));
          } else {
            this.userPhotoUrl = null;
            this.showInitials = true;
            this.cdr.detectChanges();
          }
        };
        img.src = processedUrl;
      });
  }

  private subscribeToUserChanges(): void {
    this.userSubscription = this.authService.user$.subscribe({
      next: (user) => {
        if (user) {
          this.userName = user.displayName || 'Pengguna';
          this.userInitials = this.userName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
          this.userRole = user.role || 'Student';
          this.userLevel = user.level || 1;

          // Process and set the photo URL
          if (user.photoURL) {
            // Reset retry count when we get a new photo URL
            this.processCount = 0;
            this.showInitials = false;

            // Process the photo URL to ensure it's valid
            const processedUrl = this.processGooglePhotoUrl(user.photoURL);

            // Only update if the URL has changed to avoid infinite loops
            if (this.userPhotoUrl !== processedUrl) {
              this.userPhotoUrl = processedUrl;
              // Force change detection
              this.cdr.detectChanges();
            }
          } else {
            this.userPhotoUrl = null;
            this.showInitials = true;
          }

          // Generate initials from display name or email
          const nameToUse =
            user.displayName || user.email?.split('@')[0] || 'P';
          const nameParts = nameToUse.trim().split(' ');
          this.userInitials =
            nameParts.length > 1
              ? (
                  nameParts[0].charAt(0) +
                  nameParts[nameParts.length - 1].charAt(0)
                ).toUpperCase()
              : nameToUse.charAt(0).toUpperCase();

          // Force UI update
          this.cdr.detectChanges();
        } else {
          this.handleNoUser();
        }
      },
      error: (error) => {
        console.error('Error in user subscription:', error);
        this.handleNoUser();
      },
    });
  }

  private handleNoUser(): void {
    this.userName = 'Pengguna';
    this.userInitials = 'P';
    this.userPhotoUrl = null;
    this.showInitials = true;
    this.processCount = 0;
    this.cdr.detectChanges();
  }

  private fallbackToInitials(): void {
    console.log('[Profile] Falling back to initials');
    this.showInitials = true;
    this.userPhotoUrl = null;
    this.processCount = 0;
    this.cdr.detectChanges();
  }

  /**
   * Create ripple effect on button click
   */
  createRipple(event: MouseEvent): void {
    if (!event || !event.currentTarget) return;

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - rect.left - radius}px`;
    ripple.style.top = `${event.clientY - rect.top - radius}px`;

    // Add ripple to button
    button.appendChild(ripple);

    // Remove ripple after animation completes
    const removeRipple = () => {
      ripple.remove();
      ripple.removeEventListener('animationend', removeRipple);
    };

    ripple.addEventListener('animationend', removeRipple);
  }

  /**
   * Load news from the NewsService
   */
  loadNews(): void {
    try {
      this.isLoadingNews = true;
      this.newsError = null;

      // Clean up previous subscription if it exists
      if (this.newsSubscription) {
        this.newsSubscription.unsubscribe();
      }

      this.newsSubscription = this.newsService.getNews().subscribe({
        next: (newsItems) => {
          try {
            this.newsItems = (newsItems || []).map((item) => ({
              icon: '📰',
              title: item?.title || 'Judul Tidak Tersedia',
              description: item?.content || '',
              time: this.formatTimeAgo(
                item?.publishedAt?.toDate
                  ? item.publishedAt.toDate()
                  : item?.publishedAt || new Date()
              ),
            }));
          } catch (mappingError) {
            console.error('Error mapping news items:', mappingError);
            this.newsError = 'Gagal memproses data berita.';
          }
          this.isLoadingNews = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading news:', error);
          this.newsError = 'Gagal memuat berita. Silakan coba lagi nanti.';
          this.isLoadingNews = false;
          this.cdr.detectChanges();
        },
      });
    } catch (error) {
      console.error('Unexpected error in loadNews:', error);
      this.newsError = 'Terjadi kesalahan tak terduga.';
      this.isLoadingNews = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Clean up resources when component is destroyed
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.newsSubscription) {
      this.newsSubscription.unsubscribe();
    }

    // Clean up any intervals
    this.stopCarousel();
  }

  /**
   * Start auto-scrolling the carousel
   */
  public startCarousel(): void {
    if (this.isLowEndDevice) return;

    // Clear any existing interval
    this.stopCarousel();

    // Set up new interval
    this.scrollInterval = setInterval(() => {
      if (!this.isScrolling) {
        this.nextSlide();
      }
    }, 3000);

    this.isAutoScrolling = true;
  }

  /**
   * Next slide with smooth transition
   */
  public nextSlide(): void {
    if (this.isScrolling) return;

    this.isScrolling = true;
    const nextSlideIndex = (this.currentSlide + 1) % this.carouselItems.length;
    this.animateSlideTransition(this.currentSlide, nextSlideIndex);
    this.currentSlide = nextSlideIndex;

    // Update active state
    this.updateActiveState();

    // Reset scroll position if at the end for infinite loop effect
    if (this.currentSlide === this.carouselItems.length - 1) {
      setTimeout(() => {
        if (this.carouselRef?.nativeElement) {
          this.carouselRef.nativeElement.scrollTo({
            left: 0,
            behavior: 'smooth',
          });
        }
      }, 500);
    }
  }

  /**
   * Animate slide transition
   */
  private animateSlideTransition(current: number, next: number): void {
    if (!this.carouselRef) return;

    const carousel = this.carouselRef.nativeElement;
    const itemWidth = carousel.offsetWidth * 0.85; // 85% of carousel width
    const scrollPosition = next * (itemWidth + 16); // 16px gap

    carousel.scrollTo({
      left: scrollPosition,
      behavior: 'smooth',
    });

    // Reset scrolling state after transition
    setTimeout(() => {
      this.isScrolling = false;
    }, 500);
  }

  /**
   * Update active state of carousel items
   */
  private updateActiveState(): void {
    if (!this.carouselRef?.nativeElement) return;

    const items =
      this.carouselRef.nativeElement.querySelectorAll('.carousel-item');
    items.forEach((item, index) => {
      const element = item as HTMLElement;
      if (index === this.currentSlide) {
        element.classList.add('active');
      } else {
        element.classList.remove('active');
      }
    });
  }

  /**
   * Update carousel position
   */
  updateCarousel() {
    if (!this.carouselRef) return;

    const carousel = this.carouselRef.nativeElement;
    const itemWidth = carousel.offsetWidth * 0.85; // 85% of carousel width
    const scrollPosition = this.currentSlide * (itemWidth + 16); // 16px gap

    carousel.scrollTo({
      left: scrollPosition,
      behavior: 'smooth',
    });

    // Update active state
    this.updateActiveState();

    // Reset scrolling state after transition
    setTimeout(() => {
      this.isScrolling = false;
    }, 500);
  }

  /**
   * Previous slide
   */
  prevSlide(): void {
    if (this.isScrolling) return;

    this.currentSlide =
      (this.currentSlide - 1 + this.carouselItems.length) %
      this.carouselItems.length;
    this.animateSlideTransition(this.currentSlide, this.currentSlide - 1);
    this.resetAutoScroll();
  }

  /**
   * Go to slide with smooth scrolling
   */
  goToSlide(index: number): void {
    if (this.isScrolling || index < 0 || index >= this.carouselItems.length) {
      return;
    }

    this.currentSlide = index;

    // Update carousel position with smooth scroll
    const carousel = this.carouselRef.nativeElement;
    const slideElement = carousel.querySelector('.carousel-item');

    if (slideElement) {
      const slideWidth = slideElement.clientWidth;
      const scrollPosition = index * (slideWidth + 15); // 15px gap between items

      carousel.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
    }

    this.resetAutoScroll();
  }

  /**
   * Reset auto scroll
   */
  resetAutoScroll() {
    this.stopCarousel();
    this.startCarousel();
  }

  /**
   * Stop carousel auto-scroll
   */
  stopCarousel() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
    this.isAutoScrolling = false;
    this.isScrolling = false;
  }

  /**
   * On touch start
   */
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchEndX = 0;
    this.stopCarousel();
  }

  /**
   * On touch move
   */
  onTouchMove(event: TouchEvent) {
    if (this.touchStartX === null) return;
    this.touchEndX = event.touches[0].clientX;
    const diff = this.touchStartX - this.touchEndX;

    // Geser carousel sesuai dengan pergerakan jari
    if (this.carouselRef?.nativeElement) {
      this.renderer.setStyle(
        this.carouselRef.nativeElement,
        'transform',
        `translateX(calc(-${this.currentSlide * 100}% - ${diff}px))`
      );
    }
  }

  /**
   * On touch end
   */
  onTouchEnd(event: TouchEvent) {
    if (this.touchStartX === null || this.touchEndX === null) return;

    const diff = this.touchStartX - this.touchEndX;

    // Jika pergeseran lebih dari 50px, geser ke slide berikutnya/sebelumnya
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    } else {
      // Jika tidak, kembali ke slide saat ini
      this.updateCarousel();
    }

    // Reset nilai touch
    this.touchStartX = null;
    this.touchEndX = null;

    // Mulai kembali auto-scroll
    this.startCarousel();
  }

  /**
   * Toggle notifications
   */
  toggleNotifications(event?: Event): void {
    if (event) {
      event.preventDefault();
      if (event instanceof MouseEvent) {
        this.createRipple(event);
      }
    }
    this.isNotificationsOn = !this.isNotificationsOn;
    console.log('Notifications are now', this.isNotificationsOn ? 'on' : 'off');
  }

  /**
   * Open forum thread
   */
  openThread(threadId: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      if (event instanceof MouseEvent) {
        this.createRipple(event);
      }
    }
    console.log('Opening thread:', threadId);
    this.router.navigate(['/forum/thread', threadId]);
  }

  /**
   * Navigate to a page
   */
  onNavigate(route: string | Event): void {
    if (typeof route !== 'string') {
      return; // Ignore if not a string
    }
    console.log('Navigating to:', route);
    this.router.navigate([`/${route.replace(/^\/+/, '')}`]);
  }

  // Navigation to 3D space is now handled by BottomNavComponent

  /**
   * Check if the device is low-end
   */
  private checkLowEndDevice(): boolean {
    // Check for low-end devices using hardware concurrency and device memory
    const nav = window.navigator as any;
    const isLowEndDevice =
      !('hardwareConcurrency' in nav) ||
      nav.hardwareConcurrency < 4 ||
      (nav.deviceMemory && nav.deviceMemory < 4) ||
      !('ontouchstart' in window) ||
      !('serviceWorker' in navigator) ||
      !('indexedDB' in window);

    if (isLowEndDevice) {
      document.body.classList.add('low-end-device');
    }

    return isLowEndDevice;
  }
}
