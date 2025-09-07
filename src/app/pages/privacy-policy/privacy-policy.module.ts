import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PrivacyPolicyPage } from './privacy-policy.page';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: PrivacyPolicyPage
      }
    ])
  ]
})
export class PrivacyPolicyPageModule {}
