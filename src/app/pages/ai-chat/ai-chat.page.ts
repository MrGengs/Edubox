import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GeminiAiService, ChatMessage } from '../../services/gemini-ai.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { AuthService } from '../../services/auth.service';
import { tap } from 'rxjs/operators';

interface ChatUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

interface ChatUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

@Component({
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.page.html',
  styleUrls: ['./ai-chat.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, MarkdownPipe],
})
export class AiChatPage implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer', { static: false }) chatContainer!: ElementRef;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  debugMode: boolean = true; // Set to false in production
  avatarImage: string | null = null;
  imageLoaded = false;
  imageError = false;
  userInitials = '??';
  private shouldScrollToBottom = false;
  user: ChatUser = {
    uid: '',
    displayName: 'User',
    photoURL: null,
    email: null
  };

  constructor(
    private geminiService: GeminiAiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get user info and set personalized greeting
    this.authService.getCurrentUser$().pipe(
      tap((user: ChatUser | null) => {
        console.log('User data in AI Chat:', user); // Debug log
        if (user) {
          this.user = {
            uid: user.uid || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL || null,
            email: user.email
          };
          
          // Update avatar image
          this.avatarImage = user.photoURL 
            ? user.photoURL.replace(/=s96-c$/, '=s400-c')
            : null;
            
          this.userInitials = this.user.displayName 
            ? this.user.displayName.substring(0, 2).toUpperCase()
            : '??';
            
          console.log('Updated user in component:', this.user); // Debug log
        }
      })
    ).subscribe(() => {
      this.initializeChat();
    });
  }

  private initializeChat() {
    // Clear messages and add personalized greeting
    this.messages = [];

    const greeting =
      this.user.displayName && this.user.displayName !== 'User'
        ? `Halo **${this.user.displayName}**! Saya adalah EduBox Assistant, siap membantu Anda mempelajari LED Cube 3D berbasis Arduino ESP8266! Ada yang ingin ditanyakan tentang EduBox atau project elektronika?`
        : 'Halo! Saya adalah EduBox Assistant, siap membantu Anda mempelajari LED Cube 3D berbasis Arduino ESP8266! Ada yang ingin ditanyakan tentang EduBox atau project elektronika?';

    this.messages.push({
      text: greeting,
      isUser: false,
      time: new Date(),
    });

    this.shouldScrollToBottom = true;
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  // Handle image load event
  onImageLoad(event: Event) {
    this.imageLoaded = true;
    this.imageError = false;
  }

  // Handle image error event
  onImageError(event: Event) {
    console.error('Error loading profile image:', event);
    this.imageError = true;
    this.imageLoaded = false;
    this.avatarImage = null;
  }

  private isAboutDeveloperQuestion(question: string): boolean {
    const keywords = ['siapa pembuat', 'pengembang', 'dibuat oleh', 'developer', 'pembuat edubox', 'pengembang edubox'];
    const lowerQuestion = question.toLowerCase();
    return keywords.some(keyword => lowerQuestion.includes(keyword));
  }

  private getDeveloperInfoResponse(): string {
    return 'EduBox dikembangkan oleh **Tim Developer IT Enuma Technology**, sebuah tim profesional yang berkomitmen menciptakan solusi teknologi pendidikan inovatif. Kami menggabungkan keahlian teknis dengan pemahaman mendalam tentang kebutuhan pembelajaran modern untuk menghadirkan pengalaman belajar yang bermakna dan menyenangkan.';
  }

  async sendMessage() {
    if (!this.newMessage.trim() || this.isLoading) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      text: this.newMessage,
      isUser: true,
      time: new Date(),
    };
    this.messages.push(userMessage);
    this.shouldScrollToBottom = true;

    const userQuery = this.newMessage;
    this.newMessage = '';
    this.isLoading = true;

    // Check if the question is about the developers
    if (this.isAboutDeveloperQuestion(userQuery)) {
      this.messages.push({
        text: this.getDeveloperInfoResponse(),
        isUser: false,
        time: new Date()
      });
      this.isLoading = false;
      this.shouldScrollToBottom = true;
      return;
    }

    try {
      // Get AI response from Gemini
      const aiResponse = await this.geminiService.generateResponse(userQuery);

      // Add AI response
      this.messages.push({
        text: aiResponse,
        isUser: false,
        time: new Date(),
      });

      this.shouldScrollToBottom = true;
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Fallback response
      this.messages.push({
        text: 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi nanti atau hubungi tim support EduBox untuk bantuan.',
        isUser: false,
        time: new Date(),
      });

      this.shouldScrollToBottom = true;
    } finally {
      this.isLoading = false;
    }
  }

  private scrollToBottom() {
    if (this.chatContainer && this.chatContainer.nativeElement) {
      setTimeout(() => {
        this.chatContainer.nativeElement.scrollTop =
          this.chatContainer.nativeElement.scrollHeight;
      }, 100);
    }
  }

  // Helper method for template
  get displayUserName(): string {
    return this.user?.displayName || 'User';
  }
}
