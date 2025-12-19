import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet],
  template: `
    <app-navbar></app-navbar>
    <main class="mx-auto max-w-6xl px-4 py-6">
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppLayoutComponent {}