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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          prompt_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message: string
          prompt_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          prompt_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_model: string
          default_style: string
          email: string | null
          full_name: string | null
          id: string
          plan: string
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_model?: string
          default_style?: string
          email?: string | null
          full_name?: string | null
          id: string
          plan?: string
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_model?: string
          default_style?: string
          email?: string | null
          full_name?: string | null
          id?: string
          plan?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_tests: {
        Row: {
          cost: number
          created_at: string
          id: string
          latency_ms: number
          max_tokens: number
          model: string
          prompt_id: string | null
          prompt_text: string
          quality_score: number
          response: string | null
          temperature: number
          tokens: number
          user_id: string
          variables: Json
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          latency_ms?: number
          max_tokens?: number
          model?: string
          prompt_id?: string | null
          prompt_text: string
          quality_score?: number
          response?: string | null
          temperature?: number
          tokens?: number
          user_id: string
          variables?: Json
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          latency_ms?: number
          max_tokens?: number
          model?: string
          prompt_id?: string | null
          prompt_text?: string
          quality_score?: number
          response?: string | null
          temperature?: number
          tokens?: number
          user_id?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "prompt_tests_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          content: string
          created_at: string
          id: string
          note: string | null
          prompt_id: string
          quality_score: number
          user_id: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          note?: string | null
          prompt_id: string
          quality_score?: number
          user_id: string
          version: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          note?: string | null
          prompt_id?: string
          quality_score?: number
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          category: string
          content: string
          created_at: string
          folder_id: string | null
          id: string
          idea: string | null
          is_favorite: boolean
          model: string
          quality_score: number
          score_breakdown: Json
          style: string
          suggestions: Json
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          folder_id?: string | null
          id?: string
          idea?: string | null
          is_favorite?: boolean
          model?: string
          quality_score?: number
          score_breakdown?: Json
          style?: string
          suggestions?: Json
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          folder_id?: string | null
          id?: string
          idea?: string | null
          is_favorite?: boolean
          model?: string
          quality_score?: number
          score_breakdown?: Json
          style?: string
          suggestions?: Json
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string
          content: string
          created_at: string
          description: string
          id: string
          quality_score: number
          recommended_model: string
          title: string
          variables: string[]
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          description: string
          id?: string
          quality_score?: number
          recommended_model?: string
          title: string
          variables?: string[]
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          description?: string
          id?: string
          quality_score?: number
          recommended_model?: string
          title?: string
          variables?: string[]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
