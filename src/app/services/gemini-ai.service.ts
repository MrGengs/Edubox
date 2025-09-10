import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiApiKey } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatMessage {
  text: string;
  isUser: boolean;
  time: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiAiService {
  private genAI: GoogleGenerativeAI;
  private primaryModel: any;
  private fallbackModel: any;
  
  constructor(private authService: AuthService) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.primaryModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.fallbackModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
  }

  async generateResponse(userMessage: string): Promise<string> {
    // Get current user info
    const currentUser = this.authService.getCurrentUser();
    const userName = currentUser?.displayName || 'User';
    
    const eduboxContext = `
      Kamu adalah asisten AI untuk produk EduBox, sebuah LED Cube edukatif berbasis Arduino dengan board ESP8266 Lolin(WeMos) D1 R1.

      Tentang EduBox:
      - EduBox adalah LED Cube 3D yang dirancang untuk pembelajaran elektronika dan pemrograman
      - Menggunakan mikrokontroler ESP8266 dengan board Lolin(WeMos) D1 R1
      - Dapat menampilkan berbagai pola LED 3D yang menarik
      - Mendukung pemrograman melalui Arduino IDE
      - Memiliki konektivitas WiFi untuk kontrol jarak jauh
      - Cocok untuk pelajar, mahasiswa, dan hobbyist elektronika

      Fitur-fitur EduBox:
      - LED Matrix 3D (biasanya 4x4x4 atau 8x8x8)
      - Kontrol via aplikasi mobile
      - Pemrograman visual dan coding
      - Tutorial step-by-step
      - Berbagai mode animasi
      - Sinkronisasi musik
      - Mode pembelajaran interaktif

      Informasi Pengguna:
      - Nama pengguna: ${userName}
      - Panggil pengguna dengan nama mereka jika relevan dalam percakapan
      - Jika nama pengguna adalah "User" atau kosong, jangan gunakan nama khusus

      Peranmu:
      - Bantu pengguna memahami cara menggunakan EduBox
      - Berikan panduan pemrograman Arduino untuk LED Cube
      - Jelaskan fitur-fitur dan fungsi EduBox
      - Bantu troubleshooting masalah teknis
      - Berikan ide-ide project kreatif dengan EduBox
      - Gunakan bahasa Indonesia yang ramah dan mudah dipahami
      - Gunakan formatting markdown untuk respons yang lebih rapi (bold, italic, code, lists, dll)
      - Fokus pada aspek edukatif dan pembelajaran
      - Personalisasi respons dengan nama pengguna jika sesuai

      Jangan membahas produk lain atau topik yang tidak berkaitan dengan EduBox atau elektronika/programming secara umum.
    `;

    const prompt = `${eduboxContext}\n\nPertanyaan dari ${userName}: ${userMessage}\n\nBerikan jawaban yang informatif dan membantu:`;
    
    // Try primary model first
    try {
      const result = await this.tryWithRetry(this.primaryModel, prompt, 2);
      return result;
    } catch (primaryError) {
      console.warn('Primary model failed, trying fallback:', primaryError);
      
      // Try fallback model
      try {
        const result = await this.tryWithRetry(this.fallbackModel, prompt, 1);
        return result;
      } catch (fallbackError) {
        console.error('Both models failed:', fallbackError);
        return this.getOfflineResponse(userMessage);
      }
    }
  }

  private async tryWithRetry(model: any, prompt: string, maxRetries: number): Promise<string> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.log(`Attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`);
        await this.delay(waitTime);
      }
    }
    throw new Error('Max retries exceeded');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getOfflineResponse(userMessage: string): string {
    const query = userMessage.toLowerCase();
    const currentUser = this.authService.getCurrentUser();
    const userName = currentUser?.displayName || 'User';
    const nameGreeting = userName !== 'User' ? ` ${userName}` : '';
    
    // Basic responses for common EduBox questions
    if (query.includes('hai') || query.includes('halo') || query.includes('hi')) {
      return `👋 **Halo${nameGreeting}!** Saya EduBox Assistant. Maaf sedang ada gangguan koneksi, tapi saya tetap bisa membantu dengan pertanyaan dasar tentang **EduBox LED Cube**. Ada yang bisa saya bantu?`;
    }
    
    if (query.includes('edubox') || query.includes('led cube')) {
      return `📦 **EduBox** adalah LED Cube 3D edukatif yang menggunakan:

**Spesifikasi:**
- Board: **ESP8266 Lolin(WeMos) D1 R1**
- LED Matrix 3D (4x4x4 atau 8x8x8)
- Konektivitas **WiFi**
- Pemrograman via **Arduino IDE**

**Fitur Utama:**
- 🎨 Berbagai mode animasi
- 📱 Kontrol via aplikasi mobile  
- 🎵 Sinkronisasi musik
- 📚 Tutorial step-by-step

*Saya sedang offline, untuk bantuan lebih detail silakan coba lagi nanti.*`;
    }
    
    if (query.includes('arduino') || query.includes('code') || query.includes('programming')) {
      return `💻 **Pemrograman EduBox:**

**Langkah Dasar:**
1. Install **Arduino IDE**
2. Tambahkan board **ESP8266**
3. Pilih board **Lolin(WeMos) D1 R1**
4. Upload code ke EduBox

**Contoh Code Sederhana:**
\`\`\`cpp
void setup() {
  // Inisialisasi LED pins
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}
\`\`\`

*Saya sedang offline, untuk tutorial lengkap silakan coba lagi nanti.*`;
    }
    
    return `⚠️ **Maaf, sedang ada gangguan teknis.**

🔧 **EduBox Assistant sedang offline**, tapi saya bisa bantu dengan:
- Informasi dasar tentang **EduBox**
- Spesifikasi **ESP8266 Lolin D1 R1**
- Konsep **LED Cube 3D**

Untuk bantuan lebih detail tentang "${userMessage}", silakan **coba lagi dalam beberapa menit**.

📞 Atau hubungi tim support EduBox jika urgent!`;
  }
}