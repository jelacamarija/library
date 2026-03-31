import { Component, inject } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-screen text-red-600">
      Plaćanje je otkazano.
    </div>
  `
})
export class PaymentCancelComponent {

}