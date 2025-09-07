import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Renderer2, HostListener, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
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
  imports: [
    CommonModule,
    FormsModule,
    BottomNavComponent,
    IonicModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Space3DPage implements OnInit, OnDestroy {
  @ViewChild('matrixContainer', { static: true }) matrixContainer!: ElementRef;
  @ViewChild('particlesContainer', { static: true })
  particlesContainer!: ElementRef;
  @ViewChild('codePreview', { static: false }) codePreviewElement!: ElementRef;

  // Navigation
  private navCtrl = inject(NavController);
  private router = inject(Router);

  // State
  currentColor = 'green';
  is3D = false;
  isPlaying = false;
  isDrawing = false;
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

  // Inject services
  private renderer = inject(Renderer2);

  constructor() {}

  ngOnInit() {
    // Use setTimeout to ensure the view is fully initialized
    setTimeout(() => {
      this.initializeMatrix();
      this.createParticles(50);
      this.updateCode();
    }, 0);
  }

  ngOnDestroy() {
    this.cleanupAnimations();
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
  toggleLED(index: number, state?: boolean) {
    const led = this.matrix[index];
    if (led) {
      led.active = state !== undefined ? state : !led.active;
      led.color = this.currentColor;
      
      // Update the element if it exists
      if (led.element) {
        if (led.active) {
          this.renderer.addClass(led.element, 'active');
          this.renderer.setStyle(led.element, 'background-color', led.color);
          this.renderer.setStyle(led.element, 'box-shadow', `0 0 15px ${led.color}`);
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
      const index = col !== undefined ? (row * this.MATRIX_SIZE + col) : row;
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

  createSpiralPattern() {
    this.clearMatrix();
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
            this.toggleLED(index, true);
          }, delay);
          delay += 30;
        }
      }
    }
  }

  createRainPattern() {
    this.clearMatrix();
    for (let col = 0; col < this.MATRIX_SIZE; col++) {
      if (Math.random() > 0.6) {
        const height = Math.floor(Math.random() * 12) + 4;
        for (let row = 0; row < height; row++) {
          const index = row * this.MATRIX_SIZE + col;
          setTimeout(() => {
            const tempColor = this.currentColor;
            this.currentColor = 'blue';
            this.toggleLED(index, true);
            this.currentColor = tempColor;
          }, row * 100 + col * 50);
        }
      }
    }
  }

  createHeartPattern() {
    this.clearMatrix();
    const heartPattern = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
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

  // Animation controls
  playAnimation() {
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

  pauseAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  // Clean up animations
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
  }

  // Update code preview
  private updateCode() {
    if (!this.codePreviewElement) return;

    let code = '// Generated Arduino Code\n';
    code += '#include <FastLED.h>\n\n';
    code += '#define NUM_LEDS 256\n';
    code += '#define DATA_PIN 6\n\n';
    code += 'CRGB leds[NUM_LEDS];\n\n';
    code += 'void setup() {\n';
    code += '  FastLED.addLeds<WS2812, DATA_PIN, GRB>(leds, NUM_LEDS);\n';
    code += '}\n\n';
    code += 'void loop() {\n';
    code += '  // Clear all LEDs\n';
    code += '  FastLED.clear();\n';

    // Add LED states
    this.matrix.forEach((led, index) => {
      if (led.active) {
        const colorMap: { [key: string]: string } = {
          green: 'CRGB::Green',
          red: 'CRGB::Red',
          blue: 'CRGB::Blue',
          yellow: 'CRGB::Yellow',
          purple: 'CRGB::Purple',
          cyan: 'CRGB::Cyan',
          white: 'CRGB::White',
        };

        const color = colorMap[led.color] || 'CRGB::Black';
        code += `  leds[${index}] = ${color};\n`;
      }
    });

    code += '  \n';
    code += '  // Show the LEDs\n';
    code += '  FastLED.show();\n';
    code += '  delay(50);\n';
    code += '}\n';

    this.codePreviewElement.nativeElement.textContent = code;
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

  // Copy code to clipboard
  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.codePreviewElement.nativeElement.textContent);
      // TODO: Show success message
      console.log('Code copied to clipboard');
    } catch (err) {
      console.error('Failed to copy code: ', err);
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
}
