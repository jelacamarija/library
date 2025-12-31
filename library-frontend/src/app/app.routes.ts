import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { landingGuard} from './core/guards/landing.guard';
import { roleGuard } from './core/guards/role.guard';


export const routes: Routes = [
  // landing: / -> login ili role home
 { path: '', redirectTo: 'login', pathMatch: 'full' },


  { path: 'login', component: LoginComponent },

  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component')
        .then(m => m.RegisterComponent),
  },
  {
  path: 'verify',
  loadComponent: () =>
    import('./features/auth/verify/verify.component')
      .then(m => m.VerifyComponent),
  },


  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      {
        path: 'client',
        canActivate: [roleGuard],
        data: { roles: ['CLIENT'] },
        children: [
          {
            path: 'books',
            loadComponent: () =>
              import('./features/client/books/client-books.component')
                .then(m => m.ClientBooksComponent),
          },
          { path: '', redirectTo: 'books', pathMatch: 'full' }, // default za client
        ],
      },
    ],
  },


  { path: '**', redirectTo: '' }, // nek ide na landing
];
