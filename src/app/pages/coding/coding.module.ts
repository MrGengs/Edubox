import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CodingPageRoutingModule } from './coding-routing.module';
import { CodingPage } from './coding.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CodingPageRoutingModule
  ],
  declarations: [CodingPage]
})
export class CodingPageModule {}