import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, ClientProfileDto } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loading" class="text-gray-600">Učitavanje profila...</div>

    <div *ngIf="!loading && errorMsg" class="text-red-600">{{ errorMsg }}</div>

    <div *ngIf="!loading && user" class="space-y-6">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
          {{ initials }}
        </div>

        <div>
          <h2 class="text-xl font-semibold text-gray-900">{{ user.name }}</h2>
          <p class="text-gray-600 text-sm">{{ user.email }}</p>
        </div>
      </div>

   
     

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border rounded-lg p-4">
          <p class="text-sm text-gray-500">Broj telefona</p>
          <p class="font-medium text-gray-900">{{ user.phoneNumber || '-' }}</p>
        </div>

        <div class="border rounded-lg p-4">
          <p class="text-sm text-gray-500">Broj članske karte</p>
          <p class="font-medium text-gray-900">{{ user.membershipNumber || '-' }}</p>
        </div>

        <div class="border rounded-lg p-4">
          <p class="text-sm text-gray-500">Verifikovan nalog</p>
          <p class="font-medium text-gray-900">{{ user.isVerified ? 'Da ✅' : 'Ne ❌' }}</p>
        </div>

        <div class="border rounded-lg p-4">
          <p class="text-sm text-gray-500">Nalog kreiran</p>
          <p class="font-medium text-gray-900">{{ formatDateEU(user.createdAt) }}</p>
        </div>
      </div>

    <div class="border rounded-lg p-4 mt-4">

  <p class="text-sm text-gray-500 mb-1">Status članarine</p>

  <!-- TEKST -->
  <p class="text-sm font-medium"
     [ngClass]="{
       'text-green-600': user.membershipStatus === 'ACTIVE',
       'text-red-600': user.membershipStatus === 'PENDING' || user.membershipStatus === 'EXPIRED',
       'text-gray-600': user.membershipStatus === 'CANCELED'
     }">
    {{ getMembershipMessage() }}
  </p>

  <!-- AKTIVNA -->
  <div *ngIf="user.membershipStatus === 'ACTIVE'" class="mt-2 text-sm text-green-600">
    Važi do: {{ formatDateEU(user.membershipEndDate) }}
  </div>

  <!-- PLAĆANJE -->
  <button
    *ngIf="user.membershipStatus === 'PENDING' || user.membershipStatus === 'EXPIRED'"
    (click)="payMembership()"
    class="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
  >
    Plati članarinu
  </button>

  <!-- OTKAZIVANJE -->
  <button
    *ngIf="user.membershipStatus === 'ACTIVE'"
    (click)="cancelMembership()"
    class="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
  >
    Otkaži članarinu
  </button>

</div>

    </div>

  `,
})
export class ClientProfileInfoComponent implements OnInit {
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  user: ClientProfileDto | null = null;
  initials = '';
  loading = true;
  errorMsg = '';

  ngOnInit(): void {
    this.loading = true;
    this.errorMsg = '';

    this.auth.getMyProfile().subscribe({
      next: (u) => {
        this.user = u;
        this.initials = this.getInitials(u.name);
        this.loading = false;

        this.cdr.detectChanges();
      },
      error: (e) => {
        console.log('PROFILE ERROR:', e);
        this.loading = false;
        this.errorMsg = 'Ne mogu učitati profil.';

        this.cdr.detectChanges();
      },
    });
  }

  private getInitials(name: string): string {
    return name.trim().split(/\s+/).map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  payMembership() {
         console.log('Pokreni plaćanje');

        // kasnije ćemo povezati PayPal
  }

  getMembershipMessage() {
  if (!this.user) return '';

  switch (this.user.membershipStatus) {
    case 'PENDING':
      return 'Članarina nije plaćena. Plaćanje možete izvršiti u biblioteci ili putem sajta PayPalom. Iznos je 100 dolara.';

    case 'EXPIRED':
      return 'Članarina je istekla. Potrebno je da je obnovite kako biste mogli koristiti usluge.';

    case 'ACTIVE':
      return 'Članarina je aktivna.';

    case 'CANCELED':
      return 'Članarina je otkazana.';

    default:
      return '';
  }
}

cancelMembership() {
  console.log('Otkazivanje članarine');

  // kasnije:
  // poziv backenda
}

  formatDateEU(value?: string | null): string {
    if (!value) return '-';
    const iso = value.replace(/\+00:00$/, 'Z');
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
