import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { landingGuard } from './core/guards/landing.guard';
import { roleGuard, roleChildGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // =======================
  // PUBLIC ROUTES
  // =======================
  { path: '', canActivate: [landingGuard], children: [] },

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

  // 🔑 KLJUČNO: SET PASSWORD (PUBLIC)
  {
    path: 'set-password',
    loadComponent: () =>
      import('./features/auth/set-password/set-password.component')
        .then(m => m.SetPasswordComponent),
  },

  // =======================
  // FORBIDDEN
  // =======================
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/forbidden/forbidden.component')
        .then(m => m.ForbiddenComponent),
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
      // CLIENT
      // =======================
      {
        path: 'client',
        canActivate: [roleGuard],
        canActivateChild: [roleChildGuard],
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
      // LIBRARIAN
      // =======================
      {
        path: 'librarian',
        canActivate: [roleGuard],
        canActivateChild: [roleChildGuard],
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
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/librarian/dashboard/librarian-dashboard-layout.component')
                .then(m => m.LibrarianDashboardLayoutComponent),
            children: [
              { path: '', redirectTo: 'users', pathMatch: 'full' },
              {
                path: 'users',
                loadComponent: () =>
                  import('./features/librarian/dashboard/librarian-dashboard-users.component')
                    .then(m => m.LibrarianDashboardUsersComponent),
              },
              {
                path: 'users/new',
                loadComponent: () =>
                  import('./features/librarian/dashboard/librarian-dashboard-user-create.component')
                    .then(m => m.LibrarianDashboardUserCreateComponent),
              },
              {
                path: 'reservations',
                loadComponent: () =>
                  import('./features/librarian/dashboard/librarian-dashboard-reservations.component')
                    .then(m => m.LibrarianDashboardReservationsComponent),
              },
              {
                path: 'loans',
                loadComponent: () =>
                  import('./features/librarian/dashboard/librarian-dashboard-loans.component')
                    .then(m => m.LibrarianDashboardLoansComponent),
              },
            ],
          },
          { path: '', redirectTo: 'books', pathMatch: 'full' },
        ],
      },
    ],
  },

  // =======================
  // FALLBACK
  // =======================
  { path: '**', redirectTo: '' },
];
