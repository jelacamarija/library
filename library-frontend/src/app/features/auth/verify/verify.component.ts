import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-6">
    <div class="max-w-md w-full bg-white p-6 rounded shadow">
      <h1 class="text-2xl font-semibold mb-2">Verifikacija naloga</h1>

      <p class="text-sm text-gray-700" *ngIf="status==='loading'">
        Verifikujem nalog, sačekajte...
      </p>

      <p class="text-sm" *ngIf="status==='success'">
        ✅ Nalog je uspešno verifikovan. Preusmeravam na prijavu...
      </p>

      <p class="text-sm" *ngIf="status==='error'">
        ❌ {{message}}
      </p>

      <button
        *ngIf="status==='error'"
        class="mt-4 w-full border rounded px-3 py-2"
        (click)="goLogin()">
        Idi na prijavu
      </button>
    </div>
  </div>
  `
})
export class VerifyComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  status: 'loading' | 'success' | 'error' = 'loading';
  message = '';

  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');

    if (!code) {
      this.status = 'error';
      this.message = 'Nedostaje verifikacioni kod.';
      return;
    }

    this.http.get(`http://localhost:8080/api/register/verify?code=${encodeURIComponent(code)}`, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          if (res.toLowerCase().includes('uspešno')) {
            this.status = 'success';
            setTimeout(() => this.router.navigate(['/login'], { queryParams: { verified: '1' } }), 1200);
          } else {
            this.status = 'error';
            this.message = res;
          }
        },
        error: () => {
          this.status = 'error';
          this.message = 'Greška pri verifikaciji. Pokušajte ponovo.';
        }
      });
  }

  goLogin() {
    this.router.navigate(['/login']);
  }
}
