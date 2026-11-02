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
      <div class="app-container" style="display: flex; height: 100vh; width: 100vw; overflow: hidden; background-color: #F4F6FB;">
        <app-sidebar></app-sidebar>
        <div class="main-content" style="flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; background-color: #F4F6FB;">
          <app-navbar></app-navbar>
          <main style="flex: 1; overflow-y: auto; background-color: #F4F6FB; padding: 28px 36px 48px 36px; box-sizing: border-box;">
            <div style="max-width: 1440px; margin: 0 auto; width: 100%;">
              <router-outlet></router-outlet>
            </div>
          </main>
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
