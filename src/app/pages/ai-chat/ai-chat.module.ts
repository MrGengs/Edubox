import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AiChatPage } from './ai-chat.page';
import { AiChatPageRoutingModule } from './ai-chat-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AiChatPageRoutingModule,
    AiChatPage
  ]
})
export class AiChatPageModule {}
