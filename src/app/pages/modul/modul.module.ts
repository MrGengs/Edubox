import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ModulPage } from './modul.page';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: ModulPage,
      },
    ]),
  ]
})
export class ModulPageModule {}
