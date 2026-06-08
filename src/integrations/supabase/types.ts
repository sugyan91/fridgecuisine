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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abuse_alert_state: {
        Row: {
          id: boolean
          last_alert_sent_at: string | null
          last_event_count: number
          last_window_minutes: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          last_alert_sent_at?: string | null
          last_event_count?: number
          last_window_minutes?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          last_alert_sent_at?: string | null
          last_event_count?: number
          last_window_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      abuse_events: {
        Row: {
          created_at: string
          event_type: string
          fingerprint: string | null
          id: string
          ip_hash: string | null
          metadata: Json
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          fingerprint?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          fingerprint?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      anonymous_ai_usage: {
        Row: {
          count: number
          day_count: number
          day_date: string
          fingerprint: string
          first_seen_at: string
          ip_change_count: number
          last_ip_hash: string | null
          last_seen_at: string
          last_user_agent: string | null
          quota_hit_count: number
          rapid_request_count: number
        }
        Insert: {
          count?: number
          day_count?: number
          day_date?: string
          fingerprint: string
          first_seen_at?: string
          ip_change_count?: number
          last_ip_hash?: string | null
          last_seen_at?: string
          last_user_agent?: string | null
          quota_hit_count?: number
          rapid_request_count?: number
        }
        Update: {
          count?: number
          day_count?: number
          day_date?: string
          fingerprint?: string
          first_seen_at?: string
          ip_change_count?: number
          last_ip_hash?: string | null
          last_seen_at?: string
          last_user_agent?: string | null
          quota_hit_count?: number
          rapid_request_count?: number
        }
        Relationships: []
      }
      anonymous_ai_usage_by_ip: {
        Row: {
          day_count: number
          day_date: string
          ip_hash: string
          last_seen_at: string
          total_count: number
        }
        Insert: {
          day_count?: number
          day_date?: string
          ip_hash: string
          last_seen_at?: string
          total_count?: number
        }
        Update: {
          day_count?: number
          day_date?: string
          ip_hash?: string
          last_seen_at?: string
          total_count?: number
        }
        Relationships: []
      }
      chef_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          charges_enabled: boolean
          country: string | null
          created_at: string
          id: string
          onboarding_completed_at: string | null
          payouts_enabled: boolean
          stripe_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          charges_enabled?: boolean
          country?: string | null
          created_at?: string
          id?: string
          onboarding_completed_at?: string | null
          payouts_enabled?: boolean
          stripe_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          charges_enabled?: boolean
          country?: string | null
          created_at?: string
          id?: string
          onboarding_completed_at?: string | null
          payouts_enabled?: boolean
          stripe_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          added_at: string
          collection_id: string
          position: number
          saved_recipe_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          position?: number
          saved_recipe_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          position?: number
          saved_recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "recipe_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_saved_recipe_id_fkey"
            columns: ["saved_recipe_id"]
            isOneToOne: false
            referencedRelation: "saved_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      community_recipe_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          recipe_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          recipe_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          recipe_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_recipe_likes: {
        Row: {
          created_at: string
          recipe_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          recipe_id: string
          user_id: string
          vote_type?: string
        }
        Update: {
          created_at?: string
          recipe_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_recipe_likes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "community_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      community_recipes: {
        Row: {
          city: string | null
          comments_enabled: boolean
          country: string | null
          created_at: string
          cuisine: string | null
          description: string | null
          dietary: string[]
          history: string | null
          id: string
          image_url: string | null
          ingredients: Json
          is_published: boolean
          steps: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          comments_enabled?: boolean
          country?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          dietary?: string[]
          history?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          is_published?: boolean
          steps?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          comments_enabled?: boolean
          country?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          dietary?: string[]
          history?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          is_published?: boolean
          steps?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cookbook_recipes: {
        Row: {
          cookbook_id: string
          paid_recipe_id: string
          position: number
        }
        Insert: {
          cookbook_id: string
          paid_recipe_id: string
          position?: number
        }
        Update: {
          cookbook_id?: string
          paid_recipe_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "cookbook_recipes_cookbook_id_fkey"
            columns: ["cookbook_id"]
            isOneToOne: false
            referencedRelation: "cookbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cookbook_recipes_paid_recipe_id_fkey"
            columns: ["paid_recipe_id"]
            isOneToOne: false
            referencedRelation: "paid_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cookbook_recipes_paid_recipe_id_fkey"
            columns: ["paid_recipe_id"]
            isOneToOne: false
            referencedRelation: "paid_recipes_preview"
            referencedColumns: ["id"]
          },
        ]
      }
      cookbooks: {
        Row: {
          chef_user_id: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          price_cents: number
          title: string
          updated_at: string
        }
        Insert: {
          chef_user_id: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          price_cents: number
          title: string
          updated_at?: string
        }
        Update: {
          chef_user_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          price_cents?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      meal_plan_entries: {
        Row: {
          created_at: string
          id: string
          meal_slot: string
          plan_date: string
          position: number
          saved_recipe_id: string
          servings_override: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_slot: string
          plan_date: string
          position?: number
          saved_recipe_id: string
          servings_override?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_slot?: string
          plan_date?: string
          position?: number
          saved_recipe_id?: string
          servings_override?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_entries_saved_recipe_id_fkey"
            columns: ["saved_recipe_id"]
            isOneToOne: false
            referencedRelation: "saved_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      paid_recipes: {
        Row: {
          chef_user_id: string
          city: string | null
          cook_minutes: number | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          cuisine: string | null
          description: string | null
          dietary: string[]
          id: string
          ingredients: Json
          is_published: boolean
          local_name: string | null
          prep_minutes: number | null
          price_cents: number
          serves: string | null
          steps: Json
          tips: Json
          title: string
          updated_at: string
        }
        Insert: {
          chef_user_id: string
          city?: string | null
          cook_minutes?: number | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          dietary?: string[]
          id?: string
          ingredients?: Json
          is_published?: boolean
          local_name?: string | null
          prep_minutes?: number | null
          price_cents: number
          serves?: string | null
          steps?: Json
          tips?: Json
          title: string
          updated_at?: string
        }
        Update: {
          chef_user_id?: string
          city?: string | null
          cook_minutes?: number | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          dietary?: string[]
          id?: string
          ingredients?: Json
          is_published?: boolean
          local_name?: string | null
          prep_minutes?: number | null
          price_cents?: number
          serves?: string | null
          steps?: Json
          tips?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      recipe_collections: {
        Row: {
          color: string | null
          created_at: string
          emoji: string | null
          id: string
          is_public: boolean
          name: string
          slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          is_public?: boolean
          name: string
          slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          is_public?: boolean
          name?: string
          slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_generations: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_purchases: {
        Row: {
          buyer_user_id: string
          chef_net_cents: number
          chef_user_id: string
          cookbook_id: string | null
          created_at: string
          currency: string
          gross_cents: number
          id: string
          paid_recipe_id: string | null
          platform_fee_cents: number
          purchased_at: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_user_id: string
          chef_net_cents: number
          chef_user_id: string
          cookbook_id?: string | null
          created_at?: string
          currency?: string
          gross_cents: number
          id?: string
          paid_recipe_id?: string | null
          platform_fee_cents: number
          purchased_at?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_user_id?: string
          chef_net_cents?: number
          chef_user_id?: string
          cookbook_id?: string | null
          created_at?: string
          currency?: string
          gross_cents?: number
          id?: string
          paid_recipe_id?: string | null
          platform_fee_cents?: number
          purchased_at?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_purchases_cookbook_id_fkey"
            columns: ["cookbook_id"]
            isOneToOne: false
            referencedRelation: "cookbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_purchases_paid_recipe_id_fkey"
            columns: ["paid_recipe_id"]
            isOneToOne: false
            referencedRelation: "paid_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_purchases_paid_recipe_id_fkey"
            columns: ["paid_recipe_id"]
            isOneToOne: false
            referencedRelation: "paid_recipes_preview"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_recipes: {
        Row: {
          cook_time_minutes: number | null
          cooked_at: string | null
          cuisine: string | null
          id: string
          recipe: Json
          saved_at: string
          title: string
          user_id: string
        }
        Insert: {
          cook_time_minutes?: number | null
          cooked_at?: string | null
          cuisine?: string | null
          id?: string
          recipe: Json
          saved_at?: string
          title: string
          user_id: string
        }
        Update: {
          cook_time_minutes?: number | null
          cooked_at?: string | null
          cuisine?: string | null
          id?: string
          recipe?: Json
          saved_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_recipes: {
        Row: {
          created_at: string
          created_by: string | null
          cuisine: string | null
          id: string
          recipe: Json
          slug: string
          title: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cuisine?: string | null
          id?: string
          recipe: Json
          slug: string
          title: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cuisine?: string | null
          id?: string
          recipe?: Json
          slug?: string
          title?: string
          view_count?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          custom_cuisines: string[]
          custom_dietary: string[]
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_cuisines?: string[]
          custom_dietary?: string[]
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_cuisines?: string[]
          custom_dietary?: string[]
          id?: string
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
    }
    Views: {
      paid_recipes_preview: {
        Row: {
          chef_user_id: string | null
          cook_minutes: number | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          cuisine: string | null
          description: string | null
          dietary: string[] | null
          id: string | null
          is_published: boolean | null
          prep_minutes: number | null
          price_cents: number | null
          serves: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          chef_user_id?: string | null
          cook_minutes?: number | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          dietary?: string[] | null
          id?: string | null
          is_published?: boolean | null
          prep_minutes?: number | null
          price_cents?: number | null
          serves?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          chef_user_id?: string | null
          cook_minutes?: number | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          dietary?: string[] | null
          id?: string | null
          is_published?: boolean | null
          prep_minutes?: number | null
          price_cents?: number | null
          serves?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_comment_on_recipe: { Args: { _recipe_id: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_for_username: { Args: { _username: string }; Returns: string }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_purchased_cookbook: {
        Args: { _cookbook_id: string; _user_id: string }
        Returns: boolean
      }
      has_purchased_recipe: {
        Args: { _recipe_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_recipe_owner: { Args: { _recipe_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      username_available: { Args: { _username: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
