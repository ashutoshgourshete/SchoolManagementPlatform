import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent],
  template: `
    @if (authService.isLoggedIn()) {
      <div class="app-shell">
        <app-sidebar></app-sidebar>
        <div class="workspace-wrapper">
          <div class="workspace-card">
            <app-navbar></app-navbar>
            <main class="workspace-content">
              <router-outlet></router-outlet>
            </main>
          </div>
        </div>
      </div>
    } @else {
      <router-outlet></router-outlet>
    }
  `
})
export class AppComponent {
  constructor(public authService: AuthService) {}
}
