import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Announcement } from '../../core/models/models';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Campus Announcements & Notices</h1>
          <p class="text-sm text-slate-500">Publish alerts and circulars to teachers, parents, and student cohorts</p>
        </div>
        <button (click)="showModal = true" class="btn btn-primary">
          + Post Announcement
        </button>
      </div>

      <!-- Feed Grid -->
      <div class="flex flex-col gap-4">
        @for (item of announcements; track item.id) {
          <div class="card" [class.pinned]="item.isPinned">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                @if (item.isPinned) {
                  <span class="badge badge-warning">📌 Pinned</span>
                }
                <span class="badge badge-info">{{ item.targetAudience }}</span>
                <span class="text-xs text-slate-400">• {{ item.publishedAtUtc | date:'medium' }}</span>
              </div>
            </div>
            <h2 class="text-lg font-bold text-slate-900 mb-2">{{ item.title }}</h2>
            <p class="text-sm text-slate-600 leading-relaxed">{{ item.content }}</p>
          </div>
        }
        @if (announcements.length === 0) {
          <div class="card text-center py-8 text-slate-500">
            No active announcements found. Click "Post Announcement" to broadcast news.
          </div>
        }
      </div>

      <!-- Post Announcement Modal -->
      @if (showModal) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="card-header">
              <h2 class="card-title">Broadcast Notice</h2>
              <button (click)="showModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            <form (ngSubmit)="submitAnnouncement()">
              <div class="form-group">
                <label class="form-label">Notice Title *</label>
                <input type="text" class="form-control" placeholder="e.g. Annual Sports Day Schedule" [(ngModel)]="newNotice.title" name="title" required>
              </div>

              <div class="form-group">
                <label class="form-label">Target Audience *</label>
                <select class="form-control" [(ngModel)]="newNotice.targetAudience" name="audience">
                  <option value="All">All Campus (Everyone)</option>
                  <option value="Staff">Teaching & Admin Staff Only</option>
                  <option value="Parents">Parents & Guardians Only</option>
                  <option value="Students">Students Only</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Detailed Notice Content *</label>
                <textarea rows="4" class="form-control" placeholder="Enter notice description..." [(ngModel)]="newNotice.content" name="content" required></textarea>
              </div>

              <div class="form-group">
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" [(ngModel)]="newNotice.isPinned" name="isPinned"> Pin notice to top of feed
                </label>
              </div>

              <div class="flex justify-between items-center mt-6">
                <button type="button" (click)="showModal = false" class="btn btn-outline">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting">
                  {{ submitting ? 'Publishing...' : 'Publish Announcement' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-6 { margin-top: 1.5rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-4 { gap: 1rem; }
    .text-center { text-align: center; }
    .card.pinned {
      border-left: 4px solid var(--primary);
    }
  `]
})
export class AnnouncementsComponent implements OnInit {
  announcements: Announcement[] = [];
  showModal = false;
  submitting = false;

  newNotice = {
    title: '',
    content: '',
    targetAudience: 'All',
    isPinned: false
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.api.getAnnouncements().subscribe(res => {
      if (res.success && res.data) this.announcements = res.data;
    });
  }

  submitAnnouncement(): void {
    this.submitting = true;
    this.api.createAnnouncement(this.newNotice).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.showModal = false;
          this.newNotice.title = '';
          this.newNotice.content = '';
          this.loadAnnouncements();
        }
      },
      error: () => {
        this.submitting = false;
      }
    });
  }
}
