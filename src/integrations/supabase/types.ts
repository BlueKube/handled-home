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
          duration_minutes: number
          edge_case_notes: string | null
          exclusions: string[]
          fulfillment_mode: Database["public"]["Enums"]["fulfillment_mode"]
          id: string
          inclusions: string[]
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
          duration_minutes?: number
          edge_case_notes?: string | null
          exclusions?: string[]
          fulfillment_mode?: Database["public"]["Enums"]["fulfillment_mode"]
          id?: string
          inclusions?: string[]
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
          duration_minutes?: number
          edge_case_notes?: string | null
          exclusions?: string[]
          fulfillment_mode?: Database["public"]["Enums"]["fulfillment_mode"]
          id?: string
          inclusions?: string[]
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
      admin_provider_action: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_org_id: string
          p_reason?: string
        }
        Returns: Json
      }
      admin_update_coverage_status: {
        Args: { p_coverage_id: string; p_new_status: string; p_reason?: string }
        Returns: Json
      }
      bootstrap_new_user: { Args: { _full_name: string }; Returns: undefined }
      check_provider_sku_zone_eligibility: {
        Args: { p_provider_org_id: string; p_sku_id: string; p_zone_id: string }
        Returns: boolean
      }
      cleanup_expired_offers: { Args: never; Returns: Json }
      confirm_routine: { Args: { p_routine_id: string }; Returns: Json }
      confirm_service_day: { Args: { p_assignment_id: string }; Returns: Json }
      create_or_refresh_service_day_offer: {
        Args: { p_property_id: string }
        Returns: Json
      }
      get_day_order: {
        Args: { p_default_day: string; p_strategy: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_service_day_once: {
        Args: { p_assignment_id: string }
        Returns: Json
      }
      select_alternative_service_day: {
        Args: { p_assignment_id: string; p_offer_id: string }
        Returns: Json
      }
      submit_provider_onboarding: { Args: { p_org_id: string }; Returns: Json }
      validate_provider_invite: { Args: { p_code: string }; Returns: Json }
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
      sku_rule_type: "included" | "extra_allowed" | "blocked" | "provider_only"
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
      sku_rule_type: ["included", "extra_allowed", "blocked", "provider_only"],
    },
  },
} as const
