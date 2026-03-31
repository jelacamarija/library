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
      
      <!-- HEADER -->
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
          {{ initials }}
        </div>

        <div>
          <h2 class="text-xl font-semibold text-gray-900">{{ user.name }}</h2>
          <p class="text-gray-600 text-sm">{{ user.email }}</p>
        </div>
      </div>

      <!-- INFO GRID -->
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

      <!-- MEMBERSHIP -->
      <div class="border rounded-lg p-4">

        <p class="text-sm text-gray-500 mb-1">Status članarine</p>

        <!-- PORUKA -->
        <p
          class="text-sm font-medium"
          [ngClass]="{
            'text-green-600': user.membershipStatus === 'ACTIVE',
            'text-yellow-600': user.membershipStatus === 'CANCELED',
            'text-red-600': user.membershipStatus === 'PENDING' || user.membershipStatus === 'EXPIRED'
          }"
        >
          {{ getMembershipMessage() }}
        </p>

        <!-- DATUM -->
        <div *ngIf="user.membershipEndDate && user.membershipStatus !== 'PENDING'" class="mt-2 text-sm text-gray-600">
          Važi do: {{ formatDateEU(user.membershipEndDate) }}
        </div>

        <!-- PLAĆANJE -->
        <button
          *ngIf="user.membershipStatus === 'PENDING' || user.membershipStatus === 'EXPIRED'"
          (click)="renewMembership()"
          class="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Plati članarinu
        </button>

        <!-- OBNOVA -->
        <button
          *ngIf="isCanceledAndExpired()"
          (click)="renewMembership()"
          class="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Obnovi članarinu
        </button>

        <!-- 🔴 OTKAZIVANJE (samo ako je ACTIVE) -->
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
    this.auth.getMyProfile().subscribe({
      next: (u) => {
        this.user = u;
        this.initials = this.getInitials(u.name);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Ne mogu učitati profil.';
        this.cdr.detectChanges();
      },
    });
  }

  // 🔤 inicijali
  private getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .map(p => p.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // 📅 format datuma
  formatDateEU(value?: string | null): string {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}.${month}.${year}`;
  }

  // 🧠 status poruka
  getMembershipMessage(): string {
    if (!this.user) return '';

    const today = new Date();
    const endDate = this.user.membershipEndDate
      ? new Date(this.user.membershipEndDate)
      : null;

    switch (this.user.membershipStatus) {

      case 'PENDING':
        return 'Članarina nije plaćena. Plaćanje možete izvršiti u biblioteci ili putem sajta PayPalom. Iznos je 100 dolara.';

      case 'EXPIRED':
        return 'Članarina je istekla. Potrebno je da je obnovite.';

      case 'ACTIVE':
        return 'Članarina je aktivna.';

      case 'CANCELED':
        if (endDate && endDate > today) {
          return `Članarina je otkazana, ali važi do ${this.formatDateEU(this.user.membershipEndDate)}.`;
        }
        return 'Članarina je istekla.';

      default:
        return '';
    }
  }

  // 🔁 obnovi / plati
  renewMembership() {
    if (!this.user?.membershipID) return;

    this.auth.createPaypalOrder(this.user.membershipID)
      .subscribe({
        next: (approvalUrl) => {
          window.location.href = approvalUrl;
        },
        error: (err) => {
          console.log('PAY ERROR', err);
        }
      });
  }

  // 🟡 proveri da li je canceled + istekla
  isCanceledAndExpired(): boolean {
    if (!this.user || !this.user.membershipEndDate) return false;

    const today = new Date();
    const endDate = new Date(this.user.membershipEndDate);

    return this.user.membershipStatus === 'CANCELED' && endDate <= today;
  }

  cancelMembership() {
  if (!this.user?.membershipID) return;

  if (!confirm('Da li ste sigurni da želite da otkažete članarinu?')) return;

  this.auth.cancelMembership(this.user.membershipID)
    .subscribe({
      next: (res) => {
        alert(res);

        // 🔥 refresh profila
        this.ngOnInit();
      },
      error: (err) => {
        console.log('CANCEL ERROR', err);
      }
    });
}
}