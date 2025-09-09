import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Renderer2,
  HostListener,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectorRef,
} from '@angular/core';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Router } from '@angular/router';

interface LED {
  element?: HTMLElement;
  active: boolean;
  color: string;
}

@Component({
  selector: 'app-3d-space',
  templateUrl: './space-3d.page.html',
  styleUrls: ['./space-3d.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, BottomNavComponent, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Space3DPage implements OnInit, OnDestroy {
  @ViewChild('matrixContainer', { static: true }) matrixContainer!: ElementRef;
  @ViewChild('particlesContainer', { static: true })
  particlesContainer!: ElementRef;
  @ViewChild('codePreview', { static: false }) codePreviewElement!: ElementRef;

  // Code Generation
  generatedCode: string = '';
  private codeUpdateInterval: any = null;

  // Navigation properties moved to constructor

  // State
  currentColor = 'green';
  is3D = false;
  isPlaying = false;
  isDrawing = false;
  selectedPreset: string | null = null;
  showPlaybackControls = false;
  private animationFrameId: number | null = null;
  private animationInterval: any = null;
  private patternInterval: any = null;
  private lastDrawn: { row: number; col: number } | null = null;
  matrix: LED[] = [];
  private frame = 0;

  // Colors
  colors = [
    { name: 'green', value: '#00ff00' },
    { name: 'red', value: '#ff0000' },
    { name: 'blue', value: '#0000ff' },
    { name: 'yellow', value: '#ffff00' },
    { name: 'purple', value: '#ff00ff' },
    { name: 'cyan', value: '#00ffff' },
    { name: 'white', value: '#ffffff' },
  ];

  // Matrix size
  readonly MATRIX_SIZE = 16;
  private readonly TOTAL_LEDS = this.MATRIX_SIZE * this.MATRIX_SIZE;

  constructor(
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private navCtrl: NavController,
    private router: Router
  ) {}

  ngOnInit() {
    // Initialize with buttons hidden
    this.showPlaybackControls = false;
    this.isPlaying = false;

    // Use setTimeout to ensure the view is fully initialized
    setTimeout(() => {
      this.initializeMatrix();
      this.createParticles(50);
      this.setupEventListeners();
      this.setupCodeGeneration();
      // Force update the view after initialization
      this.cdr.detectChanges();
    }, 0);
  }



  // Clean up all animations and intervals
  private cleanupAnimations() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    if (this.patternInterval) {
      clearInterval(this.patternInterval);
      this.patternInterval = null;
    }

    if (this.spiralAnimationFrame) {
      cancelAnimationFrame(this.spiralAnimationFrame);
      this.spiralAnimationFrame = null;
    }

    if (this.rainAnimationFrame) {
      cancelAnimationFrame(this.rainAnimationFrame);
      this.rainAnimationFrame = null;
    }
  }

  ngOnDestroy() {
    this.cleanupAnimations();
    this.renderer.destroy();
    if (this.codeUpdateInterval) {
      clearInterval(this.codeUpdateInterval);
    }
  }

  // Setup event listeners
  private setupEventListeners() {
    window.addEventListener('resize', () => this.onResize());
  }

  // Initialize the LED matrix
  private initializeMatrix() {
    const ledMatrix = this.matrixContainer.nativeElement;
    ledMatrix.innerHTML = ''; // Clear existing LEDs

    for (let i = 0; i < this.TOTAL_LEDS; i++) {
      const led: LED = {
        active: false,
        color: this.currentColor,
      };
      this.matrix[i] = led;

      // Create LED element
      const ledElement = this.renderer.createElement('div');
      this.renderer.addClass(ledElement, 'led');
      this.renderer.setAttribute(ledElement, 'data-index', i.toString());

      // Add staggered animation delay for initial load
      this.renderer.setStyle(ledElement, 'animation-delay', `${i * 0.01}s`);

      // Add event listeners
      const row = Math.floor(i / this.MATRIX_SIZE);
      const col = i % this.MATRIX_SIZE;

      this.renderer.listen(ledElement, 'mousedown', () => this.startDrawing(i));
      this.renderer.listen(ledElement, 'mouseenter', () =>
        this.onMouseEnter(row, col)
      );
      this.renderer.listen(ledElement, 'touchstart', (e: TouchEvent) => {
        e.preventDefault();
        this.startDrawing(i);
      });

      this.renderer.appendChild(ledMatrix, ledElement);
      led.element = ledElement;
    }

    // Add global mouse/touch end listeners
    this.renderer.listen('document', 'mouseup', () => this.stopDrawing());
    this.renderer.listen('document', 'touchend', () => this.stopDrawing());
  }

  // Toggle LED state
  toggleLED(index: number, state?: boolean, ignoreColorChange = false) {
    const led = this.matrix[index];
    if (led) {
      led.active = state !== undefined ? state : !led.active;

      // Jangan ubah warna jika ini adalah bagian dari animasi spiral
      if (!ignoreColorChange) {
        led.color = this.currentColor;
      }

      // Update the element if it exists
      if (led.element) {
        if (led.active) {
          this.renderer.addClass(led.element, 'active');
          // Gunakan warna yang sudah ada di LED jika ignoreColorChange true
          const colorToUse = ignoreColorChange ? led.color : this.currentColor;
          this.renderer.setStyle(led.element, 'background-color', colorToUse);
          this.renderer.setStyle(
            led.element,
            'box-shadow',
            `0 0 15px ${led.color}`
          );
        } else {
          this.renderer.removeClass(led.element, 'active');
          this.renderer.removeStyle(led.element, 'background-color');
          this.renderer.removeStyle(led.element, 'box-shadow');
        }
      }
    }
  }

  // Create floating particles
  private createParticles(count: number) {
    const container = this.particlesContainer.nativeElement;
    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const particle = this.renderer.createElement('div');
      this.renderer.addClass(particle, 'particle');
      this.renderer.setStyle(particle, 'left', `${Math.random() * 100}%`);
      this.renderer.setStyle(particle, 'top', `${Math.random() * 100}%`);
      this.renderer.setStyle(particle, 'width', `${Math.random() * 3 + 1}px`);
      const width = window.getComputedStyle(particle).width;
      this.renderer.setStyle(particle, 'height', width);
      this.renderer.setStyle(
        particle,
        'opacity',
        (Math.random() * 0.5 + 0.1).toString()
      );
      this.renderer.setStyle(
        particle,
        'animation-duration',
        `${Math.random() * 20 + 10}s`
      );
      this.renderer.setStyle(
        particle,
        'animation-delay',
        `${Math.random() * 5}s`
      );
      this.renderer.appendChild(container, particle);
    }
  }

  // Drawing methods
  startDrawing(index?: number) {
    this.isDrawing = true;
    if (index !== undefined) {
      this.toggleLED(index, true);
    }
  }

  stopDrawing() {
    this.isDrawing = false;
    this.lastDrawn = null;
  }

  onMouseEnter(row: number, col?: number) {
    if (this.isDrawing) {
      // Handle both (row, col) and (index) calls
      const index = col !== undefined ? row * this.MATRIX_SIZE + col : row;
      this.toggleLED(index, true);
    }
  }

  // Color selection
  selectColor(color: string) {
    this.currentColor = color;
  }

  // Clear the matrix
  clearMatrix() {
    this.matrix.forEach((led, index) => {
      setTimeout(() => {
        this.toggleLED(index, false);
      }, index * 2);
    });
  }

  // Fill the matrix with current color
  fillMatrix() {
    this.matrix.forEach((led, index) => {
      setTimeout(() => {
        this.toggleLED(index, true);
      }, index * 3);
    });
  }

  // Toggle 3D mode
  toggle3D() {
    this.is3D = !this.is3D;
    const container = this.matrixContainer.nativeElement;

    if (this.is3D) {
      this.renderer.addClass(container, 'matrix-3d');
    } else {
      this.renderer.removeClass(container, 'matrix-3d');
    }
  }

  // Pattern generation
  createWavePattern() {
    this.clearMatrix();
    for (let row = 0; row < this.MATRIX_SIZE; row++) {
      for (let col = 0; col < this.MATRIX_SIZE; col++) {
        const index = row * this.MATRIX_SIZE + col;
        const wave = Math.sin(col * 0.4) * 6 + 8;
        if (Math.abs(row - wave) < 2) {
          setTimeout(() => {
            this.toggleLED(index, true);
          }, col * 50);
        }
      }
    }
  }

  private spiralFrame = 0;
  private spiralAnimationFrame: number | null = null;

  private animateSpiral() {
    if (!this.isPlaying || this.selectedPreset !== 'spiral') {
      if (this.spiralAnimationFrame) {
        cancelAnimationFrame(this.spiralAnimationFrame);
        this.spiralAnimationFrame = null;
      }
      return;
    }

    this.clearMatrix();

    const center = 7.5;
    const angle = this.spiralFrame * 0.1;
    const maxRadius = 12;

    // Gambar spiral dengan warna biru tetap
    for (let r = 0; r < maxRadius; r += 0.5) {
      const x = Math.round(center + Math.cos(angle + r * 0.5) * r);
      const y = Math.round(center + Math.sin(angle + r * 0.5) * r);

      if (x >= 0 && x < this.MATRIX_SIZE && y >= 0 && y < this.MATRIX_SIZE) {
        const index = y * this.MATRIX_SIZE + x;
        if (this.matrix[index]) {
          // Setel langsung ke biru tanpa tergantung currentColor
          this.matrix[index].color = '#0000ff';
          this.matrix[index].active = true;

          // Update tampilan langsung
          if (this.matrix[index].element) {
            const el = this.matrix[index].element as HTMLElement;
            el.style.backgroundColor = '#0000ff';
            el.style.boxShadow = '0 0 15px #0000ff';
          }
        }
      }
    }

    this.spiralFrame++;
    this.spiralAnimationFrame = requestAnimationFrame(() =>
      this.animateSpiral()
    );
  }

  createSpiralPattern() {
    this.clearMatrix();
    this.pauseAnimation();
    this.spiralFrame = 0;

    // Draw initial spiral pattern in blue
    const center = 7.5;
    let delay = 0;

    for (let row = 0; row < this.MATRIX_SIZE; row++) {
      for (let col = 0; col < this.MATRIX_SIZE; col++) {
        const index = row * this.MATRIX_SIZE + col;
        const distance = Math.sqrt(
          Math.pow(row - center, 2) + Math.pow(col - center, 2)
        );
        const angle = Math.atan2(row - center, col - center);

        if (Math.sin(angle * 3 + distance * 0.5) > 0.3) {
          setTimeout(() => {
            // Set color to blue before toggling
            if (this.matrix[index]) {
              this.matrix[index].color = '#0000ff';
              this.toggleLED(index, true, true);
            }
          }, delay);
          delay += 30;
        }
      }
    }
  }

  // Rain animation state
  private raindrops: { col: number; row: number; speed: number }[] = [];
  private rainAnimationFrame: number | null = null;

  // Add a new raindrop at a random position above the matrix
  private addRaindrop() {
    this.raindrops.push({
      col: Math.floor(Math.random() * this.MATRIX_SIZE),
      row: -Math.floor(Math.random() * 5), // Start above the matrix
      speed: 0.5 + Math.random() * 1.5, // Random speed
    });
  }

  // Create rain pattern
  createRainPattern() {
    this.clearMatrix();
    this.pauseAnimation(); // Stop any existing animation

    // Initialize raindrops but don't start animation yet
    this.raindrops = [];
    for (let i = 0; i < 15; i++) {
      this.addRaindrop();
    }

    // Don't start animation here, just prepare the raindrops
    this.isPlaying = false;
  }

  createHeartPattern() {
    this.clearMatrix();
    const heartPattern = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    let delay = 0;
    for (let row = 0; row < this.MATRIX_SIZE; row++) {
      for (let col = 0; col < this.MATRIX_SIZE; col++) {
        const index = row * this.MATRIX_SIZE + col;
        if (heartPattern[row][col] === 1) {
          setTimeout(() => {
            const tempColor = this.currentColor;
            this.currentColor = 'red';
            this.toggleLED(index, true);
            this.currentColor = tempColor;
          }, delay);
          delay += 50;
        }
      }
    }
  }

  private animateRain() {
    if (!this.isPlaying || this.selectedPreset !== 'rain') return;

    // Clear the matrix
    this.matrix.forEach((_, index) => this.toggleLED(index, false));

    // Update and draw raindrops
    this.raindrops = this.raindrops
      .map((drop) => {
        const newRow = drop.row + drop.speed;

        // If drop is still in the matrix, keep it
        if (newRow < this.MATRIX_SIZE) {
          // Draw the drop
          const index = Math.floor(newRow) * this.MATRIX_SIZE + drop.col;
          if (index >= 0 && index < this.matrix.length) {
            const tempColor = this.currentColor;
            this.currentColor = 'blue';
            this.toggleLED(index, true);

            // Draw a trail
            for (let i = 1; i < 3; i++) {
              const trailRow = Math.floor(newRow) - i;
              if (trailRow >= 0) {
                const trailIndex = trailRow * this.MATRIX_SIZE + drop.col;
                if (trailIndex >= 0 && trailIndex < this.matrix.length) {
                  this.toggleLED(trailIndex, true);
                }
              }
            }
            this.currentColor = tempColor;
          }

          return { ...drop, row: newRow };
        } else {
          // Drop has fallen off the bottom, replace it with a new one
          this.addRaindrop();
          return null;
        }
      })
      .filter((drop) => drop !== null) as {
      col: number;
      row: number;
      speed: number;
    }[];

    // Add new drops randomly
    if (Math.random() > 0.7) {
      this.addRaindrop();
    }

    // Continue the animation
    this.rainAnimationFrame = requestAnimationFrame(() => this.animateRain());
  }

  playAnimation() {
    this.isPlaying = true;

    if (this.selectedPreset === 'rain') {
      // Start rain animation if not already running
      if (!this.rainAnimationFrame) {
        this.animateRain();
      }
    } else if (this.selectedPreset === 'spiral') {
      // Start spiral animation
      if (this.spiralAnimationFrame) {
        cancelAnimationFrame(this.spiralAnimationFrame);
      }
      this.animateSpiral();
    } else {
      // Original wave animation for other presets
      if (this.animationInterval) {
        clearInterval(this.animationInterval);
      }

      let frame = 0;
      this.animationInterval = setInterval(() => {
        for (let col = 0; col < this.MATRIX_SIZE; col++) {
          for (let row = 0; row < this.MATRIX_SIZE; row++) {
            const index = row * this.MATRIX_SIZE + col;
            const wave = Math.sin((col + frame) * 0.4) * 6 + 8;
            const wave2 = Math.cos((row + frame * 0.7) * 0.3) * 4 + 8;

            if (Math.abs(row - wave) < 1.5 || Math.abs(col - wave2) < 1.5) {
              this.toggleLED(index, true);
            } else {
              this.toggleLED(index, false);
            }
          }
        }
        frame += 0.3;
      }, 120);
    }
  }

  pauseAnimation() {
    this.isPlaying = false;

    // Clear any running animations
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.rainAnimationFrame) {
      cancelAnimationFrame(this.rainAnimationFrame);
      this.rainAnimationFrame = null;
    }

    if (this.spiralAnimationFrame) {
      cancelAnimationFrame(this.spiralAnimationFrame);
      this.spiralAnimationFrame = null;
    }

    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    // Setup code generation
    this.setupCodeGeneration();
  }

  private setupCodeGeneration() {
    // Generate initial code
    this.updateGeneratedCode();
    
    // Update code whenever matrix changes
    this.codeUpdateInterval = setInterval(() => {
      this.updateGeneratedCode();
    }, 1000);
  }

  // Generate code based on current matrix state
  private updateGeneratedCode() {
    const activeLEDs = this.matrix
      .map((led, index) => ({
        x: index % this.MATRIX_SIZE,
        y: Math.floor(index / this.MATRIX_SIZE),
        color: led.active ? led.color : null
      }))
      .filter((led): led is {x: number, y: number, color: string} => led.color !== null);

    const code = `// Generated LED Matrix Code
#include <FastLED.h>

#define MATRIX_WIDTH 16
#define MATRIX_HEIGHT 16
#define NUM_LEDS (MATRIX_WIDTH * MATRIX_HEIGHT)
#define DATA_PIN 6

CRGB leds[NUM_LEDS];

void setup() {
  FastLED.addLeds<NEOPIXEL, DATA_PIN>(leds, NUM_LEDS);
  FastLED.setBrightness(50);
  clearLEDs();
  
  // Set up your LED pattern below
  ${this.generateLEDSetupCode(activeLEDs)}
  
  FastLED.show();
}

void loop() {
  // Add your animation code here
}

void clearLEDs() {
  fill_solid(leds, NUM_LEDS, CRGB::Black);
}

// Helper function to set an LED by x,y coordinates
void setLED(int x, int y, const CRGB& color) {
  if (x >= 0 && x < MATRIX_WIDTH && y >= 0 && y < MATRIX_HEIGHT) {
    if (y % 2 == 0) {
      leds[y * MATRIX_WIDTH + x] = color;
    } else {
      leds[(y + 1) * MATRIX_WIDTH - x - 1] = color;
    }
  }
}`;

    this.generatedCode = code;
  }

  // Navigation
  onNavigate(route: string) {
    if (route === 'home') {
      this.navCtrl.navigateRoot('/home');
    } else if (route === '3d-space') {
      // Already on 3D space page
      return;
    } else {
      this.router.navigate([`/${route}`]);
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  // Save project
  saveProject() {
    // TODO: Implement save project functionality
    console.log('Saving project...');
  }

  // Share project
  shareProject() {
    // TODO: Implement share project functionality
    console.log('Sharing project...');
  }

  // Toggle play/pause
  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.playAnimation();
    } else {
      this.pauseAnimation();
    }
  }

  // Load preset pattern
  loadPreset(preset: string) {
    this.selectedPreset = preset;
    this.isPlaying = false; // Reset play state when changing presets

    // Only show playback controls for wave, rain, and spiral presets
    const validPresets = ['wave', 'rain', 'spiral'];
    this.showPlaybackControls = validPresets.includes(preset);

    // Force UI update
    this.cdr.detectChanges();

    // Clear any existing animations first
    this.pauseAnimation();

    switch (preset) {
      case 'wave':
        this.createWavePattern();
        break;
      case 'spiral':
        this.createSpiralPattern();
        break;
      case 'rain':
        this.createRainPattern();
        break;
      case 'heart':
        this.createHeartPattern();
        break;
    }
  }


  // Add this method to handle touch move events for better drawing experience
  onTouchMove(event: TouchEvent) {
    if (!this.isDrawing) return;

    const touch = event.touches[0];
    const element = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    ) as HTMLElement;

    if (element && element.classList.contains('led')) {
      const index = parseInt(element.getAttribute('data-index') || '-1', 10);
      if (index >= 0) {
        this.toggleLED(index, true);
      }
    }
  }

  // Add this method to handle window resize
  @HostListener('window:resize')
  onResize() {
    // Recalculate any layout-dependent values here
    // For example, you might want to adjust the particle container size
    if (this.particlesContainer) {
      const container = this.particlesContainer.nativeElement;
      this.renderer.setStyle(container, 'width', '100%');
      this.renderer.setStyle(container, 'height', '100%');
    }
  }

  // Add this method to handle color selection with hex values
  selectColorByHex(hex: string) {
    // Convert hex to color name if it exists in our colors array
    const colorObj = this.colors.find((c) => c.value === hex.toLowerCase());
    if (colorObj) {
      this.currentColor = colorObj.name;
    } else {
      // For custom colors, you might want to add them to the colors array
      this.currentColor = hex;
    }
  }

  // Add this method to generate a random pattern
  generateRandomPattern() {
    this.clearMatrix();
    this.matrix.forEach((_, index) => {
      if (Math.random() > 0.7) {
        // 30% chance for an LED to be on
        setTimeout(() => {
          // Pick a random color
          const randomColor =
            this.colors[Math.floor(Math.random() * this.colors.length)];
          const tempColor = this.currentColor;
          this.currentColor = randomColor.name;
          this.toggleLED(index, true);
          this.currentColor = tempColor;
        }, Math.random() * 1000); // Random delay up to 1s
      }
    });
  }

  // Add this method to save the current pattern
  savePattern() {
    const pattern = {
      date: new Date().toISOString(),
      leds: this.matrix.map((led) => ({
        active: led.active,
        color: led.color,
      })),
    };

    // Here you would typically save to a service or local storage
    console.log('Pattern saved:', pattern);
    // Example: this.storageService.savePattern(pattern);

    // Show a toast or notification
    // this.showToast('Pattern saved successfully');
  }

  // Add this method to load a pattern
  loadPattern(pattern: any) {
    if (pattern && pattern.leds && pattern.leds.length === this.matrix.length) {
      this.clearMatrix();
      pattern.leds.forEach((led: any, index: number) => {
        if (led.active) {
          setTimeout(() => {
            const tempColor = this.currentColor;
            this.currentColor = led.color;
            this.toggleLED(index, true);
            this.currentColor = tempColor;
          }, index * 5);
        }
      });
    }
  }

  // Add this method to create a simple animation
  createPulseAnimation() {
    this.clearMatrix();
    const center = Math.floor(this.MATRIX_SIZE / 2);
    let radius = 0;
    const maxRadius = Math.ceil(this.MATRIX_SIZE * 1.5);

    const animate = () => {
      this.clearMatrix();

      // Draw a circle with current radius
      for (let row = 0; row < this.MATRIX_SIZE; row++) {
        for (let col = 0; col < this.MATRIX_SIZE; col++) {
          const dx = col - center;
          const dy = row - center;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (Math.abs(distance - radius) < 1) {
            const index = row * this.MATRIX_SIZE + col;
            this.toggleLED(index, true);
          }
        }
      }

      radius += 0.5;
      if (radius > maxRadius) {
        radius = 0;
      }

      if (this.isPlaying) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.isPlaying = true;
    animate();
  }

  // Add this method to handle keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Example: Press 'C' to clear
    if (event.key.toLowerCase() === 'c') {
      this.clearMatrix();
    }
    // Example: Press 'F' to fill
    else if (event.key.toLowerCase() === 'f') {
      this.fillMatrix();
    }
    // Example: Press 'R' for random pattern
    else if (event.key.toLowerCase() === 'r') {
      this.generateRandomPattern();
    }
    // Example: Press space to toggle animation
    else if (event.key === ' ') {
      if (this.isPlaying) {
        this.pauseAnimation();
      } else {
        this.playAnimation();
      }
    }
  }



// ...

  // Generate Arduino FastLED code
  private generateArduinoCode(activeLEDs: {x: number, y: number, color: string}[]): string {
    return `// Generated LED Matrix Code
#include <FastLED.h>

#define MATRIX_WIDTH 16
#define MATRIX_HEIGHT 16
#define NUM_LEDS (MATRIX_WIDTH * MATRIX_HEIGHT)
#define DATA_PIN 6

CRGB leds[NUM_LEDS];

void setup() {
  FastLED.addLeds<NEOPIXEL, DATA_PIN>(leds, NUM_LEDS);
  FastLED.setBrightness(50);
  clearLEDs();
  
  // Set up your LED pattern below
  ${this.generateLEDSetupCode(activeLEDs)}
  
  FastLED.show();
}

void loop() {
  // Add your animation code here
}

void clearLEDs() {
  fill_solid(leds, NUM_LEDS, CRGB::Black);
}

// Helper function to set an LED by x,y coordinates (zigzag pattern)
void setLED(int x, int y, const CRGB& color) {
  if (x >= 0 && x < MATRIX_WIDTH && y >= 0 && y < MATRIX_HEIGHT) {
    if (y % 2 == 0) {
      leds[y * MATRIX_WIDTH + x] = color;
    } else {
      leds[(y + 1) * MATRIX_WIDTH - x - 1] = color;
    }
  }
}`;
  }

  // Generate LED setup code based on active LEDs
  private generateLEDSetupCode(leds: Array<{x: number, y: number, color: string | null}>): string {
    if (!leds.length) return '// No active LEDs';

    return leds
      .filter((led): led is {x: number, y: number, color: string} => led.color !== null)
      .map(led => {
        const rgb = this.hexToRgb(led.color);
        return `setLED(${led.x}, ${led.y}, CRGB(${rgb.r}, ${rgb.g}, ${rgb.b}));`;
      })
      .join('\n  ');
  }

  // Convert hex color to RGB
  private hexToRgb(hex: string): {r: number, g: number, b: number} {
    // Remove # if present
    const hexValue = hex.replace('#', '');
    
    // Parse r, g, b values
    const bigint = parseInt(hexValue, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }


  // Update the code preview in the UI
  private updateCodePreview() {
    if (this.codePreviewElement?.nativeElement) {
      this.codePreviewElement.nativeElement.textContent = this.generatedCode;
    }
  }

  // Copy code to clipboard with enhanced visual feedback
  isCopied = false;
  private copyTimeout: any;

  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.generatedCode);
      
      // Show success state
      this.isCopied = true;
      
      // Create and show success toast
      const toast = document.createElement('ion-toast');
      toast.message = 'Kode berhasil disalin ke clipboard!';
      toast.duration = 2000;
      toast.position = 'top';
      toast.cssClass = 'copy-toast';
      
      // Style the toast
      toast.style.setProperty('--background', 'rgba(16, 185, 129, 0.95)');
      toast.style.setProperty('--color', 'white');
      toast.style.setProperty('--border-radius', '12px');
      toast.style.setProperty('--box-shadow', '0 4px 16px rgba(16, 185, 129, 0.3)');
      
      document.body.appendChild(toast);
      await toast.present();
      
      // Reset the copied state after animation
      if (this.copyTimeout) {
        clearTimeout(this.copyTimeout);
      }
      
      this.copyTimeout = setTimeout(() => {
        this.isCopied = false;
        this.cdr.detectChanges();
      }, 2000);
      
      return true;
    } catch (err) {
      console.error('Failed to copy code: ', err);
      
      // Show error toast if copy fails
      const toast = document.createElement('ion-toast');
      toast.message = '❌ Gagal menyalin kode. Silakan coba lagi.';
      toast.duration = 3000;
      toast.position = 'top';
      toast.cssClass = 'error-toast';
      
      // Style the error toast
      toast.style.setProperty('--background', 'rgba(239, 68, 68, 0.95)');
      toast.style.setProperty('--color', 'white');
      toast.style.setProperty('--border-radius', '12px');
      toast.style.setProperty('--box-shadow', '0 4px 16px rgba(239, 68, 68, 0.3)');
      
      document.body.appendChild(toast);
      await toast.present();
      
      return false;
    }
  }
}
