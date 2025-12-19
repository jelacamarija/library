import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div class="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
        <h1 class="text-3xl font-bold text-red-600">403</h1>
        <p class="mt-2 text-lg font-semibold">Pristup zabranjen</p>
        <p class="mt-4 text-gray-600">
          Nemate pravo pristupa ovoj stranici.
        </p>

        <button
          (click)="goBack()"
          class="mt-6 w-full rounded-xl bg-black text-white p-3 font-semibold"
        >
          Nazad
        </button>
      </div>
    </div>
  `,
})
export class ForbiddenComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigateByUrl('/login');
  }
}