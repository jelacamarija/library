import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // =======================
  // LANDING
  // =======================
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

  // =======================
  // AUTHENTICATED LAYOUT
  // =======================
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/app-layout.component')
        .then(m => m.AppLayoutComponent),
    children: [

      // =======================
      // CLIENT ROUTES
      // =======================
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

          {
            path: 'search',
            loadComponent: () =>
              import('./features/client/books/client-search.component')
                .then(m => m.ClientSearchComponent),
          },

          {
            path: 'profile',
            loadComponent: () =>
              import('./features/client/profile/client-profile-layout.component')
                .then(m => m.ClientProfileLayoutComponent),
            children: [
              { path: '', redirectTo: 'info', pathMatch: 'full' },

              {
                path: 'info',
                loadComponent: () =>
                  import('./features/client/profile/client-profile-info.component')
                    .then(m => m.ClientProfileInfoComponent),
              },
              {
                path: 'reservations',
                loadComponent: () =>
                  import('./features/client/profile/client-profile-reservations.component')
                    .then(m => m.ClientProfileReservationsComponent),
              },
              {
                path: 'loans',
                loadComponent: () =>
                  import('./features/client/profile/client-profile-loans.component')
                    .then(m => m.ClientProfileLoansComponent),
              },
            ],
          },

          { path: '', redirectTo: 'books', pathMatch: 'full' },
        ],
      },

      // =======================
      // LIBRARIAN ROUTES
      // =======================
      {
        path: 'librarian',
        canActivate: [roleGuard],
        data: { roles: ['LIBRARIAN'] },
        children: [

          {
            path: 'books',
            loadComponent: () =>
              import('./features/librarian/books/librarian-books.component')
                .then(m => m.LibrarianBooksComponent),
          },

          {
            path: 'search',
            loadComponent: () =>
              import('./features/librarian/books/librarian-search.component')
                .then(m => m.LibrarianSearchComponent),
          },

         /* {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/librarian/dashboard/librarian-dashboard.component')
                .then(m => m.LibrarianDashboardComponent),
          },*/

          // default librarian route
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },

  // =======================
  // FALLBACK
  // =======================
  { path: '**', redirectTo: '' },
];