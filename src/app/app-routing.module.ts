import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard, NoAuthGuard } from './guards/auth.guard';
import { Firestore, getFirestore } from '@angular/fire/firestore';
import { CodeWorkspaceService } from './services/code-workspace.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    loadChildren: () =>
      import('./pages/splash-screen/splash-screen.module').then(
        (m) => m.SplashScreenPageModule
      ),
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./pages/login/login.module').then((m) => m.LoginPageModule),
    canActivate: [NoAuthGuard],
    data: { requiresAuth: false },
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./pages/register/register.module').then(
        (m) => m.RegisterPageModule
      ),
    canActivate: [NoAuthGuard],
    data: { requiresAuth: false },
  },
  {
    path: 'forgot-password',
    loadChildren: () =>
      import('./pages/forgot-password/forgot-password.module').then(
        (m) => m.ForgotPasswordPageModule
      ),
    canActivate: [NoAuthGuard],
    data: { requiresAuth: false },
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
    canActivate: [AuthGuard],
    data: { requiresAuth: true },
  },
  {
    path: '3d-space',
    loadChildren: () =>
      import('./pages/3d-space/3d-space.module').then(
        (m) => m.ThreedSpacePageModule
      ),
    canActivate: [AuthGuard],
    data: { requiresAuth: true },
  },
  {
    path: 'coding',
    loadComponent: () =>
      import('./pages/coding/coding.page').then((m) => m.CodingPage),
    canActivate: [AuthGuard],
    data: { requiresAuth: true },
    providers: [
      {
        provide: Firestore,
        useFactory: () => getFirestore(),
      },
      CodeWorkspaceService,
    ],
  },
  {
    path: 'modul',
    loadChildren: () =>
      import('./pages/modul/modul.module').then((m) => m.ModulPageModule),
    canActivate: [AuthGuard],
    data: { requiresAuth: true },
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./pages/profile/profile.module').then((m) => m.ProfilePageModule),
    canActivate: [AuthGuard],
    data: { requiresAuth: true },
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./pages/register/register.module').then(
        (m) => m.RegisterPageModule
      ),
  },
  {
    path: 'help-support',
    loadComponent: () =>
      import('./pages/help-support/help-support.page').then(
        (m) => m.HelpSupportPage
      ),
    canActivate: [AuthGuard],
    data: { requiresAuth: true },
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about.page').then((m) => m.AboutPage),
    canActivate: [AuthGuard],
    data: { requiresAuth: true },
  },
  {
    path: 'privacy-policy',
    loadChildren: () =>
      import('./pages/privacy-policy/privacy-policy.module').then(
        (m) => m.PrivacyPolicyPageModule
      ),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      enableTracing: false, // Set to true for debugging routes
    }),
  ],
  exports: [RouterModule],
  providers: [AuthGuard],
})
export class AppRoutingModule {}
