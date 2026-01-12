export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance_summaries: {
        Row: {
          absent_days: number | null
          company_id: string
          created_at: string
          days_late: number | null
          days_present: number | null
          employee_id: string
          full_day_absents: number | null
          half_days: number | null
          id: string
          is_locked: boolean | null
          late_days: number | null
          late_minutes: number | null
          metadata: Json | null
          overtime_hours: number | null
          paid_leave_days: number | null
          period_end: string
          period_start: string
          present_days: number | null
          total_days: number | null
          total_hours: number | null
          total_working_days: number | null
          total_working_hours: number | null
          unpaid_leave_days: number | null
          updated_at: string
        }
        Insert: {
          absent_days?: number | null
          company_id: string
          created_at?: string
          days_late?: number | null
          days_present?: number | null
          employee_id: string
          full_day_absents?: number | null
          half_days?: number | null
          id?: string
          is_locked?: boolean | null
          late_days?: number | null
          late_minutes?: number | null
          metadata?: Json | null
          overtime_hours?: number | null
          paid_leave_days?: number | null
          period_end: string
          period_start: string
          present_days?: number | null
          total_days?: number | null
          total_hours?: number | null
          total_working_days?: number | null
          total_working_hours?: number | null
          unpaid_leave_days?: number | null
          updated_at?: string
        }
        Update: {
          absent_days?: number | null
          company_id?: string
          created_at?: string
          days_late?: number | null
          days_present?: number | null
          employee_id?: string
          full_day_absents?: number | null
          half_days?: number | null
          id?: string
          is_locked?: boolean | null
          late_days?: number | null
          late_minutes?: number | null
          metadata?: Json | null
          overtime_hours?: number | null
          paid_leave_days?: number | null
          period_end?: string
          period_start?: string
          present_days?: number | null
          total_days?: number | null
          total_hours?: number | null
          total_working_days?: number | null
          total_working_hours?: number | null
          unpaid_leave_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_summaries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_summaries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          company_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          company_id: string
          cover_letter: string | null
          created_at: string
          email: string
          first_name: string
          hired_employee_id: string | null
          id: string
          interview_notes: Json | null
          job_id: string
          last_name: string
          linkedin_url: string | null
          metadata: Json | null
          notes: Json | null
          phone: string | null
          portfolio_url: string | null
          rating: number | null
          referral_employee_id: string | null
          rejected_reason: string | null
          resume_url: string | null
          source: string | null
          status: Database["public"]["Enums"]["candidate_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          cover_letter?: string | null
          created_at?: string
          email: string
          first_name: string
          hired_employee_id?: string | null
          id?: string
          interview_notes?: Json | null
          job_id: string
          last_name: string
          linkedin_url?: string | null
          metadata?: Json | null
          notes?: Json | null
          phone?: string | null
          portfolio_url?: string | null
          rating?: number | null
          referral_employee_id?: string | null
          rejected_reason?: string | null
          resume_url?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          cover_letter?: string | null
          created_at?: string
          email?: string
          first_name?: string
          hired_employee_id?: string | null
          id?: string
          interview_notes?: Json | null
          job_id?: string
          last_name?: string
          linkedin_url?: string | null
          metadata?: Json | null
          notes?: Json | null
          phone?: string | null
          portfolio_url?: string | null
          rating?: number | null
          referral_employee_id?: string | null
          rejected_reason?: string | null
          resume_url?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_hired_employee_id_fkey"
            columns: ["hired_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_referral_employee_id_fkey"
            columns: ["referral_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: Json | null
          created_at: string
          date_format: string | null
          email: string | null
          esi_employee_rate: number | null
          esi_employer_rate: number | null
          esi_enabled: boolean | null
          fiscal_year_start: number | null
          id: string
          industry: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          pf_employee_rate: number | null
          pf_employer_rate: number | null
          pf_enabled: boolean | null
          phone: string | null
          professional_tax_enabled: boolean | null
          settings: Json | null
          size_range: string | null
          slug: string
          timezone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string
          date_format?: string | null
          email?: string | null
          esi_employee_rate?: number | null
          esi_employer_rate?: number | null
          esi_enabled?: boolean | null
          fiscal_year_start?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          pf_employee_rate?: number | null
          pf_employer_rate?: number | null
          pf_enabled?: boolean | null
          phone?: string | null
          professional_tax_enabled?: boolean | null
          settings?: Json | null
          size_range?: string | null
          slug: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string
          date_format?: string | null
          email?: string | null
          esi_employee_rate?: number | null
          esi_employer_rate?: number | null
          esi_enabled?: boolean | null
          fiscal_year_start?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          pf_employee_rate?: number | null
          pf_employer_rate?: number | null
          pf_enabled?: boolean | null
          phone?: string | null
          professional_tax_enabled?: boolean | null
          settings?: Json | null
          size_range?: string | null
          slug?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_creation_links: {
        Row: {
          created_at: string
          created_by: string
          current_uses: number | null
          email: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          metadata: Json | null
          name: string | null
          plan_id: string | null
          token: string
          updated_at: string
          used_by_company_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          current_uses?: number | null
          email?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          name?: string | null
          plan_id?: string | null
          token: string
          updated_at?: string
          used_by_company_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          current_uses?: number | null
          email?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          name?: string | null
          plan_id?: string | null
          token?: string
          updated_at?: string
          used_by_company_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_creation_links_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_creation_links_used_by_company_id_fkey"
            columns: ["used_by_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_domains: {
        Row: {
          company_id: string
          created_at: string
          custom_domain: string | null
          dns_records: Json | null
          dns_verified_at: string | null
          hosting_provider: string | null
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          metadata: Json | null
          ssl_verified_at: string | null
          subdomain: string | null
          updated_at: string
          vercel_error: string | null
          vercel_status: string | null
          vercel_verified: boolean | null
        }
        Insert: {
          company_id: string
          created_at?: string
          custom_domain?: string | null
          dns_records?: Json | null
          dns_verified_at?: string | null
          hosting_provider?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          ssl_verified_at?: string | null
          subdomain?: string | null
          updated_at?: string
          vercel_error?: string | null
          vercel_status?: string | null
          vercel_verified?: boolean | null
        }
        Update: {
          company_id?: string
          created_at?: string
          custom_domain?: string | null
          dns_records?: Json | null
          dns_verified_at?: string | null
          hosting_provider?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          ssl_verified_at?: string | null
          subdomain?: string | null
          updated_at?: string
          vercel_error?: string | null
          vercel_status?: string | null
          vercel_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "company_domains_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_subscriptions: {
        Row: {
          billing_interval: Database["public"]["Enums"]["plan_interval"]
          canceled_at: string | null
          company_id: string
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          metadata: Json | null
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_interval?: Database["public"]["Enums"]["plan_interval"]
          canceled_at?: string | null
          company_id: string
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_interval?: Database["public"]["Enums"]["plan_interval"]
          canceled_at?: string | null
          company_id?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          is_primary: boolean | null
          joined_at: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          company_id: string
          cost_center: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          company_id: string
          cost_center?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          company_id?: string
          cost_center?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_departments_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          allowed_for_employee_upload: boolean | null
          allowed_mime_types: string[] | null
          code: string
          company_id: string
          created_at: string
          description: string | null
          has_expiry: boolean | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          max_file_size_mb: number | null
          name: string
          reminder_days: number | null
          updated_at: string
        }
        Insert: {
          allowed_for_employee_upload?: boolean | null
          allowed_mime_types?: string[] | null
          code: string
          company_id: string
          created_at?: string
          description?: string | null
          has_expiry?: boolean | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_file_size_mb?: number | null
          name: string
          reminder_days?: number | null
          updated_at?: string
        }
        Update: {
          allowed_for_employee_upload?: boolean | null
          allowed_mime_types?: string[] | null
          code?: string
          company_id?: string
          created_at?: string
          description?: string | null
          has_expiry?: boolean | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_file_size_mb?: number | null
          name?: string
          reminder_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          body: string | null
          clicked_at: string | null
          company_id: string | null
          created_at: string
          error_message: string | null
          from_email: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          provider: string | null
          provider_message_id: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
          to_email: string
        }
        Insert: {
          body?: string | null
          clicked_at?: string | null
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          from_email?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
          to_email: string
        }
        Update: {
          body?: string | null
          clicked_at?: string | null
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          from_email?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          subject: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          subject: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          subject?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          document_type_id: string
          employee_id: string
          expiry_date: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_latest_version: boolean | null
          is_verified: boolean | null
          issue_date: string | null
          metadata: Json | null
          mime_type: string | null
          parent_document_id: string | null
          title: string
          updated_at: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          version_number: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          document_type_id: string
          employee_id: string
          expiry_date?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_latest_version?: boolean | null
          is_verified?: boolean | null
          issue_date?: string | null
          metadata?: Json | null
          mime_type?: string | null
          parent_document_id?: string | null
          title: string
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version_number?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          document_type_id?: string
          employee_id?: string
          expiry_date?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_latest_version?: boolean | null
          is_verified?: boolean | null
          issue_date?: string | null
          metadata?: Json | null
          mime_type?: string | null
          parent_document_id?: string | null
          title?: string
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "employee_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_shift_assignments: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          effective_from: string
          effective_to: string | null
          employee_id: string
          id: string
          is_active: boolean | null
          is_temporary: boolean | null
          metadata: Json | null
          shift_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          effective_from: string
          effective_to?: string | null
          employee_id: string
          id?: string
          is_active?: boolean | null
          is_temporary?: boolean | null
          metadata?: Json | null
          shift_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          employee_id?: string
          id?: string
          is_active?: boolean | null
          is_temporary?: boolean | null
          metadata?: Json | null
          shift_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_shift_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_shift_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: Json | null
          bank_details: Json | null
          benefits: Json | null
          certifications: Json | null
          company_id: string
          created_at: string
          date_of_birth: string | null
          department_id: string | null
          email: string
          emergency_contact: Json | null
          employee_number: string
          employment_status: Database["public"]["Enums"]["employment_status"]
          employment_type: Database["public"]["Enums"]["employment_type"]
          first_name: string
          gender: string | null
          hire_date: string
          id: string
          job_title: string | null
          last_name: string
          manager_id: string | null
          metadata: Json | null
          national_id: string | null
          nationality: string | null
          personal_email: string | null
          phone: string | null
          probation_end_date: string | null
          salary: number | null
          salary_currency: string | null
          skills: string[] | null
          tax_info: Json | null
          termination_date: string | null
          termination_reason: string | null
          updated_at: string
          user_id: string | null
          work_location: string | null
        }
        Insert: {
          address?: Json | null
          bank_details?: Json | null
          benefits?: Json | null
          certifications?: Json | null
          company_id: string
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          email: string
          emergency_contact?: Json | null
          employee_number: string
          employment_status?: Database["public"]["Enums"]["employment_status"]
          employment_type?: Database["public"]["Enums"]["employment_type"]
          first_name: string
          gender?: string | null
          hire_date: string
          id?: string
          job_title?: string | null
          last_name: string
          manager_id?: string | null
          metadata?: Json | null
          national_id?: string | null
          nationality?: string | null
          personal_email?: string | null
          phone?: string | null
          probation_end_date?: string | null
          salary?: number | null
          salary_currency?: string | null
          skills?: string[] | null
          tax_info?: Json | null
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string
          user_id?: string | null
          work_location?: string | null
        }
        Update: {
          address?: Json | null
          bank_details?: Json | null
          benefits?: Json | null
          certifications?: Json | null
          company_id?: string
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string
          emergency_contact?: Json | null
          employee_number?: string
          employment_status?: Database["public"]["Enums"]["employment_status"]
          employment_type?: Database["public"]["Enums"]["employment_type"]
          first_name?: string
          gender?: string | null
          hire_date?: string
          id?: string
          job_title?: string | null
          last_name?: string
          manager_id?: string | null
          metadata?: Json | null
          national_id?: string | null
          nationality?: string | null
          personal_email?: string | null
          phone?: string | null
          probation_end_date?: string | null
          salary?: number | null
          salary_currency?: string | null
          skills?: string[] | null
          tax_info?: Json | null
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string
          user_id?: string | null
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          created_by: string | null
          current_value: number | null
          description: string | null
          due_date: string | null
          employee_id: string
          id: string
          metadata: Json | null
          parent_goal_id: string | null
          priority: string | null
          progress: number | null
          start_date: string | null
          status: string
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          employee_id: string
          id?: string
          metadata?: Json | null
          parent_goal_id?: string | null
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          employee_id?: string
          id?: string
          metadata?: Json | null
          parent_goal_id?: string | null
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          candidate_id: string
          company_id: string
          created_at: string
          duration_minutes: number | null
          feedback: Json | null
          id: string
          interview_type: Database["public"]["Enums"]["interview_type"]
          interviewer_ids: string[] | null
          job_id: string
          location: string | null
          meeting_url: string | null
          metadata: Json | null
          notes: string | null
          rating: number | null
          recommendation: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          company_id: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: Json | null
          id?: string
          interview_type?: Database["public"]["Enums"]["interview_type"]
          interviewer_ids?: string[] | null
          job_id: string
          location?: string | null
          meeting_url?: string | null
          metadata?: Json | null
          notes?: string | null
          rating?: number | null
          recommendation?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          company_id?: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: Json | null
          id?: string
          interview_type?: Database["public"]["Enums"]["interview_type"]
          interviewer_ids?: string[] | null
          job_id?: string
          location?: string | null
          meeting_url?: string | null
          metadata?: Json | null
          notes?: string | null
          rating?: number | null
          recommendation?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          closes_at: string | null
          company_id: string
          created_at: string
          department_id: string | null
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          hiring_manager_id: string | null
          id: string
          is_remote: boolean | null
          location: string | null
          metadata: Json | null
          openings: number | null
          published_at: string | null
          requirements: string | null
          responsibilities: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          show_salary: boolean | null
          slug: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          company_id: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          hiring_manager_id?: string | null
          id?: string
          is_remote?: boolean | null
          location?: string | null
          metadata?: Json | null
          openings?: number | null
          published_at?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          show_salary?: boolean | null
          slug: string
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          company_id?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          hiring_manager_id?: string | null
          id?: string
          is_remote?: boolean | null
          location?: string | null
          metadata?: Json | null
          openings?: number | null
          published_at?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          show_salary?: boolean | null
          slug?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_request_days: {
        Row: {
          company_id: string
          created_at: string
          date: string
          day_type: string
          id: string
          leave_request_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          date: string
          day_type?: string
          id?: string
          leave_request_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          date?: string
          day_type?: string
          id?: string
          leave_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_request_days_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_request_days_leave_request_id_fkey"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          company_id: string
          created_at: string
          document_urls: string[] | null
          employee_id: string
          end_date: string
          end_half_day: boolean | null
          id: string
          leave_type_id: string
          metadata: Json | null
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          start_half_day: boolean | null
          status: Database["public"]["Enums"]["leave_status"]
          total_days: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          document_urls?: string[] | null
          employee_id: string
          end_date: string
          end_half_day?: boolean | null
          id?: string
          leave_type_id: string
          metadata?: Json | null
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          start_half_day?: boolean | null
          status?: Database["public"]["Enums"]["leave_status"]
          total_days: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          document_urls?: string[] | null
          employee_id?: string
          end_date?: string
          end_half_day?: boolean | null
          id?: string
          leave_type_id?: string
          metadata?: Json | null
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          start_half_day?: boolean | null
          status?: Database["public"]["Enums"]["leave_status"]
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          accrual_rate: number | null
          carry_over_limit: number | null
          code: string
          color: string | null
          company_id: string
          created_at: string
          default_days: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          max_consecutive_days: number | null
          min_notice_days: number | null
          name: string
          requires_approval: boolean | null
          requires_document: boolean | null
          updated_at: string
        }
        Insert: {
          accrual_rate?: number | null
          carry_over_limit?: number | null
          code: string
          color?: string | null
          company_id: string
          created_at?: string
          default_days?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          max_consecutive_days?: number | null
          min_notice_days?: number | null
          name: string
          requires_approval?: boolean | null
          requires_document?: boolean | null
          updated_at?: string
        }
        Update: {
          accrual_rate?: number | null
          carry_over_limit?: number | null
          code?: string
          color?: string | null
          company_id?: string
          created_at?: string
          default_days?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          max_consecutive_days?: number | null
          min_notice_days?: number | null
          name?: string
          requires_approval?: boolean | null
          requires_document?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_company_requests: {
        Row: {
          company_id: string
          created_at: string
          id: string
          reason: string | null
          requested_count: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          reason?: string | null
          requested_count?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          requested_count?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_company_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          metadata: Json | null
          read_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          allowances: Json | null
          base_salary: number
          benefits_deductions: number | null
          bonuses: number | null
          commissions: number | null
          company_id: string
          created_at: string
          employee_id: string
          employer_contributions: Json | null
          gross_pay: number
          hours_worked: number | null
          id: string
          metadata: Json | null
          net_pay: number
          notes: string | null
          other_deductions: Json | null
          overtime_hours: number | null
          overtime_pay: number | null
          payroll_run_id: string
          tax_deductions: number | null
          total_deductions: number | null
          total_employer_cost: number | null
          updated_at: string
        }
        Insert: {
          allowances?: Json | null
          base_salary?: number
          benefits_deductions?: number | null
          bonuses?: number | null
          commissions?: number | null
          company_id: string
          created_at?: string
          employee_id: string
          employer_contributions?: Json | null
          gross_pay?: number
          hours_worked?: number | null
          id?: string
          metadata?: Json | null
          net_pay?: number
          notes?: string | null
          other_deductions?: Json | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payroll_run_id: string
          tax_deductions?: number | null
          total_deductions?: number | null
          total_employer_cost?: number | null
          updated_at?: string
        }
        Update: {
          allowances?: Json | null
          base_salary?: number
          benefits_deductions?: number | null
          bonuses?: number | null
          commissions?: number | null
          company_id?: string
          created_at?: string
          employee_id?: string
          employer_contributions?: Json | null
          gross_pay?: number
          hours_worked?: number | null
          id?: string
          metadata?: Json | null
          net_pay?: number
          notes?: string | null
          other_deductions?: Json | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payroll_run_id?: string
          tax_deductions?: number | null
          total_deductions?: number | null
          total_employer_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          currency: string | null
          employee_count: number | null
          id: string
          metadata: Json | null
          name: string
          notes: string | null
          pay_date: string
          period_end: string
          period_start: string
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["payroll_status"]
          total_deductions: number | null
          total_employer_cost: number | null
          total_gross: number | null
          total_net: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          currency?: string | null
          employee_count?: number | null
          id?: string
          metadata?: Json | null
          name: string
          notes?: string | null
          pay_date: string
          period_end: string
          period_start: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payroll_status"]
          total_deductions?: number | null
          total_employer_cost?: number | null
          total_gross?: number | null
          total_net?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          currency?: string | null
          employee_count?: number | null
          id?: string
          metadata?: Json | null
          name?: string
          notes?: string | null
          pay_date?: string
          period_end?: string
          period_start?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payroll_status"]
          total_deductions?: number | null
          total_employer_cost?: number | null
          total_gross?: number | null
          total_net?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          acknowledged_at: string | null
          areas_for_improvement: string | null
          company_id: string
          competencies: Json | null
          completed_at: string | null
          created_at: string
          development_plan: string | null
          employee_comments: string | null
          employee_id: string
          goals: Json | null
          id: string
          manager_assessment: string | null
          metadata: Json | null
          next_review_date: string | null
          overall_rating: number | null
          review_period_end: string
          review_period_start: string
          review_type: string | null
          reviewer_id: string
          self_assessment: string | null
          status: Database["public"]["Enums"]["review_status"]
          strengths: string | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          areas_for_improvement?: string | null
          company_id: string
          competencies?: Json | null
          completed_at?: string | null
          created_at?: string
          development_plan?: string | null
          employee_comments?: string | null
          employee_id: string
          goals?: Json | null
          id?: string
          manager_assessment?: string | null
          metadata?: Json | null
          next_review_date?: string | null
          overall_rating?: number | null
          review_period_end: string
          review_period_start: string
          review_type?: string | null
          reviewer_id: string
          self_assessment?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          areas_for_improvement?: string | null
          company_id?: string
          competencies?: Json | null
          completed_at?: string | null
          created_at?: string
          development_plan?: string | null
          employee_comments?: string | null
          employee_id?: string
          goals?: Json | null
          id?: string
          manager_assessment?: string | null
          metadata?: Json | null
          next_review_date?: string | null
          overall_rating?: number | null
          review_period_end?: string
          review_period_start?: string
          review_type?: string | null
          reviewer_id?: string
          self_assessment?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_employees: number | null
          max_storage_gb: number | null
          name: string
          price_monthly: number
          price_yearly: number
          sort_order: number | null
          trial_default_days: number | null
          trial_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_employees?: number | null
          max_storage_gb?: number | null
          name: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number | null
          trial_default_days?: number | null
          trial_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_employees?: number | null
          max_storage_gb?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number | null
          trial_default_days?: number | null
          trial_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          permissions: Json | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          force_password_change: boolean | null
          id: string
          last_login_at: string | null
          last_name: string | null
          locale: string | null
          metadata: Json | null
          phone: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          force_password_change?: boolean | null
          id: string
          last_login_at?: string | null
          last_name?: string | null
          locale?: string | null
          metadata?: Json | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          force_password_change?: boolean | null
          id?: string
          last_login_at?: string | null
          last_name?: string | null
          locale?: string | null
          metadata?: Json | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          event_type: Database["public"]["Enums"]["security_event_type"]
          id: string
          ip_address: unknown
          is_resolved: boolean | null
          location: Json | null
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          event_type: Database["public"]["Enums"]["security_event_type"]
          id?: string
          ip_address?: unknown
          is_resolved?: boolean | null
          location?: Json | null
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["security_event_type"]
          id?: string
          ip_address?: unknown
          is_resolved?: boolean | null
          location?: Json | null
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_duration_minutes: number | null
          code: string | null
          color: string | null
          company_id: string
          created_at: string
          end_time: string
          grace_period_minutes: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_night_shift: boolean | null
          metadata: Json | null
          name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          break_duration_minutes?: number | null
          code?: string | null
          color?: string | null
          company_id: string
          created_at?: string
          end_time: string
          grace_period_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_night_shift?: boolean | null
          metadata?: Json | null
          name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          break_duration_minutes?: number | null
          code?: string | null
          color?: string | null
          company_id?: string
          created_at?: string
          end_time?: string
          grace_period_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_night_shift?: boolean | null
          metadata?: Json | null
          name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subdomain_change_requests: {
        Row: {
          company_id: string
          created_at: string
          current_subdomain: string | null
          id: string
          requested_by: string | null
          requested_subdomain: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_subdomain?: string | null
          id?: string
          requested_by?: string | null
          requested_subdomain: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_subdomain?: string | null
          id?: string
          requested_by?: string | null
          requested_subdomain?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subdomain_change_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      support_access: {
        Row: {
          access_level: string | null
          access_log: Json | null
          company_id: string
          created_at: string
          expires_at: string
          granted_by: string
          id: string
          metadata: Json | null
          reason: string
          revoked_at: string | null
          revoked_by: string | null
          starts_at: string
          support_user_id: string | null
          updated_at: string
        }
        Insert: {
          access_level?: string | null
          access_log?: Json | null
          company_id: string
          created_at?: string
          expires_at: string
          granted_by: string
          id?: string
          metadata?: Json | null
          reason: string
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string
          support_user_id?: string | null
          updated_at?: string
        }
        Update: {
          access_level?: string | null
          access_log?: Json | null
          company_id?: string
          created_at?: string
          expires_at?: string
          granted_by?: string
          id?: string
          metadata?: Json | null
          reason?: string
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string
          support_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          break_minutes: number | null
          clock_in: string | null
          clock_out: string | null
          company_id: string
          created_at: string
          date: string
          employee_id: string
          id: string
          is_approved: boolean | null
          late_minutes: number | null
          location: Json | null
          metadata: Json | null
          notes: string | null
          overtime_hours: number | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          company_id: string
          created_at?: string
          date: string
          employee_id: string
          id?: string
          is_approved?: boolean | null
          late_minutes?: number | null
          location?: Json | null
          metadata?: Json | null
          notes?: string | null
          overtime_hours?: number | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          company_id?: string
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          is_approved?: boolean | null
          late_minutes?: number | null
          location?: Json | null
          metadata?: Json | null
          notes?: string | null
          overtime_hours?: number | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_extension_requests: {
        Row: {
          company_id: string
          created_at: string
          id: string
          reason: string | null
          requested_days: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          reason?: string | null
          requested_days?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          requested_days?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_extension_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          browser: string | null
          created_at: string
          device_fingerprint: string
          device_name: string | null
          id: string
          ip_address: unknown
          is_current: boolean | null
          last_used_at: string | null
          location: Json | null
          os: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          id?: string
          ip_address?: unknown
          is_current?: boolean | null
          last_used_at?: string | null
          location?: Json | null
          os?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          id?: string
          ip_address?: unknown
          is_current?: boolean | null
          last_used_at?: string | null
          location?: Json | null
          os?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          created_at: string
          document_notifications: boolean | null
          email_enabled: boolean | null
          id: string
          leave_notifications: boolean | null
          metadata: Json | null
          payroll_notifications: boolean | null
          push_enabled: boolean | null
          system_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_notifications?: boolean | null
          email_enabled?: boolean | null
          id?: string
          leave_notifications?: boolean | null
          metadata?: Json | null
          payroll_notifications?: boolean | null
          push_enabled?: boolean | null
          system_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_notifications?: boolean | null
          email_enabled?: boolean | null
          id?: string
          leave_notifications?: boolean | null
          metadata?: Json | null
          payroll_notifications?: boolean | null
          push_enabled?: boolean | null
          system_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_company_role: {
        Args: {
          _company_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_hr_or_above: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "company_admin"
        | "hr_manager"
        | "manager"
        | "employee"
      audit_action:
        | "create"
        | "read"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "export"
        | "import"
      candidate_status:
        | "applied"
        | "screening"
        | "interviewing"
        | "offered"
        | "hired"
        | "rejected"
        | "withdrawn"
      employment_status: "active" | "on_leave" | "terminated" | "suspended"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "intern"
        | "temporary"
      interview_type: "phone" | "video" | "in_person" | "technical" | "panel"
      job_status: "draft" | "open" | "closed" | "on_hold"
      leave_status: "pending" | "approved" | "rejected" | "canceled"
      payroll_status: "draft" | "processing" | "completed" | "failed"
      plan_interval: "monthly" | "yearly"
      review_status: "draft" | "in_progress" | "completed" | "acknowledged"
      security_event_type:
        | "login_success"
        | "login_failure"
        | "password_change"
        | "mfa_enabled"
        | "mfa_disabled"
        | "suspicious_activity"
        | "permission_denied"
        | "data_export"
      subscription_status:
        | "active"
        | "past_due"
        | "canceled"
        | "trialing"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "company_admin",
        "hr_manager",
        "manager",
        "employee",
      ],
      audit_action: [
        "create",
        "read",
        "update",
        "delete",
        "login",
        "logout",
        "export",
        "import",
      ],
      candidate_status: [
        "applied",
        "screening",
        "interviewing",
        "offered",
        "hired",
        "rejected",
        "withdrawn",
      ],
      employment_status: ["active", "on_leave", "terminated", "suspended"],
      employment_type: [
        "full_time",
        "part_time",
        "contract",
        "intern",
        "temporary",
      ],
      interview_type: ["phone", "video", "in_person", "technical", "panel"],
      job_status: ["draft", "open", "closed", "on_hold"],
      leave_status: ["pending", "approved", "rejected", "canceled"],
      payroll_status: ["draft", "processing", "completed", "failed"],
      plan_interval: ["monthly", "yearly"],
      review_status: ["draft", "in_progress", "completed", "acknowledged"],
      security_event_type: [
        "login_success",
        "login_failure",
        "password_change",
        "mfa_enabled",
        "mfa_disabled",
        "suspicious_activity",
        "permission_denied",
        "data_export",
      ],
      subscription_status: [
        "active",
        "past_due",
        "canceled",
        "trialing",
        "paused",
      ],
    },
  },
} as const
