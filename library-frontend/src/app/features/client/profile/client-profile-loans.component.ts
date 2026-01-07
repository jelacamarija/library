import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Moj profil</h2>
      <!-- ovdje poslije ubaciš podatke (ime, email, itd.) -->
      <p class="text-gray-600">Osnovni podaci korisnika...</p>
    </div>
  `
})
export class ClientProfileLoansComponent {}