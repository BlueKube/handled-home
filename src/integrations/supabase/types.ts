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
      addon_orders: {
        Row: {
          created_at: string
          customer_id: string
          handle_cost: number
          id: string
          job_id: string | null
          payment_method: string
          price_cents: number
          property_id: string
          refund_reason: string | null
          sku_id: string
          status: string
          subscription_id: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          handle_cost?: number
          id?: string
          job_id?: string | null
          payment_method: string
          price_cents?: number
          property_id: string
          refund_reason?: string | null
          sku_id: string
          status?: string
          subscription_id: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          handle_cost?: number
          id?: string
          job_id?: string | null
          payment_method?: string
          price_cents?: number
          property_id?: string
          refund_reason?: string | null
          sku_id?: string
          status?: string
          subscription_id?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addon_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_orders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_orders_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_orders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
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
          actor_admin_role: string | null
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
          actor_admin_role?: string | null
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
          actor_admin_role?: string | null
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
      admin_change_requests: {
        Row: {
          change_type: string
          created_at: string
          id: string
          proposed_changes: Json
          reason: string
          requester_role: string
          requester_user_id: string
          reviewed_at: string | null
          reviewer_note: string | null
          reviewer_user_id: string | null
          status: string
          target_entity_id: string | null
          target_table: string
          updated_at: string
        }
        Insert: {
          change_type: string
          created_at?: string
          id?: string
          proposed_changes?: Json
          reason: string
          requester_role: string
          requester_user_id: string
          reviewed_at?: string | null
          reviewer_note?: string | null
          reviewer_user_id?: string | null
          status?: string
          target_entity_id?: string | null
          target_table: string
          updated_at?: string
        }
        Update: {
          change_type?: string
          created_at?: string
          id?: string
          proposed_changes?: Json
          reason?: string
          requester_role?: string
          requester_user_id?: string
          reviewed_at?: string | null
          reviewer_note?: string | null
          reviewer_user_id?: string | null
          status?: string
          target_entity_id?: string | null
          target_table?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_memberships: {
        Row: {
          admin_role: Database["public"]["Enums"]["admin_role"]
          created_at: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_role?: Database["public"]["Enums"]["admin_role"]
          created_at?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_role?: Database["public"]["Enums"]["admin_role"]
          created_at?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_system_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          updated_at: string
          updated_by_user_id: string | null
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Relationships: []
      }
      ai_inference_runs: {
        Row: {
          classification: Json | null
          created_at: string
          duplicate_ticket_id: string | null
          entity_id: string | null
          entity_type: string | null
          evidence_score: number | null
          id: string
          input_summary: string | null
          latency_ms: number | null
          model_name: string
          output: Json | null
          risk_score: number | null
          ticket_id: string | null
        }
        Insert: {
          classification?: Json | null
          created_at?: string
          duplicate_ticket_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          evidence_score?: number | null
          id?: string
          input_summary?: string | null
          latency_ms?: number | null
          model_name: string
          output?: Json | null
          risk_score?: number | null
          ticket_id?: string | null
        }
        Update: {
          classification?: Json | null
          created_at?: string
          duplicate_ticket_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          evidence_score?: number | null
          id?: string
          input_summary?: string | null
          latency_ms?: number | null
          model_name?: string
          output?: Json | null
          risk_score?: number | null
          ticket_id?: string | null
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
      byoc_attributions: {
        Row: {
          bonus_end_at: string | null
          bonus_start_at: string | null
          created_at: string
          customer_id: string
          first_completed_visit_at: string | null
          id: string
          installed_at: string | null
          invite_code: string | null
          invited_at: string
          provider_org_id: string
          referral_code: string | null
          revoked_reason: string | null
          status: string
          subscribed_at: string | null
          updated_at: string
        }
        Insert: {
          bonus_end_at?: string | null
          bonus_start_at?: string | null
          created_at?: string
          customer_id: string
          first_completed_visit_at?: string | null
          id?: string
          installed_at?: string | null
          invite_code?: string | null
          invited_at?: string
          provider_org_id: string
          referral_code?: string | null
          revoked_reason?: string | null
          status?: string
          subscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          bonus_end_at?: string | null
          bonus_start_at?: string | null
          created_at?: string
          customer_id?: string
          first_completed_visit_at?: string | null
          id?: string
          installed_at?: string | null
          invite_code?: string | null
          invited_at?: string
          provider_org_id?: string
          referral_code?: string | null
          revoked_reason?: string | null
          status?: string
          subscribed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "byoc_attributions_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      byoc_bonus_ledger: {
        Row: {
          amount_cents: number
          attribution_id: string
          created_at: string
          customer_id: string
          earning_id: string | null
          id: string
          provider_org_id: string
          status: string
          week_end: string
          week_start: string
        }
        Insert: {
          amount_cents?: number
          attribution_id: string
          created_at?: string
          customer_id: string
          earning_id?: string | null
          id?: string
          provider_org_id: string
          status?: string
          week_end: string
          week_start: string
        }
        Update: {
          amount_cents?: number
          attribution_id?: string
          created_at?: string
          customer_id?: string
          earning_id?: string | null
          id?: string
          provider_org_id?: string
          status?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "byoc_bonus_ledger_attribution_id_fkey"
            columns: ["attribution_id"]
            isOneToOne: false
            referencedRelation: "byoc_attributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "byoc_bonus_ledger_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      courtesy_upgrades: {
        Row: {
          created_at: string
          id: string
          job_id: string
          performed_level_id: string
          property_id: string
          provider_org_id: string
          reason_code: string
          scheduled_level_id: string
          sku_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          performed_level_id: string
          property_id: string
          provider_org_id: string
          reason_code: string
          scheduled_level_id: string
          sku_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          performed_level_id?: string
          property_id?: string
          provider_org_id?: string
          reason_code?: string
          scheduled_level_id?: string
          sku_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courtesy_upgrades_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtesy_upgrades_performed_level_id_fkey"
            columns: ["performed_level_id"]
            isOneToOne: false
            referencedRelation: "sku_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtesy_upgrades_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtesy_upgrades_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtesy_upgrades_scheduled_level_id_fkey"
            columns: ["scheduled_level_id"]
            isOneToOne: false
            referencedRelation: "sku_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtesy_upgrades_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_run_log: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          function_name: string
          id: string
          idempotency_key: string | null
          result_summary: Json | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          function_name: string
          id?: string
          idempotency_key?: string | null
          result_summary?: Json | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          function_name?: string
          id?: string
          idempotency_key?: string | null
          result_summary?: Json | null
          started_at?: string
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
      customer_onboarding_progress: {
        Row: {
          completed_steps: string[]
          created_at: string
          current_step: string
          id: string
          metadata: Json | null
          selected_plan_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_steps?: string[]
          created_at?: string
          current_step?: string
          id?: string
          metadata?: Json | null
          selected_plan_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_steps?: string[]
          created_at?: string
          current_step?: string
          id?: string
          metadata?: Json | null
          selected_plan_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_onboarding_progress_selected_plan_id_fkey"
            columns: ["selected_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
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
      decision_traces: {
        Row: {
          candidates: Json
          created_at: string
          decision_type: string
          entity_id: string
          entity_type: string
          id: string
          inputs: Json
          outcome: Json
          override_event_id: string | null
          scoring: Json
        }
        Insert: {
          candidates?: Json
          created_at?: string
          decision_type: string
          entity_id: string
          entity_type: string
          id?: string
          inputs?: Json
          outcome?: Json
          override_event_id?: string | null
          scoring?: Json
        }
        Update: {
          candidates?: Json
          created_at?: string
          decision_type?: string
          entity_id?: string
          entity_type?: string
          id?: string
          inputs?: Json
          outcome?: Json
          override_event_id?: string | null
          scoring?: Json
        }
        Relationships: []
      }
      dunning_events: {
        Row: {
          action: string
          created_at: string
          customer_id: string
          explain_admin: string | null
          explain_customer: string | null
          id: string
          metadata: Json | null
          result: string
          step: number
          subscription_id: string
        }
        Insert: {
          action: string
          created_at?: string
          customer_id: string
          explain_admin?: string | null
          explain_customer?: string | null
          id?: string
          metadata?: Json | null
          result?: string
          step: number
          subscription_id: string
        }
        Update: {
          action?: string
          created_at?: string
          customer_id?: string
          explain_admin?: string | null
          explain_customer?: string | null
          id?: string
          metadata?: Json | null
          result?: string
          step?: number
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dunning_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      expansion_suggestions: {
        Row: {
          created_at: string
          explain_admin: string | null
          id: string
          idempotency_key: string | null
          metrics: Json
          priority: string
          proposed_action: Json | null
          recommendation: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by_admin_user_id: string | null
          status: string
          suggestion_type: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          explain_admin?: string | null
          id?: string
          idempotency_key?: string | null
          metrics?: Json
          priority?: string
          proposed_action?: Json | null
          recommendation: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by_admin_user_id?: string | null
          status?: string
          suggestion_type: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          explain_admin?: string | null
          id?: string
          idempotency_key?: string | null
          metrics?: Json
          priority?: string
          proposed_action?: Json | null
          recommendation?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by_admin_user_id?: string | null
          status?: string
          suggestion_type?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expansion_suggestions_zone_id_fkey"
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
      handle_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          customer_id: string
          expires_at: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          subscription_id: string
          txn_type: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          customer_id: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          subscription_id: string
          txn_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          subscription_id?: string
          txn_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "handle_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_calendar: {
        Row: {
          created_at: string
          explain_customer: string | null
          explain_provider: string | null
          holiday_date: string
          id: string
          is_federal: boolean
          name: string
          notify_customers: boolean
          notify_providers: boolean
          skip_jobs: boolean
          year: number
        }
        Insert: {
          created_at?: string
          explain_customer?: string | null
          explain_provider?: string | null
          holiday_date: string
          id?: string
          is_federal?: boolean
          name: string
          notify_customers?: boolean
          notify_providers?: boolean
          skip_jobs?: boolean
          year: number
        }
        Update: {
          created_at?: string
          explain_customer?: string | null
          explain_provider?: string | null
          holiday_date?: string
          id?: string
          is_federal?: boolean
          name?: string
          notify_customers?: boolean
          notify_providers?: boolean
          skip_jobs?: boolean
          year?: number
        }
        Relationships: []
      }
      home_assistant_windows: {
        Row: {
          booked: number
          capacity: number
          created_at: string
          id: string
          window_date: string
          window_slot: string
          zone_id: string
        }
        Insert: {
          booked?: number
          capacity?: number
          created_at?: string
          id?: string
          window_date: string
          window_slot: string
          zone_id: string
        }
        Update: {
          booked?: number
          capacity?: number
          created_at?: string
          id?: string
          window_date?: string
          window_slot?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_assistant_windows_zone_id_fkey"
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
      job_assignment_log: {
        Row: {
          assigned_at: string
          assigned_by: string
          assignment_reason: string
          created_at: string
          explain_admin: string | null
          explain_customer: string | null
          explain_provider: string | null
          id: string
          job_id: string
          previous_provider_org_id: string | null
          provider_org_id: string | null
          score_breakdown: Json | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string
          assignment_reason: string
          created_at?: string
          explain_admin?: string | null
          explain_customer?: string | null
          explain_provider?: string | null
          id?: string
          job_id: string
          previous_provider_org_id?: string | null
          provider_org_id?: string | null
          score_breakdown?: Json | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assignment_reason?: string
          created_at?: string
          explain_admin?: string | null
          explain_customer?: string | null
          explain_provider?: string | null
          id?: string
          job_id?: string
          previous_provider_org_id?: string | null
          provider_org_id?: string | null
          score_breakdown?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "job_assignment_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignment_log_previous_provider_org_id_fkey"
            columns: ["previous_provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignment_log_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
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
          performed_level_id: string | null
          scheduled_level_id: string | null
          sku_id: string
          sku_name_snapshot: string | null
        }
        Insert: {
          duration_minutes_snapshot?: number | null
          id?: string
          job_id: string
          performed_level_id?: string | null
          scheduled_level_id?: string | null
          sku_id: string
          sku_name_snapshot?: string | null
        }
        Update: {
          duration_minutes_snapshot?: number | null
          id?: string
          job_id?: string
          performed_level_id?: string | null
          scheduled_level_id?: string | null
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
            foreignKeyName: "job_skus_performed_level_id_fkey"
            columns: ["performed_level_id"]
            isOneToOne: false
            referencedRelation: "sku_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_skus_scheduled_level_id_fkey"
            columns: ["scheduled_level_id"]
            isOneToOne: false
            referencedRelation: "sku_levels"
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
          latest_start_by: string | null
          property_id: string
          provider_org_id: string
          provider_summary: string | null
          route_order: number | null
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
          latest_start_by?: string | null
          property_id: string
          provider_org_id: string
          provider_summary?: string | null
          route_order?: number | null
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
          latest_start_by?: string | null
          property_id?: string
          provider_org_id?: string
          provider_summary?: string | null
          route_order?: number | null
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
      level_recommendations: {
        Row: {
          created_at: string
          id: string
          job_id: string
          note: string | null
          provider_org_id: string
          reason_code: string
          recommended_level_id: string
          scheduled_level_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          note?: string | null
          provider_org_id: string
          reason_code: string
          recommended_level_id: string
          scheduled_level_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          note?: string | null
          provider_org_id?: string
          reason_code?: string
          recommended_level_id?: string
          scheduled_level_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_recommendations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_recommendations_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_recommendations_recommended_level_id_fkey"
            columns: ["recommended_level_id"]
            isOneToOne: false
            referencedRelation: "sku_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_recommendations_scheduled_level_id_fkey"
            columns: ["scheduled_level_id"]
            isOneToOne: false
            referencedRelation: "sku_levels"
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
      notification_delivery: {
        Row: {
          attempted_at: string
          channel: string
          error_code: string | null
          error_message: string | null
          id: string
          notification_id: string
          provider_message_id: string | null
          status: string
        }
        Insert: {
          attempted_at?: string
          channel: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          notification_id: string
          provider_message_id?: string | null
          status?: string
        }
        Update: {
          attempted_at?: string
          channel?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string
          provider_message_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_digests: {
        Row: {
          created_at: string
          digest_date: string
          event_ids: string[]
          id: string
          notification_id: string | null
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          digest_date: string
          event_ids?: string[]
          id?: string
          notification_id?: string | null
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          digest_date?: string
          event_ids?: string[]
          id?: string
          notification_id?: string | null
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_digests_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          attempt_count: number
          audience_org_id: string | null
          audience_type: string
          audience_user_id: string | null
          audience_zone_id: string | null
          created_at: string
          event_type: string
          id: string
          idempotency_key: string
          last_error: string | null
          payload: Json
          priority: string
          processed_at: string | null
          scheduled_for: string
          status: string
        }
        Insert: {
          attempt_count?: number
          audience_org_id?: string | null
          audience_type?: string
          audience_user_id?: string | null
          audience_zone_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          idempotency_key: string
          last_error?: string | null
          payload?: Json
          priority?: string
          processed_at?: string | null
          scheduled_for?: string
          status?: string
        }
        Update: {
          attempt_count?: number
          audience_org_id?: string | null
          audience_type?: string
          audience_user_id?: string | null
          audience_zone_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          last_error?: string | null
          payload?: Json
          priority?: string
          processed_at?: string | null
          scheduled_for?: string
          status?: string
        }
        Relationships: []
      }
      notification_rate_limits: {
        Row: {
          audience_type: string
          id: string
          max_per_day: number
          max_per_hour: number
          priority: string
          updated_at: string
        }
        Insert: {
          audience_type?: string
          id?: string
          max_per_day?: number
          max_per_hour?: number
          priority: string
          updated_at?: string
        }
        Update: {
          audience_type?: string
          id?: string
          max_per_day?: number
          max_per_hour?: number
          priority?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          audience_type: string
          body_template: string
          channels: string[]
          cta_label_template: string | null
          cta_route_template: string | null
          digest_eligible: boolean
          enabled: boolean
          event_type: string
          id: string
          priority: string
          template_key: string
          title_template: string
          updated_at: string
          version: number
        }
        Insert: {
          audience_type?: string
          body_template: string
          channels?: string[]
          cta_label_template?: string | null
          cta_route_template?: string | null
          digest_eligible?: boolean
          enabled?: boolean
          event_type: string
          id?: string
          priority?: string
          template_key: string
          title_template: string
          updated_at?: string
          version?: number
        }
        Update: {
          audience_type?: string
          body_template?: string
          channels?: string[]
          cta_label_template?: string | null
          cta_route_template?: string | null
          digest_eligible?: boolean
          enabled?: boolean
          event_type?: string
          id?: string
          priority?: string
          template_key?: string
          title_template?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          context_id: string | null
          context_type: string | null
          created_at: string
          cta_label: string | null
          cta_route: string | null
          data: Json | null
          expires_at: string | null
          id: string
          priority: string
          read_at: string | null
          source_event_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          cta_label?: string | null
          cta_route?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          priority?: string
          read_at?: string | null
          source_event_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          cta_label?: string | null
          cta_route?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          priority?: string
          read_at?: string | null
          source_event_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "notification_deadletters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "notification_events"
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
      payout_overtime_rules: {
        Row: {
          active_from: string
          active_to: string | null
          category: string | null
          changed_by: string
          created_at: string
          expected_minutes: number
          id: string
          overtime_cap_cents: number
          overtime_rate_cents_per_min: number
          overtime_start_after_minutes: number
          reason: string | null
          sku_id: string | null
          version: number
          zone_id: string
        }
        Insert: {
          active_from?: string
          active_to?: string | null
          category?: string | null
          changed_by: string
          created_at?: string
          expected_minutes?: number
          id?: string
          overtime_cap_cents?: number
          overtime_rate_cents_per_min?: number
          overtime_start_after_minutes?: number
          reason?: string | null
          sku_id?: string | null
          version?: number
          zone_id: string
        }
        Update: {
          active_from?: string
          active_to?: string | null
          category?: string | null
          changed_by?: string
          created_at?: string
          expected_minutes?: number
          id?: string
          overtime_cap_cents?: number
          overtime_rate_cents_per_min?: number
          overtime_start_after_minutes?: number
          reason?: string | null
          sku_id?: string | null
          version?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_overtime_rules_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_overtime_rules_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
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
      personalization_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          property_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          property_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personalization_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_validation_results: {
        Row: {
          checks: Json
          created_at: string
          failure_reasons: string[] | null
          id: string
          job_id: string
          job_photo_id: string
          provider_org_id: string
          validation_status: string
        }
        Insert: {
          checks?: Json
          created_at?: string
          failure_reasons?: string[] | null
          id?: string
          job_id: string
          job_photo_id: string
          provider_org_id: string
          validation_status?: string
        }
        Update: {
          checks?: Json
          created_at?: string
          failure_reasons?: string[] | null
          id?: string
          job_id?: string
          job_photo_id?: string
          provider_org_id?: string
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_validation_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_validation_results_job_photo_id_fkey"
            columns: ["job_photo_id"]
            isOneToOne: false
            referencedRelation: "job_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_validation_results_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
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
      plan_handles: {
        Row: {
          created_at: string
          handles_per_cycle: number
          id: string
          plan_id: string
          rollover_cap: number
          rollover_expiry_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          handles_per_cycle?: number
          id?: string
          plan_id: string
          rollover_cap?: number
          rollover_expiry_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          handles_per_cycle?: number
          id?: string
          plan_id?: string
          rollover_cap?: number
          rollover_expiry_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_handles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: true
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
      property_coverage: {
        Row: {
          category_key: string
          coverage_status: string
          created_at: string
          id: string
          property_id: string
          switch_intent: string | null
          updated_at: string
        }
        Insert: {
          category_key: string
          coverage_status?: string
          created_at?: string
          id?: string
          property_id: string
          switch_intent?: string | null
          updated_at?: string
        }
        Update: {
          category_key?: string
          coverage_status?: string
          created_at?: string
          id?: string
          property_id?: string
          switch_intent?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_coverage_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_health_scores: {
        Row: {
          computed_at: string
          coverage_score: number
          created_at: string
          customer_id: string
          id: string
          issue_score: number
          overall_score: number
          previous_overall_score: number | null
          property_id: string
          regularity_score: number
          seasonal_score: number
          updated_at: string
        }
        Insert: {
          computed_at?: string
          coverage_score?: number
          created_at?: string
          customer_id: string
          id?: string
          issue_score?: number
          overall_score?: number
          previous_overall_score?: number | null
          property_id: string
          regularity_score?: number
          seasonal_score?: number
          updated_at?: string
        }
        Update: {
          computed_at?: string
          coverage_score?: number
          created_at?: string
          customer_id?: string
          id?: string
          issue_score?: number
          overall_score?: number
          previous_overall_score?: number | null
          property_id?: string
          regularity_score?: number
          seasonal_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_health_scores_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_service_predictions: {
        Row: {
          confidence: number
          expires_at: string
          id: string
          model_version: string
          predicted_at: string
          property_id: string
          reason: string
          sku_id: string
          timing_hint: string
        }
        Insert: {
          confidence: number
          expires_at?: string
          id?: string
          model_version?: string
          predicted_at?: string
          property_id: string
          reason: string
          sku_id: string
          timing_hint?: string
        }
        Update: {
          confidence?: number
          expires_at?: string
          id?: string
          model_version?: string
          predicted_at?: string
          property_id?: string
          reason?: string
          sku_id?: string
          timing_hint?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_service_predictions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_service_predictions_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      property_signals: {
        Row: {
          home_sqft_tier: string | null
          property_id: string
          signals_version: number
          stories_tier: string | null
          updated_at: string
          windows_tier: string | null
          yard_tier: string | null
        }
        Insert: {
          home_sqft_tier?: string | null
          property_id: string
          signals_version?: number
          stories_tier?: string | null
          updated_at?: string
          windows_tier?: string | null
          yard_tier?: string | null
        }
        Update: {
          home_sqft_tier?: string | null
          property_id?: string
          signals_version?: number
          stories_tier?: string | null
          updated_at?: string
          windows_tier?: string | null
          yard_tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_signals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      provider_availability_blocks: {
        Row: {
          block_type: string
          created_at: string
          created_by_user_id: string
          end_date: string
          id: string
          note: string | null
          provider_org_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          block_type?: string
          created_at?: string
          created_by_user_id: string
          end_date: string
          id?: string
          note?: string | null
          provider_org_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          block_type?: string
          created_at?: string
          created_by_user_id?: string
          end_date?: string
          id?: string
          note?: string | null
          provider_org_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_availability_blocks_provider_org_id_fkey"
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
      provider_feedback_rollups: {
        Row: {
          avg_rating: number | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          provider_org_id: string
          published_at: string | null
          review_count: number
          summary_improve: string | null
          summary_positive: string | null
          theme_counts: Json | null
          updated_at: string | null
          visibility_status: string
        }
        Insert: {
          avg_rating?: number | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          provider_org_id: string
          published_at?: string | null
          review_count?: number
          summary_improve?: string | null
          summary_positive?: string | null
          theme_counts?: Json | null
          updated_at?: string | null
          visibility_status?: string
        }
        Update: {
          avg_rating?: number | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          provider_org_id?: string
          published_at?: string | null
          review_count?: number
          summary_improve?: string | null
          summary_positive?: string | null
          theme_counts?: Json | null
          updated_at?: string | null
          visibility_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_feedback_rollups_provider_org_id_fkey"
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
      provider_incentive_config: {
        Row: {
          byoc_duration_days: number
          byoc_weekly_amount_cents: number
          created_at: string
          id: string
          max_byoc_per_provider_per_month: number | null
          reason: string | null
          scope: string
          scope_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          byoc_duration_days?: number
          byoc_weekly_amount_cents?: number
          created_at?: string
          id?: string
          max_byoc_per_provider_per_month?: number | null
          reason?: string | null
          scope?: string
          scope_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          byoc_duration_days?: number
          byoc_weekly_amount_cents?: number
          created_at?: string
          id?: string
          max_byoc_per_provider_per_month?: number | null
          reason?: string | null
          scope?: string
          scope_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
      provider_org_contracts: {
        Row: {
          active_from: string
          active_to: string | null
          category: string | null
          changed_by: string
          contract_type: Database["public"]["Enums"]["provider_contract_type"]
          created_at: string
          id: string
          provider_org_id: string
          reason: string | null
          version: number
        }
        Insert: {
          active_from?: string
          active_to?: string | null
          category?: string | null
          changed_by: string
          contract_type?: Database["public"]["Enums"]["provider_contract_type"]
          created_at?: string
          id?: string
          provider_org_id: string
          reason?: string | null
          version?: number
        }
        Update: {
          active_from?: string
          active_to?: string | null
          category?: string | null
          changed_by?: string
          contract_type?: Database["public"]["Enums"]["provider_contract_type"]
          created_at?: string
          id?: string
          provider_org_id?: string
          reason?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_org_contracts_provider_org_id_fkey"
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
      provider_payout_base: {
        Row: {
          active_from: string
          base_payout_cents: number
          changed_by: string
          created_at: string
          id: string
          reason: string | null
          sku_id: string
          version: number
        }
        Insert: {
          active_from?: string
          base_payout_cents?: number
          changed_by: string
          created_at?: string
          id?: string
          reason?: string | null
          sku_id: string
          version?: number
        }
        Update: {
          active_from?: string
          base_payout_cents?: number
          changed_by?: string
          created_at?: string
          id?: string
          reason?: string | null
          sku_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_payout_base_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
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
      provider_payout_zone_overrides: {
        Row: {
          active_from: string
          active_to: string | null
          changed_by: string
          created_at: string
          id: string
          override_payout_cents: number | null
          payout_multiplier: number | null
          reason: string | null
          sku_id: string
          version: number
          zone_id: string
        }
        Insert: {
          active_from?: string
          active_to?: string | null
          changed_by: string
          created_at?: string
          id?: string
          override_payout_cents?: number | null
          payout_multiplier?: number | null
          reason?: string | null
          sku_id: string
          version?: number
          zone_id: string
        }
        Update: {
          active_from?: string
          active_to?: string | null
          changed_by?: string
          created_at?: string
          id?: string
          override_payout_cents?: number | null
          payout_multiplier?: number | null
          reason?: string | null
          sku_id?: string
          version?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_payout_zone_overrides_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payout_zone_overrides_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
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
      provider_quality_score_events: {
        Row: {
          change_reasons: Json | null
          created_at: string
          id: string
          new_band: string
          new_score: number
          old_band: string | null
          old_score: number | null
          provider_org_id: string
        }
        Insert: {
          change_reasons?: Json | null
          created_at?: string
          id?: string
          new_band: string
          new_score: number
          old_band?: string | null
          old_score?: number | null
          provider_org_id: string
        }
        Update: {
          change_reasons?: Json | null
          created_at?: string
          id?: string
          new_band?: string
          new_score?: number
          old_band?: string | null
          old_score?: number | null
          provider_org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_quality_score_events_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_quality_score_snapshots: {
        Row: {
          band: string
          components: Json
          computed_at: string
          id: string
          provider_org_id: string
          score: number
          score_window_days: number
        }
        Insert: {
          band?: string
          components?: Json
          computed_at?: string
          id?: string
          provider_org_id: string
          score?: number
          score_window_days?: number
        }
        Update: {
          band?: string
          components?: Json
          computed_at?: string
          id?: string
          provider_org_id?: string
          score?: number
          score_window_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_quality_score_snapshots_provider_org_id_fkey"
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
      provider_route_plans: {
        Row: {
          created_at: string
          est_drive_minutes: number
          est_work_minutes: number
          id: string
          locked_at: string | null
          plan_date: string
          projected_earnings_cents: number
          provider_org_id: string
          total_stops: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          est_drive_minutes?: number
          est_work_minutes?: number
          id?: string
          locked_at?: string | null
          plan_date: string
          projected_earnings_cents?: number
          provider_org_id: string
          total_stops?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          est_drive_minutes?: number
          est_work_minutes?: number
          id?: string
          locked_at?: string | null
          plan_date?: string
          projected_earnings_cents?: number
          provider_org_id?: string
          total_stops?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_route_plans_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_sla_status: {
        Row: {
          category: string
          completion_pct: number | null
          created_at: string
          explain_admin: string | null
          explain_provider: string | null
          id: string
          issue_rate: number | null
          jobs_evaluated: number | null
          last_evaluated_at: string | null
          level_since: string
          on_time_pct: number | null
          photo_compliance_pct: number | null
          provider_org_id: string
          redo_rate: number | null
          sla_level: string
          updated_at: string
          weeks_at_level: number | null
          zone_id: string
        }
        Insert: {
          category: string
          completion_pct?: number | null
          created_at?: string
          explain_admin?: string | null
          explain_provider?: string | null
          id?: string
          issue_rate?: number | null
          jobs_evaluated?: number | null
          last_evaluated_at?: string | null
          level_since?: string
          on_time_pct?: number | null
          photo_compliance_pct?: number | null
          provider_org_id: string
          redo_rate?: number | null
          sla_level?: string
          updated_at?: string
          weeks_at_level?: number | null
          zone_id: string
        }
        Update: {
          category?: string
          completion_pct?: number | null
          created_at?: string
          explain_admin?: string | null
          explain_provider?: string | null
          id?: string
          issue_rate?: number | null
          jobs_evaluated?: number | null
          last_evaluated_at?: string | null
          level_since?: string
          on_time_pct?: number | null
          photo_compliance_pct?: number | null
          provider_org_id?: string
          redo_rate?: number | null
          sla_level?: string
          updated_at?: string
          weeks_at_level?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_sla_status_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_sla_status_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_tier_history: {
        Row: {
          assignment_priority_modifier: number
          created_at: string
          effective_at: string
          hold_period_days: number
          id: string
          previous_tier: string | null
          provider_org_id: string
          quality_score_snapshot_id: string | null
          reason: string
          tier: string
        }
        Insert: {
          assignment_priority_modifier?: number
          created_at?: string
          effective_at?: string
          hold_period_days?: number
          id?: string
          previous_tier?: string | null
          provider_org_id: string
          quality_score_snapshot_id?: string | null
          reason: string
          tier?: string
        }
        Update: {
          assignment_priority_modifier?: number
          created_at?: string
          effective_at?: string
          hold_period_days?: number
          id?: string
          previous_tier?: string | null
          provider_org_id?: string
          quality_score_snapshot_id?: string | null
          reason?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_tier_history_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_tier_history_quality_score_snapshot_id_fkey"
            columns: ["quality_score_snapshot_id"]
            isOneToOne: false
            referencedRelation: "provider_quality_score_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_training_gates: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          provider_org_id: string
          required_score_minimum: number
          sku_id: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          provider_org_id: string
          required_score_minimum?: number
          sku_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          provider_org_id?: string
          required_score_minimum?: number
          sku_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_training_gates_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_training_gates_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
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
          level_id: string | null
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
          level_id?: string | null
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
          level_id?: string | null
          proof_photo_count?: number | null
          proof_photo_labels?: Json | null
          routine_version_id?: string
          sku_id?: string
          sku_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_items_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "sku_levels"
            referencedColumns: ["id"]
          },
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
          alignment_explanation: string | null
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
          alignment_explanation?: string | null
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
          alignment_explanation?: string | null
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
          align_days_preference: boolean
          created_at: string
          customer_id: string
          id: string
          must_be_home: boolean
          must_be_home_window: string | null
          preferred_days: string[]
          property_id: string
          updated_at: string
        }
        Insert: {
          align_days_preference?: boolean
          created_at?: string
          customer_id: string
          id?: string
          must_be_home?: boolean
          must_be_home_window?: string | null
          preferred_days?: string[]
          property_id: string
          updated_at?: string
        }
        Update: {
          align_days_preference?: boolean
          created_at?: string
          customer_id?: string
          id?: string
          must_be_home?: boolean
          must_be_home_window?: string | null
          preferred_days?: string[]
          property_id?: string
          updated_at?: string
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
          addon_triggers: Json
          base_price_cents: number
          category: string | null
          checklist: Json
          created_at: string
          customer_prep: string[]
          description: string
          display_order: number
          duration_minutes: number
          edge_case_notes: string | null
          exclusions: string[]
          fulfillment_mode: Database["public"]["Enums"]["fulfillment_mode"]
          handle_cost: number
          id: string
          image_url: string | null
          inclusions: string[]
          is_addon: boolean
          is_featured: boolean
          members_only: boolean
          name: string
          price_hint_cents: number | null
          pricing_notes: string | null
          proof_rules: Json
          provider_category: string
          required_photos: Json
          requires_training_gate: boolean
          status: string
          updated_at: string
          weather_sensitive: boolean
        }
        Insert: {
          addon_triggers?: Json
          base_price_cents?: number
          category?: string | null
          checklist?: Json
          created_at?: string
          customer_prep?: string[]
          description?: string
          display_order?: number
          duration_minutes?: number
          edge_case_notes?: string | null
          exclusions?: string[]
          fulfillment_mode?: Database["public"]["Enums"]["fulfillment_mode"]
          handle_cost?: number
          id?: string
          image_url?: string | null
          inclusions?: string[]
          is_addon?: boolean
          is_featured?: boolean
          members_only?: boolean
          name: string
          price_hint_cents?: number | null
          pricing_notes?: string | null
          proof_rules?: Json
          provider_category?: string
          required_photos?: Json
          requires_training_gate?: boolean
          status?: string
          updated_at?: string
          weather_sensitive?: boolean
        }
        Update: {
          addon_triggers?: Json
          base_price_cents?: number
          category?: string | null
          checklist?: Json
          created_at?: string
          customer_prep?: string[]
          description?: string
          display_order?: number
          duration_minutes?: number
          edge_case_notes?: string | null
          exclusions?: string[]
          fulfillment_mode?: Database["public"]["Enums"]["fulfillment_mode"]
          handle_cost?: number
          id?: string
          image_url?: string | null
          inclusions?: string[]
          is_addon?: boolean
          is_featured?: boolean
          members_only?: boolean
          name?: string
          price_hint_cents?: number | null
          pricing_notes?: string | null
          proof_rules?: Json
          provider_category?: string
          required_photos?: Json
          requires_training_gate?: boolean
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
      sku_guidance_questions: {
        Row: {
          created_at: string
          id: string
          is_mandatory: boolean
          options: Json
          question_order: number
          question_text: string
          sku_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_mandatory?: boolean
          options?: Json
          question_order?: number
          question_text: string
          sku_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_mandatory?: boolean
          options?: Json
          question_order?: number
          question_text?: string
          sku_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sku_guidance_questions_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      sku_levels: {
        Row: {
          created_at: string
          effective_start_cycle: string | null
          exclusions: string[]
          handles_cost: number
          id: string
          inclusions: string[]
          is_active: boolean
          label: string
          level_number: number
          planned_minutes: number
          proof_checklist_template: Json | null
          proof_photo_min: number
          short_description: string | null
          sku_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_start_cycle?: string | null
          exclusions?: string[]
          handles_cost?: number
          id?: string
          inclusions?: string[]
          is_active?: boolean
          label: string
          level_number?: number
          planned_minutes?: number
          proof_checklist_template?: Json | null
          proof_photo_min?: number
          short_description?: string | null
          sku_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_start_cycle?: string | null
          exclusions?: string[]
          handles_cost?: number
          id?: string
          inclusions?: string[]
          is_active?: boolean
          label?: string
          level_number?: number
          planned_minutes?: number
          proof_checklist_template?: Json | null
          proof_photo_min?: number
          short_description?: string | null
          sku_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sku_levels_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      sku_pricing_base: {
        Row: {
          active_from: string
          base_price_cents: number
          changed_by: string
          created_at: string
          currency: string
          id: string
          reason: string | null
          sku_id: string
          version: number
        }
        Insert: {
          active_from?: string
          base_price_cents?: number
          changed_by: string
          created_at?: string
          currency?: string
          id?: string
          reason?: string | null
          sku_id: string
          version?: number
        }
        Update: {
          active_from?: string
          base_price_cents?: number
          changed_by?: string
          created_at?: string
          currency?: string
          id?: string
          reason?: string | null
          sku_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sku_pricing_base_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      sku_pricing_zone_overrides: {
        Row: {
          active_from: string
          active_to: string | null
          changed_by: string
          created_at: string
          id: string
          override_price_cents: number | null
          price_multiplier: number | null
          reason: string | null
          sku_id: string
          version: number
          zone_id: string
        }
        Insert: {
          active_from?: string
          active_to?: string | null
          changed_by: string
          created_at?: string
          id?: string
          override_price_cents?: number | null
          price_multiplier?: number | null
          reason?: string | null
          sku_id: string
          version?: number
          zone_id: string
        }
        Update: {
          active_from?: string
          active_to?: string | null
          changed_by?: string
          created_at?: string
          id?: string
          override_price_cents?: number | null
          price_multiplier?: number | null
          reason?: string | null
          sku_id?: string
          version?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sku_pricing_zone_overrides_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sku_pricing_zone_overrides_zone_id_fkey"
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
          cancel_feedback: string | null
          cancel_reason: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          current_service_week_end_at: string | null
          current_service_week_start_at: string | null
          customer_id: string
          dunning_started_at: string | null
          dunning_step: number
          entitlement_version_id: string | null
          handles_balance: number
          id: string
          last_dunning_at: string | null
          next_billing_at: string | null
          next_service_week_end_at: string | null
          next_service_week_start_at: string | null
          pause_weeks: number | null
          paused_at: string | null
          pending_effective_at: string | null
          pending_plan_id: string | null
          plan_id: string
          property_id: string | null
          resume_at: string | null
          retention_offer_accepted: boolean | null
          service_weeks_used: number
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
          cancel_feedback?: string | null
          cancel_reason?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          current_service_week_end_at?: string | null
          current_service_week_start_at?: string | null
          customer_id: string
          dunning_started_at?: string | null
          dunning_step?: number
          entitlement_version_id?: string | null
          handles_balance?: number
          id?: string
          last_dunning_at?: string | null
          next_billing_at?: string | null
          next_service_week_end_at?: string | null
          next_service_week_start_at?: string | null
          pause_weeks?: number | null
          paused_at?: string | null
          pending_effective_at?: string | null
          pending_plan_id?: string | null
          plan_id: string
          property_id?: string | null
          resume_at?: string | null
          retention_offer_accepted?: boolean | null
          service_weeks_used?: number
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
          cancel_feedback?: string | null
          cancel_reason?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          current_service_week_end_at?: string | null
          current_service_week_start_at?: string | null
          customer_id?: string
          dunning_started_at?: string | null
          dunning_step?: number
          entitlement_version_id?: string | null
          handles_balance?: number
          id?: string
          last_dunning_at?: string | null
          next_billing_at?: string | null
          next_service_week_end_at?: string | null
          next_service_week_start_at?: string | null
          pause_weeks?: number | null
          paused_at?: string | null
          pending_effective_at?: string | null
          pending_plan_id?: string | null
          plan_id?: string
          property_id?: string | null
          resume_at?: string | null
          retention_offer_accepted?: boolean | null
          service_weeks_used?: number
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
      suggestion_actions: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json
          property_id: string
          reason: string | null
          sku_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json
          property_id: string
          reason?: string | null
          sku_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          property_id?: string
          reason?: string | null
          sku_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_actions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_actions_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestion_impressions: {
        Row: {
          created_at: string
          id: string
          property_id: string
          sku_id: string
          surface: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          sku_id: string
          surface: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          sku_id?: string
          surface?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_impressions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_impressions_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestion_suppressions: {
        Row: {
          category: string | null
          created_at: string
          id: string
          property_id: string
          reason: string
          sku_id: string | null
          suppressed_until: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          property_id: string
          reason: string
          sku_id?: string | null
          suppressed_until?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          property_id?: string
          reason?: string
          sku_id?: string | null
          suppressed_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_suppressions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_suppressions_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "service_skus"
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
      user_device_tokens: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string | null
          platform: string
          push_provider: string
          status: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          platform: string
          push_provider?: string
          status?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          platform?: string
          push_provider?: string
          status?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          critical_enabled: boolean
          marketing_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string
          quiet_hours_start: string
          service_updates_enabled: boolean
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          critical_enabled?: boolean
          marketing_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          service_updates_enabled?: boolean
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          critical_enabled?: boolean
          marketing_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          service_updates_enabled?: boolean
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      visit_feedback_quick: {
        Row: {
          category: string | null
          created_at: string
          customer_id: string
          id: string
          job_id: string
          outcome: string
          provider_org_id: string
          tags: Json | null
          zone_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          customer_id: string
          id?: string
          job_id: string
          outcome?: string
          provider_org_id: string
          tags?: Json | null
          zone_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          job_id?: string
          outcome?: string
          provider_org_id?: string
          tags?: Json | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_feedback_quick_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_feedback_quick_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_feedback_quick_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_ratings: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          is_suppressed: boolean
          job_id: string
          provider_org_id: string
          rating: number
          suppression_reason: string | null
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_suppressed?: boolean
          job_id: string
          provider_org_id: string
          rating: number
          suppression_reason?: string | null
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_suppressed?: boolean
          job_id?: string
          provider_org_id?: string
          rating?: number
          suppression_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_ratings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_ratings_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_ratings_private: {
        Row: {
          category: string | null
          comment_private: string | null
          comment_public_candidate: string | null
          created_at: string
          customer_id: string
          id: string
          job_id: string
          provider_org_id: string
          rating: number
          scheduled_release_at: string
          submitted_at: string | null
          tags: Json | null
          zone_id: string | null
        }
        Insert: {
          category?: string | null
          comment_private?: string | null
          comment_public_candidate?: string | null
          created_at?: string
          customer_id: string
          id?: string
          job_id: string
          provider_org_id: string
          rating: number
          scheduled_release_at: string
          submitted_at?: string | null
          tags?: Json | null
          zone_id?: string | null
        }
        Update: {
          category?: string | null
          comment_private?: string | null
          comment_public_candidate?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          job_id?: string
          provider_org_id?: string
          rating?: number
          scheduled_release_at?: string
          submitted_at?: string | null
          tags?: Json | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_ratings_private_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_ratings_private_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_ratings_private_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_entries: {
        Row: {
          converted_at: string | null
          converted_user_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          metadata: Json | null
          notified_at: string | null
          referral_code: string | null
          source: string
          status: string
          updated_at: string
          zip_code: string
          zone_id: string | null
        }
        Insert: {
          converted_at?: string | null
          converted_user_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          metadata?: Json | null
          notified_at?: string | null
          referral_code?: string | null
          source?: string
          status?: string
          updated_at?: string
          zip_code: string
          zone_id?: string | null
        }
        Update: {
          converted_at?: string | null
          converted_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          metadata?: Json | null
          notified_at?: string | null
          referral_code?: string | null
          source?: string
          status?: string
          updated_at?: string
          zip_code?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_events: {
        Row: {
          affected_date_end: string
          affected_date_start: string
          approved_at: string | null
          approved_by_admin_user_id: string | null
          auto_detection_data: Json | null
          category: string
          created_at: string
          description: string | null
          event_type: string
          explain_admin: string | null
          explain_customer: string | null
          explain_provider: string | null
          id: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by_admin_user_id: string | null
          severity: string
          source: string
          status: string
          strategy: string
          title: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          affected_date_end: string
          affected_date_start: string
          approved_at?: string | null
          approved_by_admin_user_id?: string | null
          auto_detection_data?: Json | null
          category?: string
          created_at?: string
          description?: string | null
          event_type?: string
          explain_admin?: string | null
          explain_customer?: string | null
          explain_provider?: string | null
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by_admin_user_id?: string | null
          severity?: string
          source?: string
          status?: string
          strategy?: string
          title: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          affected_date_end?: string
          affected_date_start?: string
          approved_at?: string | null
          approved_by_admin_user_id?: string | null
          auto_detection_data?: Json | null
          category?: string
          created_at?: string
          description?: string | null
          event_type?: string
          explain_admin?: string | null
          explain_customer?: string | null
          explain_provider?: string | null
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by_admin_user_id?: string | null
          severity?: string
          source?: string
          status?: string
          strategy?: string
          title?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_category_providers: {
        Row: {
          assigned_at: string
          category: string
          computed_at: string | null
          created_at: string
          formula_version: string | null
          id: string
          performance_score: number | null
          priority_rank: number
          provider_org_id: string
          role: string
          status: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          assigned_at?: string
          category: string
          computed_at?: string | null
          created_at?: string
          formula_version?: string | null
          id?: string
          performance_score?: number | null
          priority_rank?: number
          provider_org_id: string
          role?: string
          status?: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          assigned_at?: string
          category?: string
          computed_at?: string | null
          created_at?: string
          formula_version?: string | null
          id?: string
          performance_score?: number | null
          priority_rank?: number
          provider_org_id?: string
          role?: string
          status?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_category_providers_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_category_providers_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
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
      notification_deadletters: {
        Row: {
          attempt_count: number | null
          audience_type: string | null
          audience_user_id: string | null
          audience_zone_id: string | null
          created_at: string | null
          event_type: string | null
          id: string | null
          last_error: string | null
          payload: Json | null
          priority: string | null
        }
        Insert: {
          attempt_count?: number | null
          audience_type?: string | null
          audience_user_id?: string | null
          audience_zone_id?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string | null
          last_error?: string | null
          payload?: Json | null
          priority?: string | null
        }
        Update: {
          attempt_count?: number | null
          audience_type?: string | null
          audience_user_id?: string | null
          audience_zone_id?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string | null
          last_error?: string | null
          payload?: Json | null
          priority?: string | null
        }
        Relationships: []
      }
      notification_delivery_daily: {
        Row: {
          channel: string | null
          count: number | null
          delivery_date: string | null
          status: string | null
        }
        Relationships: []
      }
      notification_health_summary: {
        Row: {
          avg_latency_minutes: number | null
          deadletter_total: number | null
          failed_24h: number | null
          last_run_at: string | null
          last_run_status: string | null
          pending_total: number | null
          processing_total: number | null
          queued_24h: number | null
          sent_24h: number | null
          suppressed_24h: number | null
        }
        Relationships: []
      }
      provider_rating_summary: {
        Row: {
          avg_rating: number | null
          negative_count: number | null
          positive_count: number | null
          provider_org_id: string | null
          total_reviews: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_ratings_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "provider_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_support_offer: { Args: { p_offer_id: string }; Returns: Json }
      activate_byoc_attribution: {
        Args: { p_customer_id: string }
        Returns: Json
      }
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
      admin_revoke_byoc_attribution: {
        Args: { p_attribution_id: string; p_reason: string }
        Returns: undefined
      }
      admin_update_coverage_status: {
        Args: { p_coverage_id: string; p_new_status: string; p_reason?: string }
        Returns: Json
      }
      admin_void_invoice: {
        Args: { p_invoice_id: string; p_reason: string }
        Returns: Json
      }
      apply_referral_credits_to_invoice: {
        Args: { p_invoice_id: string }
        Returns: Json
      }
      apply_referral_reward:
        | { Args: { p_reward_id: string }; Returns: Json }
        | {
            Args: { p_admin_user_id?: string; p_reward_id: string }
            Returns: undefined
          }
      approve_weather_event: { Args: { p_event_id: string }; Returns: Json }
      attribute_referral_signup: {
        Args: { p_referral_code: string }
        Returns: undefined
      }
      auto_assign_job: { Args: { p_job_id: string }; Returns: Json }
      book_home_assistant: {
        Args: {
          p_payment_method?: string
          p_property_id: string
          p_sku_id: string
          p_subscription_id: string
          p_window_id: string
          p_zone_id: string
        }
        Returns: Json
      }
      bootstrap_new_user: { Args: { _full_name: string }; Returns: undefined }
      bulk_set_zone_multiplier: {
        Args: {
          p_price_multiplier: number
          p_reason: string
          p_sku_ids: string[]
          p_zone_id: string
        }
        Returns: Json
      }
      cancel_pending_plan_change: {
        Args: { p_subscription_id: string }
        Returns: Json
      }
      cancel_subscription_with_reason: {
        Args: {
          p_accept_retention_offer?: boolean
          p_feedback?: string
          p_reason: string
          p_subscription_id: string
        }
        Returns: Json
      }
      check_density_milestones: { Args: never; Returns: Json }
      check_provider_sku_zone_eligibility: {
        Args: { p_provider_org_id: string; p_sku_id: string; p_zone_id: string }
        Returns: boolean
      }
      check_zone_readiness: {
        Args: { p_category: string; p_zip_codes: string[] }
        Returns: Json
      }
      claim_notification_events: {
        Args: { batch_limit?: number }
        Returns: {
          attempt_count: number
          audience_org_id: string | null
          audience_type: string
          audience_user_id: string | null
          audience_zone_id: string | null
          created_at: string
          event_type: string
          id: string
          idempotency_key: string
          last_error: string | null
          payload: Json
          priority: string
          processed_at: string | null
          scheduled_for: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notification_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cleanup_expired_offers: { Args: never; Returns: Json }
      complete_job: {
        Args: { p_job_id: string; p_provider_summary?: string }
        Returns: Json
      }
      compute_byoc_bonuses: { Args: { p_week_start: string }; Returns: Json }
      compute_property_health_score: {
        Args: { p_customer_id: string; p_property_id: string }
        Returns: Json
      }
      compute_provider_quality_scores: { Args: never; Returns: Json }
      compute_provider_weekly_rollups:
        | { Args: never; Returns: Json }
        | { Args: { p_week_start?: string }; Returns: Json }
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
      emit_notification: {
        Args: {
          p_body: string
          p_data?: Json
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      emit_notification_event: {
        Args: {
          p_audience_org_id?: string
          p_audience_type?: string
          p_audience_user_id?: string
          p_audience_zone_id?: string
          p_event_type: string
          p_idempotency_key: string
          p_payload?: Json
          p_priority?: string
          p_scheduled_for?: string
        }
        Returns: string
      }
      enforce_sla_suspensions: { Args: never; Returns: Json }
      evaluate_provider_sla: {
        Args: {
          p_category: string
          p_provider_org_id: string
          p_zone_id: string
        }
        Returns: Json
      }
      evaluate_provider_tier: {
        Args: { p_provider_org_id: string }
        Returns: Json
      }
      evaluate_training_gates: { Args: never; Returns: Json }
      expire_stale_handles: { Args: never; Returns: Json }
      finish_cron_run: {
        Args: {
          p_error_message?: string
          p_result_summary?: Json
          p_run_id: string
          p_status?: string
        }
        Returns: undefined
      }
      generate_subscription_invoice: {
        Args: { p_subscription_id: string }
        Returns: Json
      }
      get_admin_role: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      get_day_order: {
        Args: { p_default_day: string; p_strategy: string }
        Returns: string[]
      }
      get_effective_provider_payout: {
        Args: { p_sku_id: string; p_zone_id: string }
        Returns: {
          base_payout_cents: number
          effective_payout_cents: number
          override_payout_cents: number
          payout_multiplier: number
          sku_id: string
        }[]
      }
      get_effective_sku_price: {
        Args: { p_sku_id: string; p_zone_id: string }
        Returns: {
          base_price_cents: number
          effective_price_cents: number
          override_price_cents: number
          price_multiplier: number
          sku_id: string
        }[]
      }
      get_handle_balance: {
        Args: { p_subscription_id: string }
        Returns: number
      }
      get_neighborhood_density: { Args: { p_user_id: string }; Returns: Json }
      get_property_profile_context: {
        Args: { p_property_id: string }
        Returns: Json
      }
      get_service_suggestions: {
        Args: { p_property_id: string; p_surface?: string }
        Returns: Json
      }
      get_share_card_public: { Args: { p_share_code: string }; Returns: Json }
      get_waitlist_summary: {
        Args: never
        Returns: {
          earliest_entry: string
          entry_count: number
          zip_code: string
          zone_id: string
          zone_name: string
        }[]
      }
      grant_cycle_handles: {
        Args: {
          p_customer_id: string
          p_idempotency_key?: string
          p_subscription_id: string
        }
        Returns: Json
      }
      has_admin_role: {
        Args: {
          p_role: Database["public"]["Enums"]["admin_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_service_week_usage: {
        Args: { p_subscription_id: string }
        Returns: Json
      }
      insert_courtesy_upgrade: {
        Args: {
          p_job_id: string
          p_performed_level_id: string
          p_property_id: string
          p_provider_org_id: string
          p_reason_code: string
          p_scheduled_level_id: string
          p_sku_id: string
        }
        Returns: Json
      }
      is_admin_member: { Args: { p_user_id: string }; Returns: boolean }
      is_holiday: { Args: { p_date: string }; Returns: boolean }
      is_provider_org_member: { Args: { p_org_id: string }; Returns: boolean }
      is_superuser: { Args: { p_user_id: string }; Returns: boolean }
      is_weather_affected: {
        Args: { p_date: string; p_zone_id: string }
        Returns: boolean
      }
      lock_provider_route: {
        Args: { p_date: string; p_provider_org_id: string }
        Returns: Json
      }
      log_admin_action:
        | {
            Args: {
              p_action: string
              p_after?: Json
              p_before?: Json
              p_entity_id?: string
              p_entity_type: string
              p_reason?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_action: string
              p_admin_user_id: string
              p_after?: Json
              p_before?: Json
              p_entity_id?: string
              p_entity_type: string
              p_reason?: string
            }
            Returns: undefined
          }
      notify_waitlist_on_launch: { Args: { p_zone_id: string }; Returns: Json }
      override_referral_attribution: {
        Args: {
          p_new_referrer_id: string
          p_reason: string
          p_referral_id: string
        }
        Returns: Json
      }
      pause_subscription: {
        Args: { p_subscription_id: string; p_weeks: number }
        Returns: Json
      }
      purchase_addon: {
        Args: {
          p_payment_method?: string
          p_property_id: string
          p_sku_id: string
          p_subscription_id: string
          p_zone_id: string
        }
        Returns: Json
      }
      recalc_handles_balance: {
        Args: { p_subscription_id: string }
        Returns: number
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
      refresh_neighborhood_density: { Args: never; Returns: Json }
      refund_addon: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: Json
      }
      refund_handles: {
        Args: {
          p_amount: number
          p_customer_id: string
          p_original_expires_at?: string
          p_reference_id?: string
          p_subscription_id: string
        }
        Returns: Json
      }
      reinstate_provider: {
        Args: {
          p_admin_user_id?: string
          p_category: string
          p_provider_org_id: string
          p_zone_id: string
        }
        Returns: Json
      }
      reject_service_day_once: {
        Args: { p_assignment_id: string }
        Returns: Json
      }
      release_eligible_earning_holds: { Args: never; Returns: Json }
      release_expired_referral_holds: { Args: never; Returns: number }
      release_referral_hold: {
        Args: { p_reason: string; p_reward_id: string }
        Returns: Json
      }
      reorder_provider_route:
        | { Args: { p_date: string; p_job_orders: Json }; Returns: Json }
        | {
            Args: {
              p_date: string
              p_job_orders: Json
              p_provider_org_id: string
            }
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
      resolve_weather_event: { Args: { p_event_id: string }; Returns: Json }
      resume_subscription: {
        Args: { p_subscription_id: string }
        Returns: Json
      }
      review_change_request: {
        Args: {
          p_decision: string
          p_request_id: string
          p_reviewer_note?: string
        }
        Returns: undefined
      }
      review_expansion_suggestion: {
        Args: { p_decision: string; p_note?: string; p_suggestion_id: string }
        Returns: undefined
      }
      revoke_share_card: {
        Args: { p_share_card_id: string }
        Returns: undefined
      }
      rollback_pricing_override: {
        Args: { p_override_id: string; p_reason: string }
        Returns: string
      }
      run_byoc_lifecycle_transitions: { Args: never; Returns: Json }
      run_dunning_step: { Args: { p_subscription_id: string }; Returns: Json }
      run_payout_batch: { Args: { p_payout_run_id: string }; Returns: Json }
      schedule_plan_change: {
        Args: { p_new_plan_id: string; p_subscription_id: string }
        Returns: Json
      }
      select_alternative_service_day: {
        Args: { p_assignment_id: string; p_offer_id: string }
        Returns: Json
      }
      set_payout_overtime_rules: {
        Args: {
          p_expected_minutes: number
          p_overtime_cap_cents: number
          p_overtime_rate_cents_per_min: number
          p_overtime_start_after_minutes: number
          p_reason: string
          p_sku_id: string
          p_zone_id: string
        }
        Returns: undefined
      }
      set_provider_org_contract:
        | {
            Args: {
              p_contract_type: string
              p_flat_rate_cents?: number
              p_hourly_rate_cents?: number
              p_provider_org_id: string
              p_reason?: string
              p_time_guard_minutes?: number
            }
            Returns: string
          }
        | {
            Args: {
              p_contract_type: string
              p_provider_org_id: string
              p_reason: string
            }
            Returns: undefined
          }
      set_provider_payout_base: {
        Args: {
          p_base_payout_cents: number
          p_reason: string
          p_sku_id: string
        }
        Returns: undefined
      }
      set_provider_payout_zone_override: {
        Args: {
          p_active_from?: string
          p_override_payout_cents?: number
          p_payout_multiplier?: number
          p_reason?: string
          p_sku_id: string
          p_zone_id: string
        }
        Returns: undefined
      }
      set_sku_base_price: {
        Args: { p_base_price_cents: number; p_reason: string; p_sku_id: string }
        Returns: Json
      }
      set_zone_pricing_override: {
        Args: {
          p_active_from?: string
          p_override_price_cents?: number
          p_price_multiplier?: number
          p_reason?: string
          p_sku_id: string
          p_zone_id: string
        }
        Returns: Json
      }
      spend_handles:
        | {
            Args: {
              p_amount: number
              p_customer_id: string
              p_reference_id?: string
              p_subscription_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_amount: number
              p_customer_id: string
              p_reference_id?: string
              p_subscription_id: string
            }
            Returns: Json
          }
      start_cron_run: {
        Args: { p_function_name: string; p_idempotency_key?: string }
        Returns: string
      }
      start_job: { Args: { p_job_id: string }; Returns: Json }
      submit_change_request: {
        Args: {
          p_change_type: string
          p_proposed_changes: Json
          p_reason: string
          p_target_entity_id: string
          p_target_table: string
        }
        Returns: string
      }
      submit_private_review: {
        Args: {
          p_comment_private?: string
          p_comment_public_candidate?: string
          p_job_id: string
          p_rating: number
          p_tags?: Json
        }
        Returns: Json
      }
      submit_provider_onboarding: { Args: { p_org_id: string }; Returns: Json }
      submit_quick_feedback: {
        Args: { p_job_id: string; p_outcome: string; p_tags?: Json }
        Returns: Json
      }
      swap_sku_level_order: {
        Args: { p_level_a_id: string; p_level_b_id: string }
        Returns: undefined
      }
      to_date_immutable: { Args: { ts: string }; Returns: string }
      transition_eligible_earnings: { Args: never; Returns: Json }
      validate_provider_invite: { Args: { p_code: string }; Returns: Json }
      void_referral_reward: {
        Args: { p_reason: string; p_reward_id: string }
        Returns: Json
      }
    }
    Enums: {
      admin_role: "superuser" | "ops" | "dispatcher" | "growth_manager"
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
        | "window_booking"
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
      provider_contract_type:
        | "partner_flat"
        | "partner_time_guarded"
        | "contractor_time_based"
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
      admin_role: ["superuser", "ops", "dispatcher", "growth_manager"],
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
        "window_booking",
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
      provider_contract_type: [
        "partner_flat",
        "partner_time_guarded",
        "contractor_time_based",
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
