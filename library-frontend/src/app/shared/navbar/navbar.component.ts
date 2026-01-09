import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
<header class="bg-white shadow-md">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <div class="flex items-center">
        <!-- ✅ logo vodi na home po roli -->
        <a [routerLink]="homePath()" class="text-xl font-bold text-blue-600">
          Biblioteka
        </a>

        <nav class="flex items-center space-x-8 ml-10">
          <a
            *ngFor="let item of navItems()"
            [routerLink]="item.path"
            routerLinkActive="text-blue-600 font-medium"
            class="text-gray-600 hover:text-gray-900 transition-colors"
          >
            {{ item.label }}
          </a>

          <button
            *ngIf="loggedIn()"
            (click)="onLogout()"
            class="text-gray-600 hover:text-red-600 transition-colors"
            type="button"
          >
            Odjava
          </button>
        </nav>
      </div>
    </div>
  </div>
</header>
  `,
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  loggedIn = computed(() => this.auth.isLoggedIn());
  role = computed(() => this.auth.getRole());

  homePath = computed(() => {
    const role = this.role();
    if (role === 'CLIENT') return '/client/books';
    if (role === 'LIBRARIAN') return '/librarian/books'; // ili '/librarian/dashboard'
    return '/login';
  });

  navItems = computed(() => {
    const role = this.role();
    if (!role) return [];

    if (role === 'CLIENT') {
      return [
        { label: 'Knjige', path: '/client/books' },
        { label: 'Pretraga', path: '/client/search' },
        { label: 'Moj profil', path: '/client/profile' },
      ];
    }

    return [
      { label: 'Knjige', path: '/librarian/books' },
      { label: 'Pretraga', path: '/librarian/search' },
      { label: 'Dashboard', path: '/librarian/dashboard' },
    ];
  });

  onLogout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
