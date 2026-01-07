import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">

      <!-- HEADER PROFILA -->
      <div class="flex items-center gap-4">
        <!-- Avatar sa inicijalima -->
        <div
          class="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold"
        >
          {{ initials }}
        </div>

        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ user?.name }}
          </h2>
          <p class="text-gray-600 text-sm">
            {{ user?.email }}
          </p>
        </div>
      </div>

      <!-- KARTICA SA PODACIMA -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div class="border rounded-lg p-4">
          <p class="text-sm text-gray-500">Ime i prezime</p>
          <p class="font-medium text-gray-900">{{ user?.name }}</p>
        </div>

        <div class="border rounded-lg p-4">
          <p class="text-sm text-gray-500">Email adresa</p>
          <p class="font-medium text-gray-900">{{ user?.email }}</p>
        </div>

      </div>

      <!-- INFO BOX -->
      <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
        Ukoliko primetite neku gresku, obratite se administratoru.
      </div>

    </div>
  `,
})
export class ClientProfileInfoComponent implements OnInit {
  private auth = inject(AuthService);

  user: { name: string; email: string } | null = null;
  initials = '';

  ngOnInit(): void {
    
    const name = this.auth.getName();
  const email = this.auth.getEmail();

  if (name && email) {
    this.user = { name, email };
    this.initials = this.getInitials(name);
  }
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(p => p.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
