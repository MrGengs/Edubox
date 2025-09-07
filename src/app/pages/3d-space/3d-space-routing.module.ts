import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Space3DPage } from './space-3d.page';

const routes: Routes = [
  {
    path: '',
    component: Space3DPage
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    Space3DPage // Import the standalone component here
  ],
  exports: [RouterModule]
})
export class ThreedSpacePageRoutingModule {}
