import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfilePage } from './profile.page';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

const routes: Routes = [
  {
    path: '',
    component: ProfilePage,
  },
];

@NgModule({
  imports: [
    ProfilePage,
    RouterModule.forChild(routes)
  ],
  providers: [
    { provide: Firestore, useValue: Firestore },
    { provide: Auth, useValue: Auth }
  ]
})
export class ProfilePageModule {}
