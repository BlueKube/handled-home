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
          id: string
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
          id?: string
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
          id?: string
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
      bootstrap_new_user: { Args: { _full_name: string }; Returns: undefined }
      cleanup_expired_offers: { Args: never; Returns: Json }
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
    }
    Enums: {
      app_role: "customer" | "provider" | "admin"
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
