import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      flex-shrink: 0;
    }
    .top-navbar-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 24px;
      background: #FFFFFF;
      border-bottom: 1px solid #E2E8F0;
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
      width: 100%;
      box-sizing: border-box;
      flex-wrap: nowrap;
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .btn-hamburger-mobile {
      display: none;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid #CBD5E1;
      background: #FFFFFF;
      font-size: 18px;
      color: #334155;
      cursor: pointer;
    }
    @media (max-width: 768px) {
      .btn-hamburger-mobile {
        display: flex;
      }
      .user-profile-meta {
        display: none;
      }
      .top-navbar-bar {
        padding: 0 12px;
      }
    }
    .left-nav-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .inst-pill-container {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      padding: 6px 14px;
      border-radius: 10px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
    }
    .inst-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .inst-dropdown {
      border: none;
      background: transparent;
      font-size: 13px;
      font-weight: 700;
      color: #1E293B;
      outline: none;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-logo-manage {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: #EFF6FF;
      color: #1E5BF6;
      border: 1px solid #BFDBFE;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }
    .btn-logo-manage:hover {
      background: #DBEAFE;
      transform: translateY(-1px);
    }
    .user-section-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .user-avatar-bubble {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1E5BF6 0%, #3B82F6 100%);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 2px 6px rgba(30, 91, 246, 0.3);
      flex-shrink: 0;
    }
    .user-profile-meta {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .user-fullname {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
      line-height: 1.2;
    }
    .user-role-badge {
      font-size: 11px;
      font-weight: 700;
      color: #1E5BF6;
      background: #EFF6FF;
      border: 1px solid #DBEAFE;
      padding: 2px 10px;
      border-radius: 9999px;
      display: inline-block;
      margin-top: 3px;
      letter-spacing: 0.2px;
    }
    .btn-signout-nav {
      padding: 7px 16px;
      border: 1px solid #CBD5E1;
      background: #FFFFFF;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-signout-nav:hover {
      background: #FEF2F2;
      color: #EF4444;
      border-color: #FECACA;
      transform: translateY(-1px);
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-box {
      background: #FFFFFF;
      border-radius: 16px;
      width: 100%;
      max-width: 580px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid #E2E8F0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #F1F5F9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #F8FAFC;
    }
    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      max-height: 80vh;
      overflow-y: auto;
    }
    .preview-section {
      display: flex;
      gap: 12px;
    }
    .preview-card {
      flex: 1;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .preset-badge-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
      border: 2px solid #E2E8F0;
      border-radius: 12px;
      cursor: pointer;
      background: #F8FAFC;
      transition: all 0.15s ease;
    }
    .preset-badge-item:hover {
      border-color: #3B82F6;
      background: #EFF6FF;
      transform: translateY(-2px);
    }
    .preset-badge-item.active {
      border-color: #1E5BF6;
      background: #EFF6FF;
      box-shadow: 0 0 0 2px rgba(30, 91, 246, 0.2);
    }
    .upload-dropzone {
      border: 2px dashed #CBD5E1;
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
      background: #F8FAFC;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .upload-dropzone:hover {
      border-color: #1E5BF6;
      background: #EFF6FF;
    }
  `],
  template: `
    <header class="top-navbar-bar">
      <!-- Left: Active Institution Selector & Logo Manage Button -->
      <div class="left-nav-group">
        <button type="button" (click)="authService.toggleMobileSidebar()" class="btn-hamburger-mobile" title="Toggle menu">
          ☰
        </button>
        <div class="inst-pill-container">
          @if (authService.getEffectiveLogo()) {
            <img [src]="authService.getEffectiveLogo()" alt="Logo" style="width: 26px; height: 26px; object-fit: contain; border-radius: 6px; background: white; padding: 1px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
          } @else {
            <span class="inst-label" style="font-size: 16px;">🎓</span>
          }
          <span class="inst-label">Institution:</span>
          <select 
            class="inst-dropdown"
            [value]="authService.getSelectedInstitutionId()"
            (change)="onInstitutionChange($event)">
            @for (inst of authService.currentUser()?.availableInstitutions; track inst.institutionId) {
              <option [value]="inst.institutionId">{{ inst.name }} ({{ inst.code }})</option>
            }
          </select>
        </div>

        <!-- Quick Logo Upload / Change Button -->
        <button type="button" (click)="openLogoModal()" class="btn-logo-manage" title="Upload or change school logo">
          <span>📷</span>
          <span>School Logo</span>
        </button>
      </div>

      <!-- Right: User Info & Sign out -->
      <div class="user-section-group">
        <div class="user-avatar-bubble">
          {{ getUserInitials() }}
        </div>
        <div class="user-profile-meta">
          <div class="user-fullname">{{ authService.currentUser()?.fullName || 'Administrator' }}</div>
          <div class="user-role-badge">{{ getRoleDisplayName() }}</div>
        </div>
        <button (click)="logout()" class="btn-signout-nav" title="Sign out of system">
          <span>🚪</span>
          <span>Sign out</span>
        </button>
      </div>
    </header>

    <!-- Institution Logo Manager Modal -->
    @if (authService.isLogoModalOpen()) {
      <div class="modal-backdrop" (click)="closeLogoModal()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          
          <div class="modal-header">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #0F172A; margin: 0;">
                🏫 Institution Logo Manager
              </h3>
              <p style="font-size: 12px; color: #64748B; margin: 2px 0 0 0;">
                शाळा किंवा कॉलेजचा लोगो निवडा / अपलोड करा (Navbar & Sidebar Logo)
              </p>
            </div>
            <button (click)="closeLogoModal()" style="border: none; background: transparent; font-size: 20px; color: #94A3B8; cursor: pointer; padding: 4px;">
              ✕
            </button>
          </div>

          <div class="modal-body">
            <!-- 1. Live Preview Section -->
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 8px; display: block;">
                Logo Live Preview (कसे दिसेल):
              </label>
              <div class="preview-section">
                <!-- Sidebar Dark Preview -->
                <div class="preview-card" style="background: #0F172A; color: white; border: 1px solid #1E293B;">
                  <span style="font-size: 10px; color: #94A3B8; font-weight: 600;">Sidebar View</span>
                  @if (previewLogo) {
                    <img [src]="previewLogo" alt="Preview" style="width: 44px; height: 44px; object-fit: contain; border-radius: 10px; background: white; padding: 3px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
                  } @else {
                    <div style="font-size: 28px;">🎓</div>
                  }
                  <span style="font-size: 11px; font-weight: 700;">{{ authService.tenantName() }}</span>
                </div>
                <!-- Navbar Light Preview -->
                <div class="preview-card" style="background: #FFFFFF; border: 1px solid #E2E8F0; color: #0F172A;">
                  <span style="font-size: 10px; color: #64748B; font-weight: 600;">Navbar View</span>
                  @if (previewLogo) {
                    <img [src]="previewLogo" alt="Preview" style="width: 32px; height: 32px; object-fit: contain; border-radius: 6px; background: white; padding: 2px; border: 1px solid #E2E8F0;" />
                  } @else {
                    <div style="font-size: 22px;">🎓</div>
                  }
                  <span style="font-size: 11px; font-weight: 700;">rgip (1010-MAIN)</span>
                </div>
              </div>
            </div>

            <!-- 2. Option A: Upload from Computer -->
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; display: block;">
                1. संगणकावरून फोटो अपलोड करा (Upload Image File):
              </label>
              <input 
                type="file" 
                #fileInput 
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" 
                (change)="onFileSelected($event)" 
                style="display: none;" />
              <div class="upload-dropzone" (click)="fileInput.click()">
                <div style="font-size: 26px; margin-bottom: 4px;">📁</div>
                <div style="font-weight: 700; font-size: 13px; color: #1E5BF6;">
                  Click to Choose File from Computer
                </div>
                <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                  Supports PNG, JPG, JPEG, WEBP or SVG (Recommended: 200x200 or square)
                </div>
              </div>
            </div>

            <!-- 3. Option B: Ready-made Preset Badges -->
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; display: block;">
                2. किंवा रेडीमेड लोगो निवडा (Or Select a Preset Crest):
              </label>
              <div class="preset-grid">
                @for (preset of presets; track preset.id) {
                  <div 
                    class="preset-badge-item"
                    [class.active]="previewLogo === preset.svg"
                    (click)="selectPreset(preset.svg)"
                    [title]="preset.title">
                    <img [src]="preset.svg" [alt]="preset.title" style="width: 40px; height: 40px; object-fit: contain;" />
                    <span style="font-size: 10px; font-weight: 700; color: #475569; margin-top: 6px; text-align: center;">
                      {{ preset.title }}
                    </span>
                  </div>
                }
              </div>
            </div>

            <!-- 4. Option C: Direct Image URL -->
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; display: block;">
                3. किंवा ऑनलाइन इमेज URL टाका (Or Enter Image URL):
              </label>
              <div style="display: flex; gap: 8px;">
                <input 
                  type="text" 
                  [(ngModel)]="urlInput"
                  placeholder="https://example.com/logo.png"
                  style="flex: 1; padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 12px; outline: none;" />
                <button 
                  type="button" 
                  (click)="applyUrl()"
                  style="padding: 8px 14px; background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;">
                  Apply
                </button>
              </div>
            </div>

            <!-- Success Alert -->
            @if (successMessage) {
              <div style="padding: 10px 14px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; color: #065F46; font-size: 12px; font-weight: 600;">
                {{ successMessage }}
              </div>
            }

          </div>

          <!-- Modal Footer Actions -->
          <div style="padding: 1rem 1.5rem; background: #F8FAFC; border-top: 1px solid #F1F5F9; display: flex; align-items: center; justify-content: space-between;">
            <button 
              type="button" 
              (click)="removeLogo()" 
              style="padding: 8px 14px; background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;">
              Reset to Default (🎓)
            </button>
            <div style="display: flex; gap: 10px;">
              <button 
                type="button" 
                (click)="closeLogoModal()" 
                style="padding: 8px 16px; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 12px; font-weight: 700; color: #475569; cursor: pointer;">
                Cancel
              </button>
              <button 
                type="button" 
                (click)="saveLogo()" 
                [disabled]="!previewLogo"
                style="padding: 8px 20px; background: linear-gradient(135deg, #1E5BF6 0%, #2563EB 100%); color: #FFFFFF; border: none; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 8px rgba(30, 91, 246, 0.35);"
                [style.opacity]="!previewLogo ? '0.6' : '1'">
                Save & Apply Logo
              </button>
            </div>
          </div>

        </div>
      </div>
    }
  `
})
export class NavbarComponent {
  previewLogo: string | null = null;
  urlInput = '';
  successMessage = '';

  presets = [
    {
      id: 'shield',
      title: 'Academic Shield',
      svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231E5BF6"/><stop offset="100%" stop-color="%230F2B82"/></linearGradient></defs><path d="M50 5 L88 20 C88 55 50 92 50 92 C50 92 12 55 12 20 Z" fill="url(%23g1)" stroke="%23F59E0B" stroke-width="4"/><path d="M50 25 L75 37 L50 49 L25 37 Z" fill="%23FFFFFF"/><path d="M35 44 L35 60 C35 60 42 66 50 66 C58 66 65 60 65 60 L65 44" fill="none" stroke="%23FFFFFF" stroke-width="3"/><circle cx="75" cy="50" r="3" fill="%23F59E0B"/></svg>'
    },
    {
      id: 'crest',
      title: 'Golden Crest',
      svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="%23047857" stroke="%23FBBF24" stroke-width="5"/><path d="M50 30 L50 70 M50 70 C42 64 28 64 22 68 L22 34 C28 30 42 30 50 35 C58 30 72 30 78 34 L78 68 C72 64 58 64 50 70 Z" fill="%23FEF3C7" stroke="%23D97706" stroke-width="2.5"/><polygon points="50,18 53,24 60,25 55,30 56,37 50,33 44,37 45,30 40,25 47,24" fill="%23FBBF24"/></svg>'
    },
    {
      id: 'tech',
      title: 'Tech Academy',
      svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="20" fill="%234F46E5" stroke="%23818CF8" stroke-width="4"/><path d="M50 22 L76 38 L76 68 L50 84 L24 68 L24 38 Z" fill="none" stroke="%23A5B4FC" stroke-width="3"/><path d="M50 35 L65 45 L65 62 L50 71 L35 62 L35 45 Z" fill="%23FFFFFF"/><circle cx="50" cy="53" r="5" fill="%234F46E5"/></svg>'
    },
    {
      id: 'heritage',
      title: 'Heritage Pillar',
      svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="%23881337" stroke="%23FDE047" stroke-width="5"/><path d="M26 36 L74 36 L50 22 Z" fill="%23FDE047"/><rect x="30" y="40" width="6" height="26" fill="%23FFFFFF"/><rect x="42" y="40" width="6" height="26" fill="%23FFFFFF"/><rect x="52" y="40" width="6" height="26" fill="%23FFFFFF"/><rect x="64" y="40" width="6" height="26" fill="%23FFFFFF"/><rect x="24" y="68" width="52" height="6" rx="2" fill="%23FDE047"/></svg>'
    }
  ];

  constructor(public authService: AuthService) {}

  getUserInitials(): string {
    const name = this.authService.currentUser()?.fullName || 'AD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getRoleDisplayName(): string {
    const role = this.authService.currentUser()?.role;
    const r = role !== undefined && role !== null ? String(role).trim().toLowerCase() : '';
    if (r === '1' || r === 'platformadmin') return 'Platform Admin';
    if (r === '2' || r === 'institutionadmin') return 'Institution Admin';
    if (r === '3' || r === 'teacher') return 'Faculty Teacher';
    if (r === '4' || r === 'accountant') return 'Accountant';
    if (r === '5' || r === 'student') return 'Student';
    if (r === '6' || r === 'parent') return 'Parent';
    if (r === '7' || r === 'director') return 'Director';
    if (r === '8' || r === 'principal') return 'Principal';
    if (r === '9' || r === 'viceprincipal') return 'Vice Principal';
    if (r === '10' || r === 'headofdepartment') return 'HOD';
    return 'Institution Admin';
  }

  onInstitutionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.authService.switchInstitution(target.value);
    }
  }

  openLogoModal(): void {
    this.previewLogo = this.authService.getEffectiveLogo();
    this.urlInput = (this.previewLogo && !this.previewLogo.startsWith('data:')) ? this.previewLogo : '';
    this.successMessage = '';
    this.authService.openLogoModal();
  }

  closeLogoModal(): void {
    this.authService.closeLogoModal();
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('फाइल 5MB पेक्षा लहान असावी (File size must be under 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewLogo = e.target.result;
      this.successMessage = 'फोटो लोड झाला! खाली "Save & Apply Logo" वर क्लिक करा.';
    };
    reader.readAsDataURL(file);
  }

  selectPreset(svg: string): void {
    this.previewLogo = svg;
    this.successMessage = 'रेडीमेड लोगो निवडला! खाली "Save & Apply Logo" वर क्लिक करा.';
  }

  applyUrl(): void {
    if (!this.urlInput.trim()) return;
    this.previewLogo = this.urlInput.trim();
    this.successMessage = 'URL लागू झाली! खाली "Save & Apply Logo" वर क्लिक करा.';
  }

  saveLogo(): void {
    if (!this.previewLogo) return;
    this.authService.setCustomLogo(this.previewLogo);
    this.successMessage = '✅ लोगो यशस्वीरित्या सेव्ह झाला! (Logo Applied Successfully!)';
    setTimeout(() => {
      this.closeLogoModal();
      this.successMessage = '';
    }, 1000);
  }

  removeLogo(): void {
    this.authService.removeCustomLogo();
    this.previewLogo = null;
    this.urlInput = '';
    this.successMessage = '✅ लोगो रिसेट झाला (Default Graduation Cap Applied)';
    setTimeout(() => {
      this.closeLogoModal();
      this.successMessage = '';
    }, 1000);
  }

  logout(): void {
    this.authService.logout();
  }
}
