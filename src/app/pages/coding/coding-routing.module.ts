import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CodingPage } from './coding.page';

const routes: Routes = [
  {
    path: '',
    component: CodingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CodingPageRoutingModule {}