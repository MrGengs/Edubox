import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    BottomNavComponent
  ],
  exports: [
    BottomNavComponent
  ]
})
export class SharedModule { }
