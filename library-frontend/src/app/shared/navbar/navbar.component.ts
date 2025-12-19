import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="w-full border-b bg-white">
      <div class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-xl bg-black"></div>
          <div>
            <div class="font-bold leading-5">Biblioteka</div>
            <div class="text-xs text-gray-500" *ngIf="role()">
              Uloga: {{ role() }}
            </div>
          </div>
        </div>

        <nav class="flex items-center gap-2">
          <a
            *ngFor="let item of navItems()"
            [routerLink]="item.path"
            routerLinkActive="bg-black text-white"
            [routerLinkActiveOptions]="{ exact: true }"
            class="px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-100"
          >
            {{ item.label }}
          </a>

          <button
            *ngIf="loggedIn()"
            (click)="onLogout()"
            class="ml-2 px-3 py-2 rounded-xl text-sm font-semibold bg-black text-white hover:opacity-90"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  loggedIn = computed(() => this.auth.isLoggedIn());
  role = computed(() => this.auth.getRole());

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
