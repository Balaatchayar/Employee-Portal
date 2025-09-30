export interface LoginRequest {
  employeeId: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  message: string;
}

export interface EmployeeProfile {
  fullName: string;
  gender: string;
  dob: string;
  email: string;
  phone: string;
  companyCode: string;
  department: string;
  position: string;
  orgUnit: string;
  address: string;
}

export interface ProfileResponse {
  status: string;
  message: string;
  profile: EmployeeProfile;
}

export interface LeaveRecord {
  empId: string;
  startDate: string;
  endDate: string;
  abType: string;
  abDays: string;
  reason: string;
  quotaNumber: string;
  startDateQuota: string;
  endDateQuota: string;
}

export interface LeaveResponse {
  status: string;
  message: string;
  leaves: LeaveRecord[];
}

export interface Session {
  employeeId: string;
  isAuthenticated: boolean;
  loginTime: number;
}