import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GeminiAiService, ChatMessage } from '../../services/gemini-ai.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.page.html',
  styleUrls: ['./ai-chat.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    MarkdownPipe
  ]
})
export class AiChatPage implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer', { static: false }) chatContainer!: ElementRef;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  private shouldScrollToBottom = false;
  userName: string = 'User';

  constructor(
    private geminiService: GeminiAiService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Get user info and set personalized greeting
    this.authService.getCurrentUser$().subscribe(user => {
      this.userName = user?.displayName || 'User';
      this.initializeChat();
    });
  }
  
  private initializeChat() {
    // Clear messages and add personalized greeting
    this.messages = [];
    
    const greeting = this.userName !== 'User' 
      ? `🎓 Halo **${this.userName}**! Saya adalah EduBox Assistant, siap membantu Anda mempelajari LED Cube 3D berbasis Arduino ESP8266! Ada yang ingin ditanyakan tentang EduBox atau project elektronika?`
      : '🎓 Halo! Saya adalah EduBox Assistant, siap membantu Anda mempelajari LED Cube 3D berbasis Arduino ESP8266! Ada yang ingin ditanyakan tentang EduBox atau project elektronika?';
    
    this.messages.push({
      text: greeting,
      isUser: false,
      time: new Date()
    });
    
    this.shouldScrollToBottom = true;
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      text: this.newMessage,
      isUser: true,
      time: new Date()
    };
    this.messages.push(userMessage);
    this.shouldScrollToBottom = true;
    
    const userQuery = this.newMessage;
    this.newMessage = '';
    this.isLoading = true;

    try {
      // Get AI response from Gemini
      const aiResponse = await this.geminiService.generateResponse(userQuery);
      
      // Add AI response
      this.messages.push({
        text: aiResponse,
        isUser: false,
        time: new Date()
      });
      
      this.shouldScrollToBottom = true;
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback response
      this.messages.push({
        text: 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi nanti atau hubungi tim support EduBox untuk bantuan.',
        isUser: false,
        time: new Date()
      });
      
      this.shouldScrollToBottom = true;
    } finally {
      this.isLoading = false;
    }
  }
  
  private scrollToBottom() {
    if (this.chatContainer && this.chatContainer.nativeElement) {
      setTimeout(() => {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }, 100);
    }
  }
  
  // Helper method for template
  get displayUserName(): string {
    return this.userName || 'User';
  }
}
