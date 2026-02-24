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
      admin_adjustments: {
        Row: {
          adjustment_type: string
          admin_user_id: string
          amount_cents: number
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          adjustment_type: string
          admin_user_id: string
          amount_cents?: number
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          adjustment_type?: string
          admin_user_id?: string
          amount_cents?: number
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      ai_inference_runs: {
        Row: {
          classification: Json | null
          created_at: string
          duplicate_ticket_id: string | null
          evidence_score: number | null
          id: string
          input_summary: string | null
          latency_ms: number | null
          model_name: string
          output: Json | null
          risk_score: number | null
          ticket_id: string
        }
        Insert: {
          classification?: Json | null
          created_at?: string
          duplicate_ticket_id?: string | null
          evidence_score?: number | null
          id?: string
          input_summary?: string | null
          latency_ms?: number | null
          model_name: string
          output?: Json | null
          risk_score?: number | null
          ticket_id: string
        }
        Update: {
          classification?: Json | null
          created_at?: string
          duplicate_ticket_id?: string | null
          evidence_score?: number | null
          id?: string
          input_summary?: string | null
          latency_ms?: number | null
          model_name?: string
          output?: Json | null
          risk_score?: number | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_inference_runs_duplicate_ticket_id_fkey"
            columns: ["duplicate_ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inference_runs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_exceptions: {
        Row: {
          created_at: string
          customer_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
          next_action: string | null
          provider_org_id: string | null
          resolved_at: string | null
          resolved_by_admin_user_id: string | null
          severity: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          next_action?: string | null
          provider_org_id?: string | null
          resolved_at?: string | null
          resolved_by_admin_user_id?: string | null
          severity?: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          next_action?: string | null
          provider_org_id?: string | null
          resolved_at?: string | null
          resolved_by_admin_user_id?: string | null
          severity?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          run_type: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          run_type: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          run_type?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      customer_credits: {
        Row: {
          amount_cents: number
          applied_to_invoice_id: string | null
          created_at: string
          customer_id: string
          id: string
          issued_by_admin_user_id: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          applied_to_invoice_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          issued_by_admin_user_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          applied_to_invoice_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          issued_by_admin_user_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credits_applied_to_invoice_id_fkey"
            columns: ["applied_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_invoice_line_items: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          invoice_id: string
          label: string
          metadata: Json | null
          type: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          id?: string
          invoice_id: string
          label: string
          metadata?: Json | null
          type?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          invoice_id?: string
          label?: string
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_invoices: {
        Row: {
          created_at: string
          credits_applied_cents: number
          customer_id: string
          cycle_end_at: string | null
          cycle_start_at: string | null
          due_at: string | null
          id: string
          idempotency_key: string | null
          invoice_type: string
          paid_at: string | null
          processor_invoice_id: string | null
          status: string
          subscription_id: string | null
          subtotal_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_applied_cents?: number
          customer_id: string
          cycle_end_at?: string | null
          cycle_start_at?: string | null
          due_at?: string | null
          id?: string
          idempotency_key?: string | null
          invoice_type?: string
          paid_at?: string | null
          processor_invoice_id?: string | null
          status?: string
          subscription_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_applied_cents?: number
          customer_id?: string
          cycle_end_at?: string | null
          cycle_start_at?: string | null
          due_at?: string | null
          id?: string
          idempotency_key?: string | null
          invoice_type?: string
          paid_at?: string | null
          processor_invoice_id?: string | null
          status?: string
          subscription_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_issues: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          job_id: string
          note: string
          photo_storage_path: string | null
          photo_upload_status: string | null
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by_admin_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          job_id: string
          note: string
          photo_storage_path?: string | null
          photo_upload_status?: string | null
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by_admin_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          job_id?: string
          note?: string
          photo_storage_path?: string | null
          photo_upload_status?: string | null
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by_admin_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_issues_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_ledger_events: {
        Row: {
          amount_cents: number
          balance_after_cents: number
          created_at: string
          customer_id: string
          event_type: string
          id: string
          invoice_id: string | null
          metadata: Json | null
        }
        Insert: {
          amount_cents?: number
          balance_after_cents?: number
          created_at?: string
          customer_id: string
          event_type: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
        }
        Update: {
          amount_cents?: number
          balance_after_cents?: number
          created_at?: string
          customer_id?: string
          event_type?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_ledger_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_payment_methods: {
        Row: {
          brand: string | null
          created_at: string
          customer_id: string
          exp_month: number | null
          exp_year: number | null
          id: string
          is_default: boolean
          last4: string | null
          processor_ref: string
          status: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          customer_id: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean
          last4?: string | null
          processor_ref: string
          status?: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          customer_id?: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean
          last4?: string | null
          processor_ref?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_payments: {
        Row: {
          amount_cents: number
          attempt_number: number
          created_at: string
          customer_id: string
          id: string
          idempotency_key: string | null
          invoice_id: string
          processor_payment_id: string | null
          status: string
        }
        Insert: {
          amount_cents?: number
          attempt_number?: number
          created_at?: string
          customer_id: string
          id?: string
          idempotency_key?: string | null
          invoice_id: string
          processor_payment_id?: string | null
          status?: string
        }
        Update: {
          amount_cents?: number
          attempt_number?: number
          created_at?: string
          customer_id?: string
          id?: string
          idempotency_key?: string | null
          invoice_id?: string
          processor_payment_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_plan_selections: {
        Row: {
          created_at: string
          customer_id: string
          draft_routine: Json
          effective_billing_cycle_start_at: string | null
          effective_service_week_start_at: string | null
          entitlement_version_id: string | null
          id: string
          is_locked_for_service_week: boolean
          locked_at: string | null
          property_id: string | null
          selected_plan_id: string
          status: string
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          draft_routine?: Json
          effective_billing_cycle_start_at?: string | null
          effective_service_week_start_at?: string | null
          entitlement_version_id?: string | null
          id?: string
          is_locked_for_service_week?: boolean
          locked_at?: string | null
          property_id?: string | null
          selected_plan_id: string
          status?: string
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          draft_routine?: Json
          effective_billing_cycle_start_at?: string | null
          effective_service_week_start_at?: string | null
          entitlement_version_id?: string | null
          id?: string
          is_locked_for_service_week?: boolean
          locked_at?: string | null
          property_id?: string | null
          selected_plan_id?: string
          status?: string
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_plan_selections_entitlement_version_id_fkey"
            columns: ["entitlement_version_id"]
            isOneToOne: false
            referencedRelation: "plan_entitlement_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_plan_selections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_plan_selections_selected_plan_id_fkey"
            columns: ["selected_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_plan_selections_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_seasonal_selections: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          property_id: string
          seasonal_template_id: string
          selection_state: string
          source: string
          updated_at: string
          window_preference: string
          year: number
          zone_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          property_id: string
          seasonal_template_id: string
          selection_state?: string
          source?: string
          updated_at?: string
          window_preference?: string
          year: number
          zone_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          property_id?: string
          seasonal_template_id?: string
          selection_state?: string
          source?: string
          updated_at?: string
          window_preference?: string
          year?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_seasonal_selections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_seasonal_selections_seasonal_template_id_fkey"
            columns: ["seasonal_template_id"]
            isOneToOne: false
            referencedRelation: "seasonal_service_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_seasonal_selections_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_autopilot_actions: {
        Row: {
          action_type: string
          actor_user_id: string | null
          category: string
          created_at: string
          id: string
          metadata: Json
          new_state: string | null
          previous_state: string | null
          reason: string | null
          trigger_source: string
          zone_id: string
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          category: string
          created_at?: string
          id?: string
          metadata?: Json
          new_state?: string | null
          previous_state?: string | null
          reason?: string | null
          trigger_source?: string
          zone_id: string
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          category?: string
          created_at?: string
          id?: string
          metadata?: Json
          new_state?: string | null
          previous_state?: string | null
          reason?: string | null
          trigger_source?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_autopilot_actions_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_events: {
        Row: {
          actor_id: string
          actor_role: string
          category: string | null
          cohort_id: string | null
          context: Json
          created_at: string
          event_type: string
          id: string
          idempotency_key: string
          sku_id: string | null
          source_surface: string
          zone_id: string | null
        }
        Insert: {
          actor_id: string
          actor_role: string
          category?: string | null
          cohort_id?: string | null
          context?: Json
          created_at?: string
          event_type: string
          id?: string
          idempotency_key: string
          sku_id?: string | null
          source_surface: string
          zone_id?: string | null
        }
        Update: {
          actor_id?: string
          actor_role?: string
          category?: string | null
          cohort_id?: string | null
          context?: Json
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          sku_id?: string | null
          source_surface?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_events_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "market_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_events_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_surface_config: {
        Row: {
          category: string
          created_at: string
          id: string
          incentive_visibility: boolean
          prompt_frequency_caps: Json
          share_brand_default: string
          share_link_expiry_days: number
          share_link_hard_cap_days: number
          surface_weights: Json
          updated_at: string
          zone_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          incentive_visibility?: boolean
          prompt_frequency_caps?: Json
          share_brand_default?: string
          share_link_expiry_days?: number
          share_link_hard_cap_days?: number
          surface_weights?: Json
          updated_at?: string
          zone_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          incentive_visibility?: boolean
          prompt_frequency_caps?: Json
          share_brand_default?: string
          share_link_expiry_days?: number
          share_link_hard_cap_days?: number
          surface_weights?: Json
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_surface_config_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_scripts: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          program_id: string | null
          sort_order: number
          tone: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          program_id?: string | null
          sort_order?: number
          tone: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          program_id?: string | null
          sort_order?: number
          tone?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_scripts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "referral_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_checklist_items: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          job_id: string
          label: string
          note: string | null
          reason_code: string | null
          sku_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          job_id: string
          label: string
          note?: string | null
          reason_code?: string | null
          sku_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          job_id?: string
          label?: string
          note?: string | null
          reason_code?: string | null
          sku_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_checklist_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checklist_items_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      job_events: {
        Row: {
          actor_role: string
          actor_user_id: string
          created_at: string
          event_type: string
          id: string
          job_id: string
          metadata: Json
        }
        Insert: {
          actor_role: string
          actor_user_id: string
          created_at?: string
          event_type: string
          id?: string
          job_id: string
          metadata?: Json
        }
        Update: {
          actor_role?: string
          actor_user_id?: string
          created_at?: string
          event_type?: string
          id?: string
          job_id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_issues: {
        Row: {
          created_at: string
          created_by_role: string
          created_by_user_id: string
          description: string | null
          id: string
          issue_type: string
          job_id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by_admin_user_id: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_role: string
          created_by_user_id: string
          description?: string | null
          id?: string
          issue_type: string
          job_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by_admin_user_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_role?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          issue_type?: string
          job_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by_admin_user_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_issues_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          captured_at: string | null
          created_at: string
          id: string
          job_id: string
          sku_id: string | null
          slot_key: string | null
          storage_path: string
          upload_status: string
        }
        Insert: {
          captured_at?: string | null
          created_at?: string
          id?: string
          job_id: string
          sku_id?: string | null
          slot_key?: string | null
          storage_path: string
          upload_status?: string
        }
        Update: {
          captured_at?: string | null
          created_at?: string
          id?: string
          job_id?: string
          sku_id?: string | null
          slot_key?: string | null
          storage_path?: string
          upload_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_photos_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      job_skus: {
        Row: {
          duration_minutes_snapshot: number | null
          id: string
          job_id: string
          sku_id: string
          sku_name_snapshot: string | null
        }
        Insert: {
          duration_minutes_snapshot?: number | null
          id?: string
          job_id: string
          sku_id: string
          sku_name_snapshot?: string | null
        }
        Update: {
          duration_minutes_snapshot?: number | null
          id?: string
          job_id?: string
          sku_id?: string
          sku_name_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_skus_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_skus_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          access_notes_snapshot: string | null
          arrived_at: string | null
          arrived_source: string | null
          assigned_member_id: string | null
          completed_at: string | null
          created_at: string
          customer_id: string
          departed_at: string | null
          departed_source: string | null
          id: string
          property_id: string
          provider_org_id: string
          provider_summary: string | null
          routine_version_id: string | null
          scheduled_date: string | null
          service_day_instance_id: string | null
          started_at: string | null
          status: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          access_notes_snapshot?: string | null
          arrived_at?: string | null
          arrived_source?: string | null
          assigned_member_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id: string
          departed_at?: string | null
          departed_source?: string | null
          id?: string
          property_id: string
          provider_org_id: string
          provider_summary?: string | null
          routine_version_id?: string | null
          scheduled_date?: string | null
          service_day_instance_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          access_notes_snapshot?: string | null
          arrived_at?: string | null
          arrived_source?: string | null
          assigned_member_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          departed_at?: string | null
          departed_source?: string | null
          id?: string
          property_id?: string
          provider_org_id?: string
          provider_summary?: string | null
          routine_version_id?: string | null
          scheduled_date?: string | null
          service_day_instance_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_routine_version_id_fkey"
            columns: ["routine_version_id"]
            isOneToOne: false
            referencedRelation: "routine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      market_cohorts: {
        Row: {
          created_at: string
          id: string
          label: string
          launch_status: Database["public"]["Enums"]["zone_launch_status"]
          metadata: Json | null
          status: string
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          launch_status?: Database["public"]["Enums"]["zone_launch_status"]
          metadata?: Json | null
          status?: string
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          launch_status?: Database["public"]["Enums"]["zone_launch_status"]
          metadata?: Json | null
          status?: string
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_cohorts_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      market_health_snapshots: {
        Row: {
          category: string
          created_at: string
          demand_score: number
          health_label: string
          health_score: number
          id: string
          inputs: Json
          quality_score: number
          snapshot_at: string
          supply_score: number
          zone_id: string
        }
        Insert: {
          category: string
          created_at?: string
          demand_score?: number
          health_label?: string
          health_score?: number
          id?: string
          inputs?: Json
          quality_score?: number
          snapshot_at?: string
          supply_score?: number
          zone_id: string
        }
        Update: {
          category?: string
          created_at?: string
          demand_score?: number
          health_label?: string
          health_score?: number
          id?: string
          inputs?: Json
          quality_score?: number
          snapshot_at?: string
          supply_score?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_health_snapshots_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      market_zone_category_state: {
        Row: {
          category: string
          config: Json
          created_at: string
          id: string
          lock_reason: string | null
          locked_by_admin_user_id: string | null
          locked_until: string | null
          status: Database["public"]["Enums"]["market_zone_category_status"]
          updated_at: string
          zone_id: string
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          id?: string
          lock_reason?: string | null
          locked_by_admin_user_id?: string | null
          locked_until?: string | null
          status?: Database["public"]["Enums"]["market_zone_category_status"]
          updated_at?: string
          zone_id: string
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          id?: string
          lock_reason?: string | null
          locked_by_admin_user_id?: string | null
          locked_until?: string | null
          status?: Database["public"]["Enums"]["market_zone_category_status"]
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_zone_category_state_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_kpi_snapshots_daily: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_key: string
          metric_value: number
          snapshot_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_key: string
          metric_value?: number
          snapshot_date: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_key?: string
          metric_value?: number
          snapshot_date?: string
        }
        Relationships: []
      }
      ops_kpi_snapshots_realtime: {
        Row: {
          id: string
          metric_key: string
          metric_value: number
          updated_at: string
        }
        Insert: {
          id?: string
          metric_key: string
          metric_value?: number
          updated_at?: string
        }
        Update: {
          id?: string
          metric_key?: string
          metric_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          processor_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          processor_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          processor_event_id?: string
        }
        Relationships: []
      }
      payout_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          earnings_count: number
          id: string
          started_at: string | null
          status: string
          total_cents: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          earnings_count?: number
          id?: string
          started_at?: string | null
          status?: string
          total_cents?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          earnings_count?: number
          id?: string
          started_at?: string | null
          status?: string
          total_cents?: number
        }
        Relationships: []
      }
      plan_entitlement_sku_rules: {
        Row: {
          entitlement_version_id: string
          id: string
          reason: string | null
          rule_type: Database["public"]["Enums"]["sku_rule_type"]
          sku_id: string
        }
        Insert: {
          entitlement_version_id: string
          id?: string
          reason?: string | null
          rule_type?: Database["public"]["Enums"]["sku_rule_type"]
          sku_id: string
        }
        Update: {
          entitlement_version_id?: string
          id?: string
          reason?: string | null
          rule_type?: Database["public"]["Enums"]["sku_rule_type"]
          sku_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_entitlement_sku_rules_entitlement_version_id_fkey"
            columns: ["entitlement_version_id"]
            isOneToOne: false
            referencedRelation: "plan_entitlement_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_entitlement_sku_rules_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_entitlement_versions: {
        Row: {
          created_at: string
          extra_allowed: boolean
          id: string
          included_count: number | null
          included_credits: number | null
          included_minutes: number | null
          included_service_weeks_per_billing_cycle: number
          max_extra_count: number | null
          max_extra_credits: number | null
          max_extra_minutes: number | null
          model_type: Database["public"]["Enums"]["entitlement_model"]
          plan_id: string
          status: string
          version: number
        }
        Insert: {
          created_at?: string
          extra_allowed?: boolean
          id?: string
          included_count?: number | null
          included_credits?: number | null
          included_minutes?: number | null
          included_service_weeks_per_billing_cycle?: number
          max_extra_count?: number | null
          max_extra_credits?: number | null
          max_extra_minutes?: number | null
          model_type?: Database["public"]["Enums"]["entitlement_model"]
          plan_id: string
          status?: string
          version?: number
        }
        Update: {
          created_at?: string
          extra_allowed?: boolean
          id?: string
          included_count?: number | null
          included_credits?: number | null
          included_minutes?: number | null
          included_service_weeks_per_billing_cycle?: number
          max_extra_count?: number | null
          max_extra_credits?: number | null
          max_extra_minutes?: number | null
          model_type?: Database["public"]["Enums"]["entitlement_model"]
          plan_id?: string
          status?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_entitlement_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_zone_availability: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          plan_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          plan_id: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          plan_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_zone_availability_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_zone_availability_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          current_entitlement_version_id: string | null
          display_price_text: string | null
          id: string
          name: string
          recommended_rank: number | null
          status: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_entitlement_version_id?: string | null
          display_price_text?: string | null
          id?: string
          name: string
          recommended_rank?: number | null
          status?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_entitlement_version_id?: string | null
          display_price_text?: string | null
          id?: string
          name?: string
          recommended_rank?: number | null
          status?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_current_entitlement_version_fk"
            columns: ["current_entitlement_version_id"]
            isOneToOne: false
            referencedRelation: "plan_entitlement_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          access_instructions: string | null
          city: string
          created_at: string
          gate_code: string | null
          geohash: string | null
          id: string
          lat: number | null
          lng: number | null
          lot_size: string | null
          notes: string | null
          parking_instructions: string | null
          pets: Json | null
          state: string
          street_address: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          access_instructions?: string | null
          city: string
          created_at?: string
          gate_code?: string | null
          geohash?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          lot_size?: string | null
          notes?: string | null
          parking_instructions?: string | null
          pets?: Json | null
          state?: string
          street_address: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          access_instructions?: string | null
          city?: string
          created_at?: string
          gate_code?: string | null
          geohash?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          lot_size?: string | null
          notes?: string | null
          parking_instructions?: string | null
          pets?: Json | null
          state?: string
          street_address?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      provider_applications: {
        Row: {
          category: string
          cohort_id: string | null
          created_at: string
          founding_partner: boolean
          id: string
          launch_path_target: number | null
          metadata: Json | null
          program_id: string | null
          provider_org_id: string | null
          status: Database["public"]["Enums"]["provider_application_status"]
          updated_at: string
          user_id: string
          waitlist_reason: string | null
          zip_codes: string[]
        }
        Insert: {
          category: string
          cohort_id?: string | null
          created_at?: string
          founding_partner?: boolean
          id?: string
          launch_path_target?: number | null
          metadata?: Json | null
          program_id?: string | null
          provider_org_id?: string | null
          status?: Database["public"]["Enums"]["provider_application_status"]
          updated_at?: string
          user_id: string
          waitlist_reason?: string | null
          zip_codes?: string[]
        }
        Update: {
          category?: string
          cohort_id?: string | null
          created_at?: string
          founding_partner?: boolean
          id?: string
          launch_path_target?: number | null
          metadata?: Json | null
          program_id?: string | null
          provider_org_id?: string | null
          status?: Database["public"]["Enums"]["provider_application_status"]
          updated_at?: string
          user_id?: string
          waitlist_reason?: string | null
          zip_codes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "provider_applications_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "market_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "referral_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_applications_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_capabilities: {
        Row: {
          capability_key: string
          capability_type: string
          created_at: string
          id: string
          is_enabled: boolean
          provider_org_id: string
          sku_id: string | null
          updated_at: string
        }
        Insert: {
          capability_key: string
          capability_type?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          provider_org_id: string
          sku_id?: string | null
          updated_at?: string
        }
        Update: {
          capability_key?: string
          capability_type?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          provider_org_id?: string
          sku_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_capabilities_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_capabilities_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_compliance: {
        Row: {
          background_check_consented: boolean
          business_type: string | null
          created_at: string
          id: string
          insurance_attested: boolean
          insurance_doc_url: string | null
          notes: string | null
          other_doc_url: string | null
          provider_org_id: string
          tax_doc_url: string | null
          tax_form_attested: boolean
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          background_check_consented?: boolean
          business_type?: string | null
          created_at?: string
          id?: string
          insurance_attested?: boolean
          insurance_doc_url?: string | null
          notes?: string | null
          other_doc_url?: string | null
          provider_org_id: string
          tax_doc_url?: string | null
          tax_form_attested?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          background_check_consented?: boolean
          business_type?: string | null
          created_at?: string
          id?: string
          insurance_attested?: boolean
          insurance_doc_url?: string | null
          notes?: string | null
          other_doc_url?: string | null
          provider_org_id?: string
          tax_doc_url?: string | null
          tax_form_attested?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_compliance_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: true
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_coverage: {
        Row: {
          coverage_type: string | null
          created_at: string
          id: string
          max_travel_miles: number | null
          provider_org_id: string
          request_status: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          coverage_type?: string | null
          created_at?: string
          id?: string
          max_travel_miles?: number | null
          provider_org_id: string
          request_status?: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          coverage_type?: string | null
          created_at?: string
          id?: string
          max_travel_miles?: number | null
          provider_org_id?: string
          request_status?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_coverage_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_coverage_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_earnings: {
        Row: {
          base_amount_cents: number
          created_at: string
          hold_reason: string | null
          hold_until: string | null
          id: string
          idempotency_key: string | null
          job_id: string
          modifier_cents: number
          payout_id: string | null
          provider_org_id: string
          status: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          base_amount_cents?: number
          created_at?: string
          hold_reason?: string | null
          hold_until?: string | null
          id?: string
          idempotency_key?: string | null
          job_id: string
          modifier_cents?: number
          payout_id?: string | null
          provider_org_id: string
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          base_amount_cents?: number
          created_at?: string
          hold_reason?: string | null
          hold_until?: string | null
          id?: string
          idempotency_key?: string | null
          job_id?: string
          modifier_cents?: number
          payout_id?: string | null
          provider_org_id?: string
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_earnings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_earnings_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "provider_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_earnings_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_enforcement_actions: {
        Row: {
          action_type: string
          created_at: string
          created_by_admin_user_id: string
          id: string
          metadata: Json | null
          provider_org_id: string
          reason: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          created_by_admin_user_id: string
          id?: string
          metadata?: Json | null
          provider_org_id: string
          reason?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by_admin_user_id?: string
          id?: string
          metadata?: Json | null
          provider_org_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_enforcement_actions_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_health_snapshots: {
        Row: {
          avg_time_on_site_minutes: number | null
          completed_jobs: number | null
          created_at: string
          id: string
          issue_rate: number | null
          metadata: Json | null
          proof_compliance: number | null
          provider_org_id: string
          snapshot_date: string
        }
        Insert: {
          avg_time_on_site_minutes?: number | null
          completed_jobs?: number | null
          created_at?: string
          id?: string
          issue_rate?: number | null
          metadata?: Json | null
          proof_compliance?: number | null
          provider_org_id: string
          snapshot_date: string
        }
        Update: {
          avg_time_on_site_minutes?: number | null
          completed_jobs?: number | null
          created_at?: string
          id?: string
          issue_rate?: number | null
          metadata?: Json | null
          proof_compliance?: number | null
          provider_org_id?: string
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_health_snapshots_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_hold_context: {
        Row: {
          created_at: string
          hold_id: string
          id: string
          note: string | null
          photo_storage_path: string | null
          provider_org_id: string
          reason_category: string | null
        }
        Insert: {
          created_at?: string
          hold_id: string
          id?: string
          note?: string | null
          photo_storage_path?: string | null
          provider_org_id: string
          reason_category?: string | null
        }
        Update: {
          created_at?: string
          hold_id?: string
          id?: string
          note?: string | null
          photo_storage_path?: string | null
          provider_org_id?: string
          reason_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_hold_context_hold_id_fkey"
            columns: ["hold_id"]
            isOneToOne: false
            referencedRelation: "provider_holds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_hold_context_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_holds: {
        Row: {
          created_at: string
          earning_id: string
          hold_type: string
          id: string
          provider_org_id: string
          reason_category: string | null
          released_at: string | null
          released_by_admin_user_id: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          earning_id: string
          hold_type?: string
          id?: string
          provider_org_id: string
          reason_category?: string | null
          released_at?: string | null
          released_by_admin_user_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          earning_id?: string
          hold_type?: string
          id?: string
          provider_org_id?: string
          reason_category?: string | null
          released_at?: string | null
          released_by_admin_user_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_holds_earning_id_fkey"
            columns: ["earning_id"]
            isOneToOne: false
            referencedRelation: "provider_earnings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_holds_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_invites: {
        Row: {
          allowed_zone_ids: string[]
          code: string
          created_at: string
          created_by_admin_user_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          uses_count: number
        }
        Insert: {
          allowed_zone_ids?: string[]
          code: string
          created_at?: string
          created_by_admin_user_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          uses_count?: number
        }
        Update: {
          allowed_zone_ids?: string[]
          code?: string
          created_at?: string
          created_by_admin_user_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          uses_count?: number
        }
        Relationships: []
      }
      provider_ledger_events: {
        Row: {
          amount_cents: number
          balance_after_cents: number
          created_at: string
          earning_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          payout_id: string | null
          provider_org_id: string
        }
        Insert: {
          amount_cents?: number
          balance_after_cents?: number
          created_at?: string
          earning_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          payout_id?: string | null
          provider_org_id: string
        }
        Update: {
          amount_cents?: number
          balance_after_cents?: number
          created_at?: string
          earning_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          payout_id?: string | null
          provider_org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_ledger_events_earning_id_fkey"
            columns: ["earning_id"]
            isOneToOne: false
            referencedRelation: "provider_earnings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_ledger_events_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "provider_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_ledger_events_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_members: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          provider_org_id: string
          role_in_org: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          provider_org_id: string
          role_in_org?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          provider_org_id?: string
          role_in_org?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_members_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_orgs: {
        Row: {
          accountable_owner_user_id: string
          contact_phone: string | null
          created_at: string
          created_by_user_id: string
          home_base_zip: string | null
          id: string
          invite_id: string | null
          logo_url: string | null
          name: string
          needs_review: boolean
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          accountable_owner_user_id: string
          contact_phone?: string | null
          created_at?: string
          created_by_user_id: string
          home_base_zip?: string | null
          id?: string
          invite_id?: string | null
          logo_url?: string | null
          name?: string
          needs_review?: boolean
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          accountable_owner_user_id?: string
          contact_phone?: string | null
          created_at?: string
          created_by_user_id?: string
          home_base_zip?: string | null
          id?: string
          invite_id?: string | null
          logo_url?: string | null
          name?: string
          needs_review?: boolean
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_orgs_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "provider_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_payout_accounts: {
        Row: {
          created_at: string
          id: string
          onboarding_url: string | null
          processor_account_id: string | null
          provider_org_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          onboarding_url?: string | null
          processor_account_id?: string | null
          provider_org_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          onboarding_url?: string | null
          processor_account_id?: string | null
          provider_org_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_payout_accounts_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: true
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_payout_line_items: {
        Row: {
          amount_cents: number
          created_at: string
          earning_id: string
          id: string
          payout_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          earning_id: string
          id?: string
          payout_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          earning_id?: string
          id?: string
          payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_payout_line_items_earning_id_fkey"
            columns: ["earning_id"]
            isOneToOne: true
            referencedRelation: "provider_earnings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payout_line_items_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "provider_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_payouts: {
        Row: {
          created_at: string
          id: string
          paid_at: string | null
          payout_run_id: string | null
          processor_payout_id: string | null
          provider_org_id: string
          status: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          paid_at?: string | null
          payout_run_id?: string | null
          processor_payout_id?: string | null
          provider_org_id: string
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          paid_at?: string | null
          payout_run_id?: string | null
          processor_payout_id?: string | null
          provider_org_id?: string
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_payouts_payout_run_id_fkey"
            columns: ["payout_run_id"]
            isOneToOne: false
            referencedRelation: "payout_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payouts_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_risk_flags: {
        Row: {
          created_at: string
          flag_type: string
          id: string
          is_active: boolean
          provider_org_id: string
          severity: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          flag_type: string
          id?: string
          is_active?: boolean
          provider_org_id: string
          severity?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          flag_type?: string
          id?: string
          is_active?: boolean
          provider_org_id?: string
          severity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_risk_flags_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          program_id: string
          user_id: string
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          program_id: string
          user_id: string
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          program_id?: string
          user_id?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "referral_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_milestones: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          milestone: Database["public"]["Enums"]["referral_milestone_type"]
          occurred_at: string
          referral_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          milestone: Database["public"]["Enums"]["referral_milestone_type"]
          occurred_at?: string
          referral_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          milestone?: Database["public"]["Enums"]["referral_milestone_type"]
          occurred_at?: string
          referral_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_milestones_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_programs: {
        Row: {
          created_at: string
          description: string | null
          hold_days: number
          id: string
          max_reward_dollars_per_referrer_per_4weeks: number | null
          max_rewards_per_referrer_per_week: number | null
          milestone_triggers: Database["public"]["Enums"]["referral_milestone_type"][]
          name: string
          referred_reward_amount_cents: number
          referred_reward_type: Database["public"]["Enums"]["referral_reward_type"]
          referrer_reward_amount_cents: number
          referrer_reward_type: Database["public"]["Enums"]["referral_reward_type"]
          referrer_type: string
          status: Database["public"]["Enums"]["referral_program_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hold_days?: number
          id?: string
          max_reward_dollars_per_referrer_per_4weeks?: number | null
          max_rewards_per_referrer_per_week?: number | null
          milestone_triggers?: Database["public"]["Enums"]["referral_milestone_type"][]
          name: string
          referred_reward_amount_cents?: number
          referred_reward_type?: Database["public"]["Enums"]["referral_reward_type"]
          referrer_reward_amount_cents?: number
          referrer_reward_type?: Database["public"]["Enums"]["referral_reward_type"]
          referrer_type?: string
          status?: Database["public"]["Enums"]["referral_program_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hold_days?: number
          id?: string
          max_reward_dollars_per_referrer_per_4weeks?: number | null
          max_rewards_per_referrer_per_week?: number | null
          milestone_triggers?: Database["public"]["Enums"]["referral_milestone_type"][]
          name?: string
          referred_reward_amount_cents?: number
          referred_reward_type?: Database["public"]["Enums"]["referral_reward_type"]
          referrer_reward_amount_cents?: number
          referrer_reward_type?: Database["public"]["Enums"]["referral_reward_type"]
          referrer_type?: string
          status?: Database["public"]["Enums"]["referral_program_status"]
          updated_at?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount_cents: number
          applied_at: string | null
          created_at: string
          hold_reason: string | null
          hold_until: string | null
          id: string
          ledger_event_id: string | null
          milestone: Database["public"]["Enums"]["referral_milestone_type"]
          program_id: string
          recipient_user_id: string
          referral_id: string
          referred_user_id: string
          reward_type: Database["public"]["Enums"]["referral_reward_type"]
          status: Database["public"]["Enums"]["referral_reward_status"]
          updated_at: string
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          amount_cents?: number
          applied_at?: string | null
          created_at?: string
          hold_reason?: string | null
          hold_until?: string | null
          id?: string
          ledger_event_id?: string | null
          milestone: Database["public"]["Enums"]["referral_milestone_type"]
          program_id: string
          recipient_user_id: string
          referral_id: string
          referred_user_id: string
          reward_type: Database["public"]["Enums"]["referral_reward_type"]
          status?: Database["public"]["Enums"]["referral_reward_status"]
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          amount_cents?: number
          applied_at?: string | null
          created_at?: string
          hold_reason?: string | null
          hold_until?: string | null
          id?: string
          ledger_event_id?: string | null
          milestone?: Database["public"]["Enums"]["referral_milestone_type"]
          program_id?: string
          recipient_user_id?: string
          referral_id?: string
          referred_user_id?: string
          reward_type?: Database["public"]["Enums"]["referral_reward_type"]
          status?: Database["public"]["Enums"]["referral_reward_status"]
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "referral_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_risk_flags: {
        Row: {
          created_at: string
          flag_type: string
          id: string
          reason: string | null
          referral_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by_admin_user_id: string | null
          reward_id: string | null
          status: Database["public"]["Enums"]["referral_risk_flag_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          flag_type: string
          id?: string
          reason?: string | null
          referral_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by_admin_user_id?: string | null
          reward_id?: string | null
          status?: Database["public"]["Enums"]["referral_risk_flag_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          flag_type?: string
          id?: string
          reason?: string | null
          referral_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by_admin_user_id?: string | null
          reward_id?: string | null
          status?: Database["public"]["Enums"]["referral_risk_flag_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_risk_flags_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_risk_flags_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "referral_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          attributed_at: string
          code_id: string
          created_at: string
          id: string
          program_id: string
          referred_user_id: string
          referrer_user_id: string
        }
        Insert: {
          attributed_at?: string
          code_id: string
          created_at?: string
          id?: string
          program_id: string
          referred_user_id: string
          referrer_user_id: string
        }
        Update: {
          attributed_at?: string
          code_id?: string
          created_at?: string
          id?: string
          program_id?: string
          referred_user_id?: string
          referrer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "referral_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          id: string
          name: string
          state: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          state?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          state?: string
          status?: string
        }
        Relationships: []
      }
      routine_items: {
        Row: {
          cadence_detail: Json
          cadence_type: Database["public"]["Enums"]["cadence_type"]
          checklist_count: number | null
          created_at: string
          duration_minutes: number | null
          fulfillment_mode: string | null
          id: string
          proof_photo_count: number | null
          proof_photo_labels: Json | null
          routine_version_id: string
          sku_id: string
          sku_name: string | null
        }
        Insert: {
          cadence_detail?: Json
          cadence_type?: Database["public"]["Enums"]["cadence_type"]
          checklist_count?: number | null
          created_at?: string
          duration_minutes?: number | null
          fulfillment_mode?: string | null
          id?: string
          proof_photo_count?: number | null
          proof_photo_labels?: Json | null
          routine_version_id: string
          sku_id: string
          sku_name?: string | null
        }
        Update: {
          cadence_detail?: Json
          cadence_type?: Database["public"]["Enums"]["cadence_type"]
          checklist_count?: number | null
          created_at?: string
          duration_minutes?: number | null
          fulfillment_mode?: string | null
          id?: string
          proof_photo_count?: number | null
          proof_photo_labels?: Json | null
          routine_version_id?: string
          sku_id?: string
          sku_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_items_routine_version_id_fkey"
            columns: ["routine_version_id"]
            isOneToOne: false
            referencedRelation: "routine_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_items_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_versions: {
        Row: {
          created_at: string
          effective_at: string | null
          id: string
          locked_at: string | null
          routine_id: string
          status: string
          version_number: number
        }
        Insert: {
          created_at?: string
          effective_at?: string | null
          id?: string
          locked_at?: string | null
          routine_id: string
          status?: string
          version_number?: number
        }
        Update: {
          created_at?: string
          effective_at?: string | null
          id?: string
          locked_at?: string | null
          routine_id?: string
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "routine_versions_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string
          customer_id: string
          effective_at: string | null
          entitlement_version_id: string | null
          id: string
          plan_id: string
          property_id: string
          status: string
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          effective_at?: string | null
          entitlement_version_id?: string | null
          id?: string
          plan_id: string
          property_id: string
          status?: string
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          effective_at?: string | null
          entitlement_version_id?: string | null
          id?: string
          plan_id?: string
          property_id?: string
          status?: string
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routines_entitlement_version_id_fkey"
            columns: ["entitlement_version_id"]
            isOneToOne: false
            referencedRelation: "plan_entitlement_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routines_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routines_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routines_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          planned_window_end: string | null
          planned_window_start: string | null
          price_cents: number
          pricing_type: string
          property_id: string
          scheduled_service_day_id: string | null
          seasonal_template_id: string
          status: string
          updated_at: string
          year: number
          zone_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          planned_window_end?: string | null
          planned_window_start?: string | null
          price_cents?: number
          pricing_type?: string
          property_id: string
          scheduled_service_day_id?: string | null
          seasonal_template_id: string
          status?: string
          updated_at?: string
          year: number
          zone_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          planned_window_end?: string | null
          planned_window_start?: string | null
          price_cents?: number
          pricing_type?: string
          property_id?: string
          scheduled_service_day_id?: string | null
          seasonal_template_id?: string
          status?: string
          updated_at?: string
          year?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_orders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seasonal_orders_seasonal_template_id_fkey"
            columns: ["seasonal_template_id"]
            isOneToOne: false
            referencedRelation: "seasonal_service_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seasonal_orders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_service_templates: {
        Row: {
          created_at: string
          default_windows: Json
          description: string | null
          id: string
          is_active: boolean
          name: string | null
          sku_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_windows?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          sku_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_windows?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          sku_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_service_templates_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      service_day_assignments: {
        Row: {
          created_at: string
          customer_id: string
          day_of_week: string
          id: string
          property_id: string
          reason_code: string | null
          rejection_used: boolean
          reserved_until: string | null
          service_window: string
          status: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          day_of_week: string
          id?: string
          property_id: string
          reason_code?: string | null
          rejection_used?: boolean
          reserved_until?: string | null
          service_window?: string
          status?: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          day_of_week?: string
          id?: string
          property_id?: string
          reason_code?: string | null
          rejection_used?: boolean
          reserved_until?: string | null
          service_window?: string
          status?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_day_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_day_assignments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      service_day_offers: {
        Row: {
          accepted: boolean
          assignment_id: string
          created_at: string
          id: string
          offer_type: string
          offered_day_of_week: string
          offered_window: string
          rank: number
        }
        Insert: {
          accepted?: boolean
          assignment_id: string
          created_at?: string
          id?: string
          offer_type?: string
          offered_day_of_week: string
          offered_window?: string
          rank?: number
        }
        Update: {
          accepted?: boolean
          assignment_id?: string
          created_at?: string
          id?: string
          offer_type?: string
          offered_day_of_week?: string
          offered_window?: string
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_day_offers_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "service_day_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      service_day_override_log: {
        Row: {
          actor_admin_id: string
          after: Json
          assignment_id: string
          before: Json
          created_at: string
          id: string
          notes: string | null
          reason: string
        }
        Insert: {
          actor_admin_id: string
          after: Json
          assignment_id: string
          before: Json
          created_at?: string
          id?: string
          notes?: string | null
          reason: string
        }
        Update: {
          actor_admin_id?: string
          after?: Json
          assignment_id?: string
          before?: Json
          created_at?: string
          id?: string
          notes?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_day_override_log_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "service_day_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      service_day_preferences: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          preferred_days: string[]
          property_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          preferred_days?: string[]
          property_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          preferred_days?: string[]
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_day_preferences_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      service_skus: {
        Row: {
          base_price_cents: number
          category: string | null
          checklist: Json
          created_at: string
          description: string
          display_order: number
          duration_minutes: number
          edge_case_notes: string | null
          exclusions: string[]
          fulfillment_mode: Database["public"]["Enums"]["fulfillment_mode"]
          id: string
          image_url: string | null
          inclusions: string[]
          is_featured: boolean
          name: string
          price_hint_cents: number | null
          pricing_notes: string | null
          required_photos: Json
          status: string
          updated_at: string
          weather_sensitive: boolean
        }
        Insert: {
          base_price_cents?: number
          category?: string | null
          checklist?: Json
          created_at?: string
          description?: string
          display_order?: number
          duration_minutes?: number
          edge_case_notes?: string | null
          exclusions?: string[]
          fulfillment_mode?: Database["public"]["Enums"]["fulfillment_mode"]
          id?: string
          image_url?: string | null
          inclusions?: string[]
          is_featured?: boolean
          name: string
          price_hint_cents?: number | null
          pricing_notes?: string | null
          required_photos?: Json
          status?: string
          updated_at?: string
          weather_sensitive?: boolean
        }
        Update: {
          base_price_cents?: number
          category?: string | null
          checklist?: Json
          created_at?: string
          description?: string
          display_order?: number
          duration_minutes?: number
          edge_case_notes?: string | null
          exclusions?: string[]
          fulfillment_mode?: Database["public"]["Enums"]["fulfillment_mode"]
          id?: string
          image_url?: string | null
          inclusions?: string[]
          is_featured?: boolean
          name?: string
          price_hint_cents?: number | null
          pricing_notes?: string | null
          required_photos?: Json
          status?: string
          updated_at?: string
          weather_sensitive?: boolean
        }
        Relationships: []
      }
      share_cards: {
        Row: {
          asset_mode: string
          brand_mode: string
          category: string | null
          checklist_bullets: Json
          created_at: string
          customer_id: string
          expires_at: string
          expiry_mode: string
          hero_photo_path: string | null
          id: string
          is_revoked: boolean
          job_id: string
          revoked_at: string | null
          share_code: string
          show_first_name: boolean
          show_neighborhood: boolean
          zone_id: string | null
        }
        Insert: {
          asset_mode?: string
          brand_mode?: string
          category?: string | null
          checklist_bullets?: Json
          created_at?: string
          customer_id: string
          expires_at?: string
          expiry_mode?: string
          hero_photo_path?: string | null
          id?: string
          is_revoked?: boolean
          job_id: string
          revoked_at?: string | null
          share_code: string
          show_first_name?: boolean
          show_neighborhood?: boolean
          zone_id?: string | null
        }
        Update: {
          asset_mode?: string
          brand_mode?: string
          category?: string | null
          checklist_bullets?: Json
          created_at?: string
          customer_id?: string
          expires_at?: string
          expiry_mode?: string
          hero_photo_path?: string | null
          id?: string
          is_revoked?: boolean
          job_id?: string
          revoked_at?: string | null
          share_code?: string
          show_first_name?: boolean
          show_neighborhood?: boolean
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_cards_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_cards_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          source: string
          subscription_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          source?: string
          subscription_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          source?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          access_activated_at: string | null
          billing_cycle_end_at: string | null
          billing_cycle_length_days: number
          billing_cycle_start_at: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          current_service_week_end_at: string | null
          current_service_week_start_at: string | null
          customer_id: string
          entitlement_version_id: string | null
          id: string
          next_billing_at: string | null
          next_service_week_end_at: string | null
          next_service_week_start_at: string | null
          pending_effective_at: string | null
          pending_plan_id: string | null
          plan_id: string
          property_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          access_activated_at?: string | null
          billing_cycle_end_at?: string | null
          billing_cycle_length_days?: number
          billing_cycle_start_at?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          current_service_week_end_at?: string | null
          current_service_week_start_at?: string | null
          customer_id: string
          entitlement_version_id?: string | null
          id?: string
          next_billing_at?: string | null
          next_service_week_end_at?: string | null
          next_service_week_start_at?: string | null
          pending_effective_at?: string | null
          pending_plan_id?: string | null
          plan_id: string
          property_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          access_activated_at?: string | null
          billing_cycle_end_at?: string | null
          billing_cycle_length_days?: number
          billing_cycle_start_at?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          current_service_week_end_at?: string | null
          current_service_week_start_at?: string | null
          customer_id?: string
          entitlement_version_id?: string | null
          id?: string
          next_billing_at?: string | null
          next_service_week_end_at?: string | null
          next_service_week_start_at?: string | null
          pending_effective_at?: string | null
          pending_plan_id?: string | null
          plan_id?: string
          property_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_entitlement_version_id_fkey"
            columns: ["entitlement_version_id"]
            isOneToOne: false
            referencedRelation: "plan_entitlement_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_pending_plan_id_fkey"
            columns: ["pending_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      support_attachments: {
        Row: {
          created_at: string
          description: string | null
          file_type: string | null
          id: string
          storage_path: string
          ticket_id: string
          uploaded_by_role: string
          uploaded_by_user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_type?: string | null
          id?: string
          storage_path: string
          ticket_id: string
          uploaded_by_role: string
          uploaded_by_user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_type?: string | null
          id?: string
          storage_path?: string
          ticket_id?: string
          uploaded_by_role?: string
          uploaded_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_macros: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          patch: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          patch?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          patch?: Json
          updated_at?: string
        }
        Relationships: []
      }
      support_policies: {
        Row: {
          change_reason: string | null
          created_at: string
          created_by_user_id: string | null
          description: string | null
          dials: Json
          id: string
          name: string
          published_at: string | null
          status: string
          version: number
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          dials?: Json
          id?: string
          name: string
          published_at?: string | null
          status?: string
          version: number
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          dials?: Json
          id?: string
          name?: string
          published_at?: string | null
          status?: string
          version?: number
        }
        Relationships: []
      }
      support_policy_scopes: {
        Row: {
          active_policy_id: string
          created_at: string
          id: string
          scope_ref_id: string | null
          scope_ref_key: string | null
          scope_type: Database["public"]["Enums"]["support_policy_scope_type"]
          updated_at: string
        }
        Insert: {
          active_policy_id: string
          created_at?: string
          id?: string
          scope_ref_id?: string | null
          scope_ref_key?: string | null
          scope_type: Database["public"]["Enums"]["support_policy_scope_type"]
          updated_at?: string
        }
        Update: {
          active_policy_id?: string
          created_at?: string
          id?: string
          scope_ref_id?: string | null
          scope_ref_key?: string | null
          scope_type?: Database["public"]["Enums"]["support_policy_scope_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_policy_scopes_active_policy_id_fkey"
            columns: ["active_policy_id"]
            isOneToOne: false
            referencedRelation: "support_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_events: {
        Row: {
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["support_event_type"]
          id: string
          metadata: Json | null
          ticket_id: string
        }
        Insert: {
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["support_event_type"]
          id?: string
          metadata?: Json | null
          ticket_id: string
        }
        Update: {
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["support_event_type"]
          id?: string
          metadata?: Json | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_offers: {
        Row: {
          accepted_at: string | null
          amount_cents: number | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          offer_type: Database["public"]["Enums"]["support_offer_type"]
          status: Database["public"]["Enums"]["support_offer_status"]
          ticket_id: string
        }
        Insert: {
          accepted_at?: string | null
          amount_cents?: number | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          offer_type: Database["public"]["Enums"]["support_offer_type"]
          status?: Database["public"]["Enums"]["support_offer_status"]
          ticket_id: string
        }
        Update: {
          accepted_at?: string | null
          amount_cents?: number | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          offer_type?: Database["public"]["Enums"]["support_offer_type"]
          status?: Database["public"]["Enums"]["support_offer_status"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_offers_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          acquisition_source: string | null
          ai_classification: Json | null
          ai_evidence_score: number | null
          ai_risk_score: number | null
          ai_summary: string | null
          category: string | null
          created_at: string
          customer_id: string
          customer_note: string | null
          duplicate_of_ticket_id: string | null
          id: string
          invoice_id: string | null
          job_id: string | null
          partner_tier: string | null
          policy_scope_chain: Json | null
          policy_version_id: string | null
          provider_org_id: string | null
          referring_provider_org_id: string | null
          resolution_summary: string | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          severity: Database["public"]["Enums"]["support_ticket_severity"]
          sku_id: string | null
          sla_due_at: string | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          ticket_type: Database["public"]["Enums"]["support_ticket_type"]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          acquisition_source?: string | null
          ai_classification?: Json | null
          ai_evidence_score?: number | null
          ai_risk_score?: number | null
          ai_summary?: string | null
          category?: string | null
          created_at?: string
          customer_id: string
          customer_note?: string | null
          duplicate_of_ticket_id?: string | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          partner_tier?: string | null
          policy_scope_chain?: Json | null
          policy_version_id?: string | null
          provider_org_id?: string | null
          referring_provider_org_id?: string | null
          resolution_summary?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          severity?: Database["public"]["Enums"]["support_ticket_severity"]
          sku_id?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          ticket_type?: Database["public"]["Enums"]["support_ticket_type"]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          acquisition_source?: string | null
          ai_classification?: Json | null
          ai_evidence_score?: number | null
          ai_risk_score?: number | null
          ai_summary?: string | null
          category?: string | null
          created_at?: string
          customer_id?: string
          customer_note?: string | null
          duplicate_of_ticket_id?: string | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          partner_tier?: string | null
          policy_scope_chain?: Json | null
          policy_version_id?: string | null
          provider_org_id?: string | null
          referring_provider_org_id?: string | null
          resolution_summary?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          severity?: Database["public"]["Enums"]["support_ticket_severity"]
          sku_id?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          ticket_type?: Database["public"]["Enums"]["support_ticket_type"]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_duplicate_of_ticket_id_fkey"
            columns: ["duplicate_of_ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_referring_provider_org_id_fkey"
            columns: ["referring_provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zone_health_snapshots: {
        Row: {
          active_subs: number | null
          capacity_pct: number | null
          completed_jobs: number | null
          completed_jobs_7d: number | null
          created_at: string
          id: string
          issue_rate: number | null
          issue_rate_7d: number | null
          metadata: Json | null
          proof_compliance: number | null
          snapshot_date: string
          zone_id: string
        }
        Insert: {
          active_subs?: number | null
          capacity_pct?: number | null
          completed_jobs?: number | null
          completed_jobs_7d?: number | null
          created_at?: string
          id?: string
          issue_rate?: number | null
          issue_rate_7d?: number | null
          metadata?: Json | null
          proof_compliance?: number | null
          snapshot_date: string
          zone_id: string
        }
        Update: {
          active_subs?: number | null
          capacity_pct?: number | null
          completed_jobs?: number | null
          completed_jobs_7d?: number | null
          created_at?: string
          id?: string
          issue_rate?: number | null
          issue_rate_7d?: number | null
          metadata?: Json | null
          proof_compliance?: number | null
          snapshot_date?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_health_snapshots_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_ops_config: {
        Row: {
          created_at: string
          max_stops_per_week: number | null
          provider_home_label: string | null
          provider_home_lat: number | null
          provider_home_lng: number | null
          target_stops_per_week: number | null
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          max_stops_per_week?: number | null
          provider_home_label?: string | null
          provider_home_lat?: number | null
          provider_home_lng?: number | null
          target_stops_per_week?: number | null
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          max_stops_per_week?: number | null
          provider_home_label?: string | null
          provider_home_lat?: number | null
          provider_home_lng?: number | null
          target_stops_per_week?: number | null
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_ops_config_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: true
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_provider_assignments: {
        Row: {
          assignment_type: string
          created_at: string
          id: string
          provider_user_id: string
          zone_id: string
        }
        Insert: {
          assignment_type: string
          created_at?: string
          id?: string
          provider_user_id: string
          zone_id: string
        }
        Update: {
          assignment_type?: string
          created_at?: string
          id?: string
          provider_user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_provider_assignments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_seasonal_service_rules: {
        Row: {
          capacity_reserve_rule: Json | null
          created_at: string
          id: string
          is_enabled: boolean
          price_override_cents: number | null
          seasonal_template_id: string
          updated_at: string
          windows_override: Json | null
          zone_id: string
        }
        Insert: {
          capacity_reserve_rule?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          price_override_cents?: number | null
          seasonal_template_id: string
          updated_at?: string
          windows_override?: Json | null
          zone_id: string
        }
        Update: {
          capacity_reserve_rule?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          price_override_cents?: number | null
          seasonal_template_id?: string
          updated_at?: string
          windows_override?: Json | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_seasonal_service_rules_seasonal_template_id_fkey"
            columns: ["seasonal_template_id"]
            isOneToOne: false
            referencedRelation: "seasonal_service_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_seasonal_service_rules_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_service_day_capacity: {
        Row: {
          assigned_count: number
          buffer_percent: number
          day_of_week: string
          id: string
          max_homes: number
          service_window: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          assigned_count?: number
          buffer_percent?: number
          day_of_week: string
          id?: string
          max_homes: number
          service_window?: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          assigned_count?: number
          buffer_percent?: number
          day_of_week?: string
          id?: string
          max_homes?: number
          service_window?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_service_day_capacity_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_service_week_config: {
        Row: {
          anchor_day: number
          anchor_time_local: string
          created_at: string
          cutoff_day_offset: number
          cutoff_time_local: string
          id: string
          is_active: boolean
          updated_at: string
          zone_id: string
        }
        Insert: {
          anchor_day?: number
          anchor_time_local?: string
          created_at?: string
          cutoff_day_offset?: number
          cutoff_time_local?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          zone_id: string
        }
        Update: {
          anchor_day?: number
          anchor_time_local?: string
          created_at?: string
          cutoff_day_offset?: number
          cutoff_time_local?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_service_week_config_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: true
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          alternative_strategy: string
          buffer_percent: number
          created_at: string
          default_service_day: Database["public"]["Enums"]["day_of_week"]
          default_service_window: string | null
          id: string
          max_minutes_per_day: number
          max_stops_per_day: number
          name: string
          offer_ttl_hours: number
          region_id: string
          status: string
          updated_at: string
          zip_codes: string[]
        }
        Insert: {
          alternative_strategy?: string
          buffer_percent?: number
          created_at?: string
          default_service_day?: Database["public"]["Enums"]["day_of_week"]
          default_service_window?: string | null
          id?: string
          max_minutes_per_day?: number
          max_stops_per_day?: number
          name: string
          offer_ttl_hours?: number
          region_id: string
          status?: string
          updated_at?: string
          zip_codes?: string[]
        }
        Update: {
          alternative_strategy?: string
          buffer_percent?: number
          created_at?: string
          default_service_day?: Database["public"]["Enums"]["day_of_week"]
          default_service_window?: string | null
          id?: string
          max_minutes_per_day?: number
          max_stops_per_day?: number
          name?: string
          offer_ttl_hours?: number
          region_id?: string
          status?: string
          updated_at?: string
          zip_codes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "zones_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_support_offer: { Args: { p_offer_id: string }; Returns: Json }
      admin_apply_credit: {
        Args: {
          p_amount_cents: number
          p_customer_id: string
          p_reason: string
        }
        Returns: Json
      }
      admin_issue_refund: {
        Args: { p_amount_cents: number; p_invoice_id: string; p_reason: string }
        Returns: Json
      }
      admin_override_complete_job: {
        Args: { p_job_id: string; p_note?: string; p_reason: string }
        Returns: Json
      }
      admin_override_service_day: {
        Args: {
          p_assignment_id: string
          p_new_day: string
          p_new_window: string
          p_notes?: string
          p_reason: string
        }
        Returns: Json
      }
      admin_override_zone_state: {
        Args: {
          p_category: string
          p_lock_days?: number
          p_new_state: string
          p_reason: string
          p_zone_id: string
        }
        Returns: undefined
      }
      admin_provider_action: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_org_id: string
          p_reason?: string
        }
        Returns: Json
      }
      admin_release_hold: {
        Args: { p_hold_id: string; p_reason: string }
        Returns: Json
      }
      admin_resolve_customer_issue: {
        Args: { p_issue_id: string; p_resolution_note: string }
        Returns: Json
      }
      admin_update_coverage_status: {
        Args: { p_coverage_id: string; p_new_status: string; p_reason?: string }
        Returns: Json
      }
      admin_void_invoice: {
        Args: { p_invoice_id: string; p_reason: string }
        Returns: Json
      }
      apply_referral_reward:
        | { Args: { p_reward_id: string }; Returns: Json }
        | {
            Args: { p_admin_user_id?: string; p_reward_id: string }
            Returns: undefined
          }
      attribute_referral_signup: {
        Args: { p_referral_code: string }
        Returns: undefined
      }
      bootstrap_new_user: { Args: { _full_name: string }; Returns: undefined }
      check_provider_sku_zone_eligibility: {
        Args: { p_provider_org_id: string; p_sku_id: string; p_zone_id: string }
        Returns: boolean
      }
      check_zone_readiness: {
        Args: { p_category: string; p_zip_codes: string[] }
        Returns: Json
      }
      cleanup_expired_offers: { Args: never; Returns: Json }
      complete_job: {
        Args: { p_job_id: string; p_provider_summary?: string }
        Returns: Json
      }
      compute_zone_health_score: {
        Args: { p_category: string; p_zone_id: string }
        Returns: Json
      }
      confirm_routine: { Args: { p_routine_id: string }; Returns: Json }
      confirm_service_day: { Args: { p_assignment_id: string }; Returns: Json }
      create_or_refresh_service_day_offer: {
        Args: { p_property_id: string }
        Returns: Json
      }
      create_provider_earning: { Args: { p_job_id: string }; Returns: Json }
      create_share_card: { Args: { p_job_id: string }; Returns: Json }
      generate_subscription_invoice: {
        Args: { p_subscription_id: string }
        Returns: Json
      }
      get_day_order: {
        Args: { p_default_day: string; p_strategy: string }
        Returns: string[]
      }
      get_share_card_public: { Args: { p_share_code: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_provider_org_member: { Args: { p_org_id: string }; Returns: boolean }
      override_referral_attribution: {
        Args: {
          p_new_referrer_id: string
          p_reason: string
          p_referral_id: string
        }
        Returns: Json
      }
      record_autopilot_action: {
        Args: {
          p_action_type: string
          p_category: string
          p_metadata?: Json
          p_new_state?: string
          p_reason?: string
          p_trigger_source?: string
          p_zone_id: string
        }
        Returns: undefined
      }
      record_growth_event: {
        Args: {
          p_actor_role: string
          p_category?: string
          p_cohort_id?: string
          p_context?: Json
          p_event_type: string
          p_idempotency_key: string
          p_sku_id?: string
          p_source_surface: string
          p_zone_id?: string
        }
        Returns: Json
      }
      record_referral_milestone: {
        Args: {
          p_milestone: Database["public"]["Enums"]["referral_milestone_type"]
          p_referral_id: string
        }
        Returns: Json
      }
      reject_service_day_once: {
        Args: { p_assignment_id: string }
        Returns: Json
      }
      release_expired_referral_holds: { Args: never; Returns: number }
      release_referral_hold: {
        Args: { p_reason: string; p_reward_id: string }
        Returns: Json
      }
      report_job_issue: {
        Args: {
          p_description?: string
          p_issue_type: string
          p_job_id: string
          p_severity?: string
        }
        Returns: Json
      }
      revoke_share_card: {
        Args: { p_share_card_id: string }
        Returns: undefined
      }
      run_payout_batch: { Args: { p_payout_run_id: string }; Returns: Json }
      select_alternative_service_day: {
        Args: { p_assignment_id: string; p_offer_id: string }
        Returns: Json
      }
      start_job: { Args: { p_job_id: string }; Returns: Json }
      submit_provider_onboarding: { Args: { p_org_id: string }; Returns: Json }
      transition_eligible_earnings: { Args: never; Returns: Json }
      validate_provider_invite: { Args: { p_code: string }; Returns: Json }
      void_referral_reward: {
        Args: { p_reason: string; p_reward_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "customer" | "provider" | "admin"
      cadence_type:
        | "weekly"
        | "biweekly"
        | "four_week"
        | "monthly"
        | "quarterly"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      entitlement_model:
        | "credits_per_cycle"
        | "count_per_cycle"
        | "minutes_per_cycle"
      fulfillment_mode:
        | "same_day_preferred"
        | "same_week_allowed"
        | "independent_cadence"
      market_zone_category_status:
        | "CLOSED"
        | "SOFT_LAUNCH"
        | "OPEN"
        | "PROTECT_QUALITY"
      provider_application_status:
        | "draft"
        | "submitted"
        | "approved"
        | "waitlisted"
        | "rejected"
      referral_milestone_type:
        | "installed"
        | "subscribed"
        | "first_visit"
        | "paid_cycle"
        | "provider_ready"
        | "provider_first_job"
      referral_program_status: "draft" | "active" | "paused" | "archived"
      referral_reward_status:
        | "pending"
        | "on_hold"
        | "earned"
        | "applied"
        | "paid"
        | "voided"
      referral_reward_type: "customer_credit" | "provider_bonus"
      referral_risk_flag_status: "open" | "reviewed" | "dismissed"
      sku_rule_type: "included" | "extra_allowed" | "blocked" | "provider_only"
      support_event_type:
        | "ticket_created"
        | "offer_shown"
        | "offer_accepted"
        | "offer_rejected"
        | "customer_added_info"
        | "provider_acknowledged"
        | "provider_evidence_uploaded"
        | "provider_review_requested"
        | "provider_statement_added"
        | "admin_resolved"
        | "admin_escalated"
        | "admin_hold_applied"
        | "admin_hold_released"
        | "admin_credit_issued"
        | "admin_refund_issued"
        | "admin_redo_created"
        | "admin_risk_flagged"
        | "admin_macro_applied"
        | "ai_classified"
        | "ai_scored"
        | "sla_breached"
        | "auto_closed"
        | "duplicate_linked"
        | "status_changed"
      support_offer_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "expired"
        | "applied"
      support_offer_type:
        | "credit"
        | "redo_intent"
        | "addon"
        | "refund"
        | "plan_change"
        | "review_by_time"
        | "no_action"
      support_policy_scope_type:
        | "global"
        | "zone"
        | "category"
        | "sku"
        | "provider"
      support_ticket_severity: "low" | "medium" | "high" | "critical"
      support_ticket_status:
        | "open"
        | "awaiting_customer"
        | "awaiting_provider"
        | "in_review"
        | "resolved"
        | "escalated"
        | "closed"
        | "duplicate"
      support_ticket_type:
        | "quality"
        | "missed_item"
        | "damage"
        | "billing"
        | "safety"
        | "routine_change"
        | "provider_promise_mismatch"
        | "general"
      zone_launch_status: "open" | "soft_launch" | "waitlist" | "not_supported"
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
      app_role: ["customer", "provider", "admin"],
      cadence_type: ["weekly", "biweekly", "four_week", "monthly", "quarterly"],
      day_of_week: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      entitlement_model: [
        "credits_per_cycle",
        "count_per_cycle",
        "minutes_per_cycle",
      ],
      fulfillment_mode: [
        "same_day_preferred",
        "same_week_allowed",
        "independent_cadence",
      ],
      market_zone_category_status: [
        "CLOSED",
        "SOFT_LAUNCH",
        "OPEN",
        "PROTECT_QUALITY",
      ],
      provider_application_status: [
        "draft",
        "submitted",
        "approved",
        "waitlisted",
        "rejected",
      ],
      referral_milestone_type: [
        "installed",
        "subscribed",
        "first_visit",
        "paid_cycle",
        "provider_ready",
        "provider_first_job",
      ],
      referral_program_status: ["draft", "active", "paused", "archived"],
      referral_reward_status: [
        "pending",
        "on_hold",
        "earned",
        "applied",
        "paid",
        "voided",
      ],
      referral_reward_type: ["customer_credit", "provider_bonus"],
      referral_risk_flag_status: ["open", "reviewed", "dismissed"],
      sku_rule_type: ["included", "extra_allowed", "blocked", "provider_only"],
      support_event_type: [
        "ticket_created",
        "offer_shown",
        "offer_accepted",
        "offer_rejected",
        "customer_added_info",
        "provider_acknowledged",
        "provider_evidence_uploaded",
        "provider_review_requested",
        "provider_statement_added",
        "admin_resolved",
        "admin_escalated",
        "admin_hold_applied",
        "admin_hold_released",
        "admin_credit_issued",
        "admin_refund_issued",
        "admin_redo_created",
        "admin_risk_flagged",
        "admin_macro_applied",
        "ai_classified",
        "ai_scored",
        "sla_breached",
        "auto_closed",
        "duplicate_linked",
        "status_changed",
      ],
      support_offer_status: [
        "pending",
        "accepted",
        "rejected",
        "expired",
        "applied",
      ],
      support_offer_type: [
        "credit",
        "redo_intent",
        "addon",
        "refund",
        "plan_change",
        "review_by_time",
        "no_action",
      ],
      support_policy_scope_type: [
        "global",
        "zone",
        "category",
        "sku",
        "provider",
      ],
      support_ticket_severity: ["low", "medium", "high", "critical"],
      support_ticket_status: [
        "open",
        "awaiting_customer",
        "awaiting_provider",
        "in_review",
        "resolved",
        "escalated",
        "closed",
        "duplicate",
      ],
      support_ticket_type: [
        "quality",
        "missed_item",
        "damage",
        "billing",
        "safety",
        "routine_change",
        "provider_promise_mismatch",
        "general",
      ],
      zone_launch_status: ["open", "soft_launch", "waitlist", "not_supported"],
    },
  },
} as const
