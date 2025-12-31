/**
 * Shared types for joined data from Supabase queries
 * These types extend base table types with commonly joined relations
 */

import { Tables } from '@/integrations/supabase/types';

// Base table types - re-export for convenience
export type Employee = Tables<'employees'>;
export type Department = Tables<'departments'>;
export type LeaveRequest = Tables<'leave_requests'>;
export type LeaveType = Tables<'leave_types'>;
export type PerformanceReview = Tables<'performance_reviews'>;
export type TimeEntry = Tables<'time_entries'>;
export type Job = Tables<'jobs'>;
export type Candidate = Tables<'candidates'>;
export type Expense = Tables<'expenses'>;
export type ExpenseCategory = Tables<'expense_categories'>;

// Common nested types for joins
export interface EmployeeBasic {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  job_title: string | null;
  email: string;
}

export interface EmployeeWithDepartment extends EmployeeBasic {
  department: DepartmentBasic | null;
}

export interface DepartmentBasic {
  id: string;
  name: string;
  code: string | null;
}

export interface LeaveTypeBasic {
  id: string;
  name: string;
  code: string;
  color: string | null;
}

export interface JobBasic {
  id: string;
  title: string;
  slug: string;
}

// Joined types for common queries
export interface LeaveRequestWithRelations extends LeaveRequest {
  employee: EmployeeBasic | null;
  leave_type: LeaveTypeBasic | null;
  reviewed_by_employee?: EmployeeBasic | null;
}

export interface PerformanceReviewWithRelations extends PerformanceReview {
  employee: EmployeeWithDepartment | null;
  reviewer: EmployeeBasic | null;
}

export interface TimeEntryWithEmployee extends TimeEntry {
  employee: EmployeeBasic | null;
}

export interface JobWithDepartment extends Job {
  department: DepartmentBasic | null;
  hiring_manager?: EmployeeBasic | null;
}

export interface CandidateWithJob extends Candidate {
  job: JobBasic | null;
}

export interface DepartmentWithManager extends Department {
  manager: EmployeeBasic | null;
}
