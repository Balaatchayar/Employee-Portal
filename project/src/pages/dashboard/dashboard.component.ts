import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeProfile, LeaveRecord } from '../../models/employee.model';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <h1>Employee Portal</h1>
          <div class="header-actions">
            <span class="welcome-text">Welcome, {{ profile?.fullName || 'Employee' }}</span>
            <button (click)="logout()" class="logout-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div class="dashboard-body">
        <!-- Sidebar -->
        <aside class="sidebar">
          <nav class="sidebar-nav">
            <button 
              *ngFor="let tab of tabs" 
              (click)="activeTab = tab.id"
              [class.active]="activeTab === tab.id"
              class="nav-button"
            >
              <span [innerHTML]="tab.icon"></span>
              {{ tab.label }}
            </button>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <!-- Profile Tab -->
          <div *ngIf="activeTab === 'profile'" class="tab-content">
            <div class="tab-header">
              <h2>Employee Profile</h2>
            </div>
            
            <app-loading-spinner *ngIf="profileLoading"></app-loading-spinner>
            
            <div *ngIf="!profileLoading && profile" class="profile-grid">
              <div class="profile-card">
                <h3>Personal Information</h3>
                <div class="profile-field">
                  <label>Full Name:</label>
                  <span>{{ profile.fullName }}</span>
                </div>
                <div class="profile-field">
                  <label>Gender:</label>
                  <span>{{ profile.gender }}</span>
                </div>
                <div class="profile-field">
                  <label>Date of Birth:</label>
                  <span>{{ profile.dob }}</span>
                </div>
                <div class="profile-field">
                  <label>Email:</label>
                  <span>{{ profile.email }}</span>
                </div>
                <div class="profile-field">
                  <label>Phone:</label>
                  <span>{{ profile.phone }}</span>
                </div>
              </div>

              <div class="profile-card">
                <h3>Work Information</h3>
                <div class="profile-field">
                  <label>Company Code:</label>
                  <span>{{ profile.companyCode }}</span>
                </div>
                <div class="profile-field">
                  <label>Department:</label>
                  <span>{{ profile.department }}</span>
                </div>
                <div class="profile-field">
                  <label>Position:</label>
                  <span>{{ profile.position }}</span>
                </div>
                <div class="profile-field">
                  <label>Organization Unit:</label>
                  <span>{{ profile.orgUnit }}</span>
                </div>
                <div class="profile-field">
                  <label>Address:</label>
                  <span>{{ profile.address }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Leave Tab -->
          <div *ngIf="activeTab === 'leave'" class="tab-content">
            <div class="tab-header">
              <h2>Leave Records</h2>
              <div class="table-controls">
                <input 
                  type="text" 
                  placeholder="Search leaves..." 
                  [(ngModel)]="leaveSearchTerm"
                  (input)="filterLeaves()"
                  class="search-input"
                />
                <select [(ngModel)]="leaveSortBy" (change)="sortLeaves()" class="sort-select">
                  <option value="startDate">Sort by Start Date</option>
                  <option value="endDate">Sort by End Date</option>
                  <option value="abType">Sort by Type</option>
                </select>
              </div>
            </div>

            <app-loading-spinner *ngIf="leaveLoading"></app-loading-spinner>

            <div *ngIf="!leaveLoading && filteredLeaves.length > 0" class="table-container">
              <table class="leave-table">
                <thead>
                  <tr>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Type</th>
                    <th>Days</th>
                    <th></th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let leave of paginatedLeaves">
                    <td>{{ formatDate(leave.startDate) }}</td>
                    <td>{{ formatDate(leave.endDate) }}</td>
                    <td>{{ leave.abType }}</td>
                    <td>{{ leave.abDays }}</td>
                    <td>{{ leave.reason }}</td>
                    <td>
                      <span class="status-badge approved">Approved</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Pagination -->
              <div class="pagination" *ngIf="totalPages > 1">
                <button 
                  (click)="currentPage = currentPage - 1" 
                  [disabled]="currentPage === 1"
                  class="page-button"
                >
                  Previous
                </button>
                <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
                <button 
                  (click)="currentPage = currentPage + 1" 
                  [disabled]="currentPage === totalPages"
                  class="page-button"
                >
                  Next
                </button>
              </div>
            </div>

            <div *ngIf="!leaveLoading && filteredLeaves.length === 0" class="no-data">
              No leave records found.
            </div>
          </div>

          <!-- Payslip Tab -->
          <div *ngIf="activeTab === 'payslip'" class="tab-content">
            <div class="tab-header">
              <h2>Payslip</h2>
              <div class="payslip-controls">
                <select class="payslip-select">
                  <option value="2024-01">January 2024</option>
                  <option value="2024-02">February 2024</option>
                  <option value="2024-03">March 2024</option>
                </select>
                <button (click)="downloadPayslipPdf()" [disabled]="payslipLoading" class="download-button">
                  <svg *ngIf="!payslipLoading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  <span *ngIf="payslipLoading">Loading...</span>
                  <span *ngIf="!payslipLoading">Download PDF</span>
                </button>
              </div>
            </div>

            <div class="payslip-viewer">
              <iframe 
                *ngIf="payslipUrl" 
                [src]="payslipUrl" 
                class="payslip-frame"
                frameborder="0">
              </iframe>
              <div *ngIf="!payslipUrl" class="payslip-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <p>Click "Download PDF" to view your payslip</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }

    .dashboard-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 0 1rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 64px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .welcome-text {
      color: #6b7280;
      font-weight: 500;
    }

    .logout-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.5rem 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .logout-button:hover {
      background: #dc2626;
    }

    .dashboard-body {
      flex: 1;
      display: flex;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .sidebar {
      width: 250px;
      background: white;
      border-right: 1px solid #e5e7eb;
      padding: 1rem;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .nav-button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      color: #6b7280;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .nav-button:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .nav-button.active {
      background: #2563eb;
      color: white;
    }

    .main-content {
      flex: 1;
      padding: 1.5rem;
    }

    .tab-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .tab-header {
      display: flex;
      justify-content: between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      background: #f8fafc;
    }

    .tab-header h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
      flex: 1;
    }

    .table-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-input, .sort-select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .profile-card {
      background: #f8fafc;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .profile-card h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .profile-field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .profile-field:last-child {
      border-bottom: none;
    }

    .profile-field label {
      font-weight: 500;
      color: #6b7280;
    }

    .profile-field span {
      color: #1f2937;
      font-weight: 500;
    }

    .table-container {
      padding: 1.5rem;
    }

    .leave-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }

    .leave-table th,
    .leave-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .leave-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #374151;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.approved {
      background: #d1fae5;
      color: #065f46;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
    }

    .page-button {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .page-button:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .page-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: #6b7280;
      font-weight: 500;
    }

    .payslip-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .payslip-select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .download-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.5rem 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .download-button:hover:not(:disabled) {
      background: #059669;
    }

    .download-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .payslip-viewer {
      padding: 1.5rem;
      height: 600px;
    }

    .payslip-frame {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .payslip-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #6b7280;
      text-align: center;
    }

    .payslip-placeholder svg {
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .no-data {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .dashboard-body {
        flex-direction: column;
      }

      .sidebar {
        width: 100%;
      }

      .sidebar-nav {
        flex-direction: row;
        overflow-x: auto;
      }

      .profile-grid {
        grid-template-columns: 1fr;
      }

      .header-content {
        flex-direction: column;
        height: auto;
        padding: 1rem 0;
        gap: 1rem;
      }

      .tab-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .table-controls {
        width: 100%;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  activeTab = 'profile';
  profile: EmployeeProfile | null = null;
  leaves: LeaveRecord[] = [];
  filteredLeaves: LeaveRecord[] = [];
  paginatedLeaves: LeaveRecord[] = [];
  
  profileLoading = false;
  leaveLoading = false;
  payslipLoading = false;
  
  leaveSearchTerm = '';
  leaveSortBy = 'startDate';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  payslipUrl: any = null;

  tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    },
    {
      id: 'leave',
      label: 'Leave',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
    },
    {
      id: 'payslip',
      label: 'Payslip',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
    }
  ];

  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadLeaves();
  }

  loadProfile(): void {
    const employeeId = this.authService.getCurrentEmployeeId();
    if (!employeeId) return;

    this.profileLoading = true;
    this.employeeService.getProfile(employeeId).subscribe({
      next: (response) => {
        this.profileLoading = false;
        if (response.status === 'X') {
          this.profile = response.profile;
        }
      },
      error: (error) => {
        this.profileLoading = false;
        console.error('Profile load error:', error);
      }
    });
  }

  loadLeaves(): void {
    const employeeId = this.authService.getCurrentEmployeeId();
    if (!employeeId) return;

    this.leaveLoading = true;
    this.employeeService.getLeaveData(employeeId).subscribe({
      next: (response) => {
        this.leaveLoading = false;
        if (response.status === 'X') {
          this.leaves = response.leaves;
          this.filterLeaves();
        }
      },
      error: (error) => {
        this.leaveLoading = false;
        console.error('Leave load error:', error);
      }
    });
  }

  filterLeaves(): void {
    this.filteredLeaves = this.leaves.filter(leave =>
      leave.reason.toLowerCase().includes(this.leaveSearchTerm.toLowerCase()) ||
      leave.abType.toLowerCase().includes(this.leaveSearchTerm.toLowerCase())
    );
    this.sortLeaves();
    this.updatePagination();
  }

  sortLeaves(): void {
    this.filteredLeaves.sort((a, b) => {
      const aValue = a[this.leaveSortBy as keyof LeaveRecord];
      const bValue = b[this.leaveSortBy as keyof LeaveRecord];
      return aValue.localeCompare(bValue);
    });
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredLeaves.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedLeaves = this.filteredLeaves.slice(startIndex, endIndex);
  }

  downloadPayslipPdf(): void {
    const employeeId = this.authService.getCurrentEmployeeId();
    if (!employeeId) {
      console.error('Employee ID not found');
      return;
    }

    this.payslipLoading = true;
    
    this.http.post('http://localhost:3000/api/employee/payslip/pdf', 
      { employeeId: employeeId }, 
      { responseType: 'blob' }
    ).subscribe({
      next: (blob: Blob) => {
        this.payslipLoading = false;
        
        // Create URL for viewing in iframe
        this.payslipUrl = URL.createObjectURL(blob);
        
        // Download the file using FileSaver
        const filename = `payslip_${employeeId}.pdf`;
        saveAs(blob, filename);
      },
      error: (error) => {
        this.payslipLoading = false;
        console.error('Payslip download error:', error);
      }
    });
  }

  downloadPayslip(): void {
    this.payslipLoading = true;
    this.employeeService.getPayslip().subscribe({
      next: (blob) => {
        this.payslipLoading = false;
        
        // Create URL for viewing
        this.payslipUrl = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = this.payslipUrl;
        link.download = 'payslip.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      error: (error) => {
        this.payslipLoading = false;
        console.error('Payslip download error:', error);
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}