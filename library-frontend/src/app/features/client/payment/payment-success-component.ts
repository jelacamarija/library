import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-screen">
      Procesuiram plaćanje...
    </div>
  `
})
export class PaymentSuccessComponent {

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  ngOnInit() {
  const token = this.route.snapshot.queryParamMap.get('token');

  console.log('PAYPAL TOKEN:', token);

  if (!token) return;

  this.http.get(`/api/payments/success?token=${token}`)
    .subscribe({
      next: (res) => {
        console.log('SUCCESS RESPONSE:', res);

        this.router.navigate(['/client/profile']);
      },
      error: (err) => {
        console.log('SUCCESS ERROR:', err);
      }
    });
}
}