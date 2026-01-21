import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet,RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-client-profile-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">

      <div class="flex gap-2">
        <a
          routerLink="info"
          [ngClass]="tabClass('info')"
          class="px-3 py-2 rounded transition"
        >Profil</a>

        <a
          routerLink="reservations"
          [ngClass]="tabClass('reservations')"
          class="px-3 py-2 rounded transition"
        >Rezervacije</a>

        <a
          routerLink="loans"
          [ngClass]="tabClass('loans')"
          class="px-3 py-2 rounded transition"
        >Iznajmljivanja</a>
      </div>

      <div class="bg-white rounded-xl shadow p-6">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
})
export class ClientProfileLayoutComponent {
  private router = inject(Router);

  tabClass(child: 'info' | 'reservations' | 'loans') {
    const url = `/client/profile/${child}`;
    const active = this.router.isActive(url, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });

    return active
      ? 'bg-blue-600 text-white'
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  }
}
