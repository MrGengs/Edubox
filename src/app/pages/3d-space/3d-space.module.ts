import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ThreedSpacePageRoutingModule } from './3d-space-routing.module';
import { Space3DPage } from './space-3d.page';
import { BottomNavComponent } from 'src/app/shared/components/bottom-nav/bottom-nav.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ThreedSpacePageRoutingModule,
    Space3DPage
  ]
})
export class ThreedSpacePageModule {}
