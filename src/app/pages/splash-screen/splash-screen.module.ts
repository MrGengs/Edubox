import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SplashScreenComponent } from './splash-screen.component';
import { SplashScreenRoutingModule } from './splash-screen-routing.module';

@NgModule({
  declarations: [SplashScreenComponent],
  imports: [
    CommonModule,
    IonicModule,
    SplashScreenRoutingModule
  ]
})
export class SplashScreenPageModule {}
