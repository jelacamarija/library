import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  // Layout grupa (prikazuje navbar)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      // CLIENT
      {
        path: 'client',
        canActivate: [roleGuard],
        data: { roles: ['CLIENT'] },
        children: [
          { path: 'books', loadComponent: () => import('./features/dummy/dummy.component').then(m => m.DummyComponent) },
          { path: 'search', loadComponent: () => import('./features/dummy/dummy.component').then(m => m.DummyComponent) },
          { path: 'profile', loadComponent: () => import('./features/dummy/dummy.component').then(m => m.DummyComponent) },
          { path: '', redirectTo: 'books', pathMatch: 'full' },
        ],
      },

      // LIBRARIAN
      {
        path: 'librarian',
        canActivate: [roleGuard],
        data: { roles: ['LIBRARIAN'] },
        children: [
          { path: 'books', loadComponent: () => import('./features/dummy/dummy.component').then(m => m.DummyComponent) },
          { path: 'search', loadComponent: () => import('./features/dummy/dummy.component').then(m => m.DummyComponent) },
          { path: 'dashboard', loadComponent: () => import('./features/dummy/dummy.component').then(m => m.DummyComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
