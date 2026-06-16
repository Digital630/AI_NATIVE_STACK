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
      admin_access_logs: {
        Row: {
          attempt_type: string
          created_at: string
          device_fingerprint: string | null
          id: string
          ip_hash: string | null
          lock_duration_minutes: number | null
          lock_expires_at: string | null
          visitor_id: string
        }
        Insert: {
          attempt_type: string
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_hash?: string | null
          lock_duration_minutes?: number | null
          lock_expires_at?: string | null
          visitor_id: string
        }
        Update: {
          attempt_type?: string
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_hash?: string | null
          lock_duration_minutes?: number | null
          lock_expires_at?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      admin_lockout_state: {
        Row: {
          created_at: string
          failed_attempts: number
          id: string
          identifier: string
          last_attempt_at: string
          locked_until: string | null
          lockout_cycle: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number
          id?: string
          identifier: string
          last_attempt_at?: string
          locked_until?: string | null
          lockout_cycle?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number
          id?: string
          identifier?: string
          last_attempt_at?: string
          locked_until?: string | null
          lockout_cycle?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_user_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          listing_id: string | null
          message_text: string
          sender_type: string
          updated_at: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          listing_id?: string | null
          message_text: string
          sender_type: string
          updated_at?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          listing_id?: string | null
          message_text?: string
          sender_type?: string
          updated_at?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "commodity_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "commodity_listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_config: {
        Row: {
          auto_update_enabled: boolean
          config_key: string
          created_at: string
          fallback_model: string | null
          id: string
          is_active: boolean
          last_updated_at: string
          max_tokens: number
          model_name: string
          notes: string | null
          temperature: number
          updated_by: string | null
        }
        Insert: {
          auto_update_enabled?: boolean
          config_key?: string
          created_at?: string
          fallback_model?: string | null
          id?: string
          is_active?: boolean
          last_updated_at?: string
          max_tokens?: number
          model_name?: string
          notes?: string | null
          temperature?: number
          updated_by?: string | null
        }
        Update: {
          auto_update_enabled?: boolean
          config_key?: string
          created_at?: string
          fallback_model?: string | null
          id?: string
          is_active?: boolean
          last_updated_at?: string
          max_tokens?: number
          model_name?: string
          notes?: string | null
          temperature?: number
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_model_update_history: {
        Row: {
          config_id: string | null
          created_at: string
          id: string
          new_model: string
          previous_model: string | null
          update_reason: string | null
          updated_by: string | null
        }
        Insert: {
          config_id?: string | null
          created_at?: string
          id?: string
          new_model: string
          previous_model?: string | null
          update_reason?: string | null
          updated_by?: string | null
        }
        Update: {
          config_id?: string | null
          created_at?: string
          id?: string
          new_model?: string
          previous_model?: string | null
          update_reason?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_model_update_history_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "ai_model_config"
            referencedColumns: ["id"]
          },
        ]
      }
      ask_agrismes_queries: {
        Row: {
          created_at: string
          id: string
          mode: string | null
          model_used: string | null
          provider: string | null
          query: string
          resolved_model: string | null
          response: string | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string | null
          model_used?: string | null
          provider?: string | null
          query: string
          resolved_model?: string | null
          response?: string | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string | null
          model_used?: string | null
          provider?: string | null
          query?: string
          resolved_model?: string | null
          response?: string | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          asked_for_documents: boolean | null
          asked_for_price: boolean | null
          commodity: string | null
          country: string | null
          created_at: string
          email_sent_flag: boolean | null
          escalation_flag: boolean | null
          feedback_rating: string | null
          feedback_text: string | null
          id: string
          intent_stage: string | null
          message_count: number | null
          page_path: string | null
          provided_whatsapp: boolean | null
          quality_tag: string | null
          session_duration_seconds: number | null
          session_id: string
          submitted_contact_form: boolean | null
          transcript: Json | null
          updated_at: string
          user_email: string | null
          user_language_detected: string | null
          user_name: string | null
          user_phone_whatsapp: string | null
          user_role: string | null
          visitor_id: string
        }
        Insert: {
          asked_for_documents?: boolean | null
          asked_for_price?: boolean | null
          commodity?: string | null
          country?: string | null
          created_at?: string
          email_sent_flag?: boolean | null
          escalation_flag?: boolean | null
          feedback_rating?: string | null
          feedback_text?: string | null
          id?: string
          intent_stage?: string | null
          message_count?: number | null
          page_path?: string | null
          provided_whatsapp?: boolean | null
          quality_tag?: string | null
          session_duration_seconds?: number | null
          session_id: string
          submitted_contact_form?: boolean | null
          transcript?: Json | null
          updated_at?: string
          user_email?: string | null
          user_language_detected?: string | null
          user_name?: string | null
          user_phone_whatsapp?: string | null
          user_role?: string | null
          visitor_id: string
        }
        Update: {
          asked_for_documents?: boolean | null
          asked_for_price?: boolean | null
          commodity?: string | null
          country?: string | null
          created_at?: string
          email_sent_flag?: boolean | null
          escalation_flag?: boolean | null
          feedback_rating?: string | null
          feedback_text?: string | null
          id?: string
          intent_stage?: string | null
          message_count?: number | null
          page_path?: string | null
          provided_whatsapp?: boolean | null
          quality_tag?: string | null
          session_duration_seconds?: number | null
          session_id?: string
          submitted_contact_form?: boolean | null
          transcript?: Json | null
          updated_at?: string
          user_email?: string | null
          user_language_detected?: string | null
          user_name?: string | null
          user_phone_whatsapp?: string | null
          user_role?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      chat_knowledge_snippets: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          keywords: string[] | null
          priority: number | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          page_url: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          page_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          page_url?: string | null
        }
        Relationships: []
      }
      chat_messages_log: {
        Row: {
          conversation_id: string
          created_at: string
          extracted_keywords: string[] | null
          id: string
          key_topics: string[] | null
          message_role: string
          message_text_english: string | null
          message_text_original: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          extracted_keywords?: string[] | null
          id?: string
          key_topics?: string[] | null
          message_role: string
          message_text_english?: string | null
          message_text_original: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          extracted_keywords?: string[] | null
          id?: string
          key_topics?: string[] | null
          message_role?: string
          message_text_english?: string | null
          message_text_original?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_system_prompts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      commodity_listings: {
        Row: {
          admin_notes: string | null
          admin_review_status:
            | Database["public"]["Enums"]["admin_review_status"]
            | null
          admin_tag: Database["public"]["Enums"]["admin_listing_tag"] | null
          ai_do_briefing: string | null
          ai_dont_briefing: string | null
          commodity_grade: string | null
          commodity_name: string
          company_address: string | null
          confirmed_no_direct_contact: boolean | null
          confirmed_role: boolean | null
          confirmed_verification_timeline: boolean | null
          contact_company: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          destination_country: string | null
          id: string
          incoterms: string | null
          is_urgent: boolean
          is_visible: boolean
          listing_completeness:
            | Database["public"]["Enums"]["listing_completeness"]
            | null
          listing_type: string
          monthly_capacity: string | null
          next_best_action: string | null
          origin_country: string | null
          payment_method: string | null
          payment_terms: string | null
          preferred_regions: string[] | null
          price_expectation: number | null
          price_range: string | null
          price_range_max: number | null
          price_range_min: number | null
          primary_risk: string | null
          quantity: string | null
          quantity_frequency: string | null
          quantity_unit: string | null
          realistic_constraint: string | null
          region_of_origin: string | null
          status: string
          trade_readiness_stage:
            | Database["public"]["Enums"]["trade_readiness_stage"]
            | null
          updated_at: string
          visitor_id: string
        }
        Insert: {
          admin_notes?: string | null
          admin_review_status?:
            | Database["public"]["Enums"]["admin_review_status"]
            | null
          admin_tag?: Database["public"]["Enums"]["admin_listing_tag"] | null
          ai_do_briefing?: string | null
          ai_dont_briefing?: string | null
          commodity_grade?: string | null
          commodity_name: string
          company_address?: string | null
          confirmed_no_direct_contact?: boolean | null
          confirmed_role?: boolean | null
          confirmed_verification_timeline?: boolean | null
          contact_company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          destination_country?: string | null
          id?: string
          incoterms?: string | null
          is_urgent?: boolean
          is_visible?: boolean
          listing_completeness?:
            | Database["public"]["Enums"]["listing_completeness"]
            | null
          listing_type: string
          monthly_capacity?: string | null
          next_best_action?: string | null
          origin_country?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          preferred_regions?: string[] | null
          price_expectation?: number | null
          price_range?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          primary_risk?: string | null
          quantity?: string | null
          quantity_frequency?: string | null
          quantity_unit?: string | null
          realistic_constraint?: string | null
          region_of_origin?: string | null
          status?: string
          trade_readiness_stage?:
            | Database["public"]["Enums"]["trade_readiness_stage"]
            | null
          updated_at?: string
          visitor_id: string
        }
        Update: {
          admin_notes?: string | null
          admin_review_status?:
            | Database["public"]["Enums"]["admin_review_status"]
            | null
          admin_tag?: Database["public"]["Enums"]["admin_listing_tag"] | null
          ai_do_briefing?: string | null
          ai_dont_briefing?: string | null
          commodity_grade?: string | null
          commodity_name?: string
          company_address?: string | null
          confirmed_no_direct_contact?: boolean | null
          confirmed_role?: boolean | null
          confirmed_verification_timeline?: boolean | null
          contact_company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          destination_country?: string | null
          id?: string
          incoterms?: string | null
          is_urgent?: boolean
          is_visible?: boolean
          listing_completeness?:
            | Database["public"]["Enums"]["listing_completeness"]
            | null
          listing_type?: string
          monthly_capacity?: string | null
          next_best_action?: string | null
          origin_country?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          preferred_regions?: string[] | null
          price_expectation?: number | null
          price_range?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          primary_risk?: string | null
          quantity?: string | null
          quantity_frequency?: string | null
          quantity_unit?: string | null
          realistic_constraint?: string | null
          region_of_origin?: string | null
          status?: string
          trade_readiness_stage?:
            | Database["public"]["Enums"]["trade_readiness_stage"]
            | null
          updated_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      fun_outputs: {
        Row: {
          created_at: string
          fun_type: string
          id: string
          output_data: Json | null
          storage_path: string | null
          submission_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          fun_type: string
          id?: string
          output_data?: Json | null
          storage_path?: string | null
          submission_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          fun_type?: string
          id?: string
          output_data?: Json | null
          storage_path?: string | null
          submission_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fun_outputs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fun_outputs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquires: {
        Row: {
          commodity_type: string
          country_region: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          organization_name: string | null
          phone_number: string | null
          short_message: string | null
          source: string
          status: string
        }
        Insert: {
          commodity_type: string
          country_region?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          organization_name?: string | null
          phone_number?: string | null
          short_message?: string | null
          source?: string
          status?: string
        }
        Update: {
          commodity_type?: string
          country_region?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization_name?: string | null
          phone_number?: string | null
          short_message?: string | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      market_access_requests: {
        Row: {
          commodity: string
          created_at: string
          id: string
          preferred_market: Database["public"]["Enums"]["preferred_market_type"]
          status: Database["public"]["Enums"]["market_request_status"]
          submission_id: string
          user_id: string
          volume_estimate: string | null
        }
        Insert: {
          commodity: string
          created_at?: string
          id?: string
          preferred_market?: Database["public"]["Enums"]["preferred_market_type"]
          status?: Database["public"]["Enums"]["market_request_status"]
          submission_id: string
          user_id: string
          volume_estimate?: string | null
        }
        Update: {
          commodity?: string
          created_at?: string
          id?: string
          preferred_market?: Database["public"]["Enums"]["preferred_market_type"]
          status?: Database["public"]["Enums"]["market_request_status"]
          submission_id?: string
          user_id?: string
          volume_estimate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_access_requests_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_access_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_visit_logs: {
        Row: {
          id: string
          interactions_count: number | null
          page_path: string
          page_title: string | null
          referrer_path: string | null
          scroll_depth_percent: number | null
          visit_duration_seconds: number | null
          visited_at: string
          visitor_id: string
        }
        Insert: {
          id?: string
          interactions_count?: number | null
          page_path: string
          page_title?: string | null
          referrer_path?: string | null
          scroll_depth_percent?: number | null
          visit_duration_seconds?: number | null
          visited_at?: string
          visitor_id: string
        }
        Update: {
          id?: string
          interactions_count?: number | null
          page_path?: string
          page_title?: string | null
          referrer_path?: string | null
          scroll_depth_percent?: number | null
          visit_duration_seconds?: number | null
          visited_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_address: string | null
          company_name: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone_whatsapp: string | null
          profile_image_url: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_profile_role"] | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          company_address?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone_whatsapp?: string | null
          profile_image_url?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_profile_role"] | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          company_address?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone_whatsapp?: string | null
          profile_image_url?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_profile_role"] | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      redeemed_services: {
        Row: {
          access_expires_at: string
          access_minutes: number
          access_started_at: string
          created_at: string
          id: string
          is_active: boolean
          points_spent: number
          service_type: string
          visitor_id: string
        }
        Insert: {
          access_expires_at: string
          access_minutes: number
          access_started_at?: string
          created_at?: string
          id?: string
          is_active?: boolean
          points_spent: number
          service_type: string
          visitor_id: string
        }
        Update: {
          access_expires_at?: string
          access_minutes?: number
          access_started_at?: string
          created_at?: string
          id?: string
          is_active?: boolean
          points_spent?: number
          service_type?: string
          visitor_id?: string
        }
        Relationships: []
      }
      redemption_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_redeemed: boolean
          level_at_creation: string
          points_at_creation: number
          redeemed_at: string | null
          token: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_redeemed?: boolean
          level_at_creation?: string
          points_at_creation?: number
          redeemed_at?: string | null
          token: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_redeemed?: boolean
          level_at_creation?: string
          points_at_creation?: number
          redeemed_at?: string | null
          token?: string
          visitor_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          points_awarded: number | null
          referral_code: string
          referred_visitor_id: string | null
          referrer_visitor_id: string
          source: string | null
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number | null
          referral_code: string
          referred_visitor_id?: string | null
          referrer_visitor_id: string
          source?: string | null
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number | null
          referral_code?: string
          referred_visitor_id?: string | null
          referrer_visitor_id?: string
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      reward_points: {
        Row: {
          created_at: string
          current_level: string
          forms_submitted: number
          id: string
          images_generated: number
          last_activity_at: string
          messages_sent: number
          session_id: string
          total_points: number
          updated_at: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          current_level?: string
          forms_submitted?: number
          id?: string
          images_generated?: number
          last_activity_at?: string
          messages_sent?: number
          session_id: string
          total_points?: number
          updated_at?: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          current_level?: string
          forms_submitted?: number
          id?: string
          images_generated?: number
          last_activity_at?: string
          messages_sent?: number
          session_id?: string
          total_points?: number
          updated_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      reward_points_history: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          id: string
          points_awarded: number
          visitor_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          points_awarded: number
          visitor_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          points_awarded?: number
          visitor_id?: string
        }
        Relationships: []
      }
      service_catalog: {
        Row: {
          access_minutes: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          points_required: number
          service_key: string
          service_name: string
        }
        Insert: {
          access_minutes: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          points_required: number
          service_key: string
          service_name: string
        }
        Update: {
          access_minutes?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          points_required?: number
          service_key?: string
          service_name?: string
        }
        Relationships: []
      }
      submissions_research: {
        Row: {
          commodity: string
          country: string | null
          created_at: string
          id: string
          image_features_json: Json | null
          region: string | null
          result_json: Json
          source_submission_id: string | null
          tool_type: Database["public"]["Enums"]["analysis_tool_type"]
        }
        Insert: {
          commodity: string
          country?: string | null
          created_at?: string
          id?: string
          image_features_json?: Json | null
          region?: string | null
          result_json: Json
          source_submission_id?: string | null
          tool_type: Database["public"]["Enums"]["analysis_tool_type"]
        }
        Update: {
          commodity?: string
          country?: string | null
          created_at?: string
          id?: string
          image_features_json?: Json | null
          region?: string | null
          result_json?: Json
          source_submission_id?: string | null
          tool_type?: Database["public"]["Enums"]["analysis_tool_type"]
        }
        Relationships: [
          {
            foreignKeyName: "submissions_research_source_submission_id_fkey"
            columns: ["source_submission_id"]
            isOneToOne: false
            referencedRelation: "submissions_user"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions_user: {
        Row: {
          commodity: string
          consent_marketing: boolean
          consent_research: boolean
          consent_store_image: boolean
          created_at: string
          id: string
          image_path: string | null
          region: string | null
          result_json: Json
          tool_type: Database["public"]["Enums"]["analysis_tool_type"]
          user_id: string
        }
        Insert: {
          commodity: string
          consent_marketing?: boolean
          consent_research?: boolean
          consent_store_image?: boolean
          created_at?: string
          id?: string
          image_path?: string | null
          region?: string | null
          result_json: Json
          tool_type: Database["public"]["Enums"]["analysis_tool_type"]
          user_id: string
        }
        Update: {
          commodity?: string
          consent_marketing?: boolean
          consent_research?: boolean
          consent_store_image?: boolean
          created_at?: string
          id?: string
          image_path?: string | null
          region?: string | null
          result_json?: Json
          tool_type?: Database["public"]["Enums"]["analysis_tool_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_analyses: {
        Row: {
          commodity: string | null
          confidence_level: string | null
          created_at: string
          decision_signal: string | null
          destination: string | null
          id: string
          is_deep_research: boolean
          is_saved: boolean
          origin: string | null
          query: string
          result_json: Json
          risk_level: string | null
          summary: string | null
          updated_at: string
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          commodity?: string | null
          confidence_level?: string | null
          created_at?: string
          decision_signal?: string | null
          destination?: string | null
          id?: string
          is_deep_research?: boolean
          is_saved?: boolean
          origin?: string | null
          query: string
          result_json?: Json
          risk_level?: string | null
          summary?: string | null
          updated_at?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          commodity?: string | null
          confidence_level?: string | null
          created_at?: string
          decision_signal?: string | null
          destination?: string | null
          id?: string
          is_deep_research?: boolean
          is_saved?: boolean
          origin?: string | null
          query?: string
          result_json?: Json
          risk_level?: string | null
          summary?: string | null
          updated_at?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      user_recommendations: {
        Row: {
          clicked_at: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_clicked: boolean | null
          is_dismissed: boolean | null
          priority: number | null
          recommendation_type: string
          target_url: string | null
          title: string
          visitor_id: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_clicked?: boolean | null
          is_dismissed?: boolean | null
          priority?: number | null
          recommendation_type: string
          target_url?: string | null
          title: string
          visitor_id: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_clicked?: boolean | null
          is_dismissed?: boolean | null
          priority?: number | null
          recommendation_type?: string
          target_url?: string | null
          title?: string
          visitor_id?: string
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
      visitor_profiles: {
        Row: {
          business_type: string | null
          commodities_interested: string[] | null
          created_at: string
          device_type: string | null
          display_name: string | null
          documents_uploaded: number | null
          email: string | null
          first_visit_at: string
          forms_submitted: number | null
          id: string
          is_returning_user: boolean | null
          last_chat_topic: string | null
          last_commodity_viewed: string | null
          last_service_accessed: string | null
          last_visit_at: string
          messages_sent: number | null
          moisture_tests_completed: number | null
          onboarding_completed: boolean | null
          pages_visited: string[] | null
          preferred_commodities: string[] | null
          preferred_language: string | null
          preferred_regions: string[] | null
          search_queries: string[] | null
          services_accessed: string[] | null
          source_referrer: string | null
          total_session_duration_seconds: number | null
          total_visits: number | null
          updated_at: string
          user_role: string | null
          utm_campaign: string | null
          utm_source: string | null
          visitor_id: string
          welcome_back_shown: boolean | null
        }
        Insert: {
          business_type?: string | null
          commodities_interested?: string[] | null
          created_at?: string
          device_type?: string | null
          display_name?: string | null
          documents_uploaded?: number | null
          email?: string | null
          first_visit_at?: string
          forms_submitted?: number | null
          id?: string
          is_returning_user?: boolean | null
          last_chat_topic?: string | null
          last_commodity_viewed?: string | null
          last_service_accessed?: string | null
          last_visit_at?: string
          messages_sent?: number | null
          moisture_tests_completed?: number | null
          onboarding_completed?: boolean | null
          pages_visited?: string[] | null
          preferred_commodities?: string[] | null
          preferred_language?: string | null
          preferred_regions?: string[] | null
          search_queries?: string[] | null
          services_accessed?: string[] | null
          source_referrer?: string | null
          total_session_duration_seconds?: number | null
          total_visits?: number | null
          updated_at?: string
          user_role?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
          visitor_id: string
          welcome_back_shown?: boolean | null
        }
        Update: {
          business_type?: string | null
          commodities_interested?: string[] | null
          created_at?: string
          device_type?: string | null
          display_name?: string | null
          documents_uploaded?: number | null
          email?: string | null
          first_visit_at?: string
          forms_submitted?: number | null
          id?: string
          is_returning_user?: boolean | null
          last_chat_topic?: string | null
          last_commodity_viewed?: string | null
          last_service_accessed?: string | null
          last_visit_at?: string
          messages_sent?: number | null
          moisture_tests_completed?: number | null
          onboarding_completed?: boolean | null
          pages_visited?: string[] | null
          preferred_commodities?: string[] | null
          preferred_language?: string | null
          preferred_regions?: string[] | null
          search_queries?: string[] | null
          services_accessed?: string[] | null
          source_referrer?: string | null
          total_session_duration_seconds?: number | null
          total_visits?: number | null
          updated_at?: string
          user_role?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
          visitor_id?: string
          welcome_back_shown?: boolean | null
        }
        Relationships: []
      }
      waitlist_users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      commodity_listings_public: {
        Row: {
          admin_review_status:
            | Database["public"]["Enums"]["admin_review_status"]
            | null
          commodity_name: string | null
          created_at: string | null
          description: string | null
          destination_country: string | null
          id: string | null
          is_urgent: boolean | null
          is_visible: boolean | null
          listing_completeness:
            | Database["public"]["Enums"]["listing_completeness"]
            | null
          listing_type: string | null
          origin_country: string | null
          preferred_regions: string[] | null
          quantity: string | null
          quantity_unit: string | null
          region_of_origin: string | null
          status: string | null
          trade_readiness_stage:
            | Database["public"]["Enums"]["trade_readiness_stage"]
            | null
          updated_at: string | null
          visitor_id: string | null
        }
        Insert: {
          admin_review_status?:
            | Database["public"]["Enums"]["admin_review_status"]
            | null
          commodity_name?: string | null
          created_at?: string | null
          description?: string | null
          destination_country?: string | null
          id?: string | null
          is_urgent?: boolean | null
          is_visible?: boolean | null
          listing_completeness?:
            | Database["public"]["Enums"]["listing_completeness"]
            | null
          listing_type?: string | null
          origin_country?: string | null
          preferred_regions?: string[] | null
          quantity?: string | null
          quantity_unit?: string | null
          region_of_origin?: string | null
          status?: string | null
          trade_readiness_stage?:
            | Database["public"]["Enums"]["trade_readiness_stage"]
            | null
          updated_at?: string | null
          visitor_id?: string | null
        }
        Update: {
          admin_review_status?:
            | Database["public"]["Enums"]["admin_review_status"]
            | null
          commodity_name?: string | null
          created_at?: string | null
          description?: string | null
          destination_country?: string | null
          id?: string | null
          is_urgent?: boolean | null
          is_visible?: boolean | null
          listing_completeness?:
            | Database["public"]["Enums"]["listing_completeness"]
            | null
          listing_type?: string | null
          origin_country?: string | null
          preferred_regions?: string[] | null
          quantity?: string | null
          quantity_unit?: string | null
          region_of_origin?: string | null
          status?: string | null
          trade_readiness_stage?:
            | Database["public"]["Enums"]["trade_readiness_stage"]
            | null
          updated_at?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      admin_listing_tag:
        | "approved"
        | "clarification_needed"
        | "rejected"
        | "high_risk"
        | "promising"
      admin_review_status:
        | "pending"
        | "conditional"
        | "not_ready"
        | "approved"
        | "rejected"
      analysis_tool_type: "qc" | "moisture" | "kg"
      app_role: "admin" | "moderator" | "user"
      listing_completeness: "in_progress" | "optimized"
      market_request_status: "new" | "review" | "matched" | "closed"
      preferred_market_type: "local" | "export" | "both"
      trade_readiness_stage:
        | "explorer"
        | "emerging"
        | "trade_ready"
        | "institutional_ready"
      user_profile_role: "farmer" | "exporter" | "buyer" | "other"
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
      admin_listing_tag: [
        "approved",
        "clarification_needed",
        "rejected",
        "high_risk",
        "promising",
      ],
      admin_review_status: [
        "pending",
        "conditional",
        "not_ready",
        "approved",
        "rejected",
      ],
      analysis_tool_type: ["qc", "moisture", "kg"],
      app_role: ["admin", "moderator", "user"],
      listing_completeness: ["in_progress", "optimized"],
      market_request_status: ["new", "review", "matched", "closed"],
      preferred_market_type: ["local", "export", "both"],
      trade_readiness_stage: [
        "explorer",
        "emerging",
        "trade_ready",
        "institutional_ready",
      ],
      user_profile_role: ["farmer", "exporter", "buyer", "other"],
    },
  },
} as const
