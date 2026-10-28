import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { RegisterTenantComponent } from './features/auth/register-tenant.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { StudentsComponent } from './features/students/students.component';
import { StaffComponent } from './features/staff/staff.component';
import { AcademicsComponent } from './features/academics/academics.component';
import { AttendanceComponent } from './features/attendance/attendance.component';
import { ExaminationsComponent } from './features/examinations/examinations.component';
import { FeesComponent } from './features/fees/fees.component';
import { SubscriptionsComponent } from './features/subscriptions/subscriptions.component';
import { AnnouncementsComponent } from './features/announcements/announcements.component';
import { PlatformAdminComponent } from './features/platform-admin/platform-admin.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register-tenant', component: RegisterTenantComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'students', component: StudentsComponent, canActivate: [authGuard] },
  { path: 'staff', component: StaffComponent, canActivate: [authGuard] },
  { path: 'academics', component: AcademicsComponent, canActivate: [authGuard] },
  { path: 'attendance', component: AttendanceComponent, canActivate: [authGuard] },
  { path: 'examinations', component: ExaminationsComponent, canActivate: [authGuard] },
  { path: 'fees', component: FeesComponent, canActivate: [authGuard] },
  { path: 'subscriptions', component: SubscriptionsComponent, canActivate: [authGuard] },
  { path: 'announcements', component: AnnouncementsComponent, canActivate: [authGuard] },
  { path: 'platform-admin', component: PlatformAdminComponent, canActivate: [authGuard], data: { roles: ['PlatformAdmin', '1'] } },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
