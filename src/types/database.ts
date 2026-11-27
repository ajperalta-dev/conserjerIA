export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          id: string;
          organization_id: string | null;
          resource_id: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          organization_id?: string | null;
          resource_id: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          organization_id?: string | null;
          resource_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_groups: {
        Row: {
          consortium_id: string;
          id: string;
          name: string;
        };
        Insert: {
          consortium_id: string;
          id?: string;
          name: string;
        };
        Update: {
          consortium_id?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_groups_consortium_id_fkey";
            columns: ["consortium_id"];
            isOneToOne: false;
            referencedRelation: "consortiums";
            referencedColumns: ["id"];
          },
        ];
      };
      buildings: {
        Row: {
          archived_at: string | null;
          consortium_id: string;
          id: string;
          kind: string;
          name: string;
        };
        Insert: {
          archived_at?: string | null;
          consortium_id: string;
          id?: string;
          kind: string;
          name: string;
        };
        Update: {
          archived_at?: string | null;
          consortium_id?: string;
          id?: string;
          kind?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "buildings_consortium_id_fkey";
            columns: ["consortium_id"];
            isOneToOne: false;
            referencedRelation: "consortiums";
            referencedColumns: ["id"];
          },
        ];
      };
      consortium_details: {
        Row: {
          address: string | null;
          bylaws: string | null;
          cadastral_code: string | null;
          closing_day: number | null;
          closing_month: number | null;
          consortium_id: string;
          construction_year: number | null;
          cuit: string | null;
          department: string | null;
          emergency_contacts: string | null;
          insurance: string | null;
          latitude: number | null;
          locality: string | null;
          longitude: number | null;
          postal_code: string | null;
          province: string | null;
        };
        Insert: {
          address?: string | null;
          bylaws?: string | null;
          cadastral_code?: string | null;
          closing_day?: number | null;
          closing_month?: number | null;
          consortium_id: string;
          construction_year?: number | null;
          cuit?: string | null;
          department?: string | null;
          emergency_contacts?: string | null;
          insurance?: string | null;
          latitude?: number | null;
          locality?: string | null;
          longitude?: number | null;
          postal_code?: string | null;
          province?: string | null;
        };
        Update: {
          address?: string | null;
          bylaws?: string | null;
          cadastral_code?: string | null;
          closing_day?: number | null;
          closing_month?: number | null;
          consortium_id?: string;
          construction_year?: number | null;
          cuit?: string | null;
          department?: string | null;
          emergency_contacts?: string | null;
          insurance?: string | null;
          latitude?: number | null;
          locality?: string | null;
          longitude?: number | null;
          postal_code?: string | null;
          province?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consortium_details_consortium_id_fkey";
            columns: ["consortium_id"];
            isOneToOne: true;
            referencedRelation: "consortiums";
            referencedColumns: ["id"];
          },
        ];
      };
      consortium_members: {
        Row: {
          consortium_id: string;
          created_at: string;
          id: string;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          consortium_id: string;
          created_at?: string;
          id?: string;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          consortium_id?: string;
          created_at?: string;
          id?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consortium_members_organization_id_consortium_id_fkey";
            columns: ["organization_id", "consortium_id"];
            isOneToOne: false;
            referencedRelation: "consortiums";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "consortium_members_organization_id_user_id_fkey";
            columns: ["organization_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "organization_members";
            referencedColumns: ["organization_id", "user_id"];
          },
        ];
      };
      consortiums: {
        Row: {
          archived_at: string | null;
          created_at: string;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consortiums_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      floors: {
        Row: {
          archived_at: string | null;
          building_id: string;
          consortium_id: string;
          id: string;
          level: number;
          name: string;
        };
        Insert: {
          archived_at?: string | null;
          building_id: string;
          consortium_id: string;
          id?: string;
          level: number;
          name: string;
        };
        Update: {
          archived_at?: string | null;
          building_id?: string;
          consortium_id?: string;
          id?: string;
          level?: number;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "floors_consortium_id_building_id_fkey";
            columns: ["consortium_id", "building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["consortium_id", "id"];
          },
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          consortium_id: string;
          created_at: string;
          created_by: string;
          email: string;
          expires_at: string;
          id: string;
          organization_id: string;
          resident_id: string | null;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          accepted_at?: string | null;
          consortium_id: string;
          created_at?: string;
          created_by?: string;
          email: string;
          expires_at?: string;
          id?: string;
          organization_id: string;
          resident_id?: string | null;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          accepted_at?: string | null;
          consortium_id?: string;
          created_at?: string;
          created_by?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          organization_id?: string;
          resident_id?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [
          {
            foreignKeyName: "invitations_consortium_id_resident_id_fkey";
            columns: ["consortium_id", "resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["consortium_id", "id"];
          },
          {
            foreignKeyName: "invitations_organization_id_consortium_id_fkey";
            columns: ["organization_id", "consortium_id"];
            isOneToOne: false;
            referencedRelation: "consortiums";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      lease_contracts: {
        Row: {
          consortium_id: string;
          ends_on: string;
          id: string;
          landlord_id: string;
          occupancy_id: string;
          reference: string | null;
          starts_on: string;
          unit_id: string;
        };
        Insert: {
          consortium_id: string;
          ends_on: string;
          id?: string;
          landlord_id: string;
          occupancy_id: string;
          reference?: string | null;
          starts_on: string;
          unit_id: string;
        };
        Update: {
          consortium_id?: string;
          ends_on?: string;
          id?: string;
          landlord_id?: string;
          occupancy_id?: string;
          reference?: string | null;
          starts_on?: string;
          unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lease_contracts_consortium_id_landlord_id_fkey";
            columns: ["consortium_id", "landlord_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["consortium_id", "id"];
          },
          {
            foreignKeyName: "lease_contracts_consortium_id_unit_id_occupancy_id_fkey";
            columns: ["consortium_id", "unit_id", "occupancy_id"];
            isOneToOne: false;
            referencedRelation: "occupancies";
            referencedColumns: ["consortium_id", "unit_id", "id"];
          },
        ];
      };
      occupancies: {
        Row: {
          consortium_id: string;
          ends_on: string | null;
          id: string;
          kind: string;
          resident_id: string;
          starts_on: string;
          unit_id: string;
        };
        Insert: {
          consortium_id: string;
          ends_on?: string | null;
          id?: string;
          kind: string;
          resident_id: string;
          starts_on: string;
          unit_id: string;
        };
        Update: {
          consortium_id?: string;
          ends_on?: string | null;
          id?: string;
          kind?: string;
          resident_id?: string;
          starts_on?: string;
          unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "occupancies_consortium_id_resident_id_fkey";
            columns: ["consortium_id", "resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["consortium_id", "id"];
          },
          {
            foreignKeyName: "occupancies_consortium_id_unit_id_fkey";
            columns: ["consortium_id", "unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["consortium_id", "id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          archived_at: string | null;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_responsibilities: {
        Row: {
          concept: string;
          consortium_id: string;
          ends_on: string | null;
          id: string;
          resident_id: string;
          starts_on: string;
          unit_id: string;
        };
        Insert: {
          concept: string;
          consortium_id: string;
          ends_on?: string | null;
          id?: string;
          resident_id: string;
          starts_on: string;
          unit_id: string;
        };
        Update: {
          concept?: string;
          consortium_id?: string;
          ends_on?: string | null;
          id?: string;
          resident_id?: string;
          starts_on?: string;
          unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_responsibilities_consortium_id_resident_id_fkey";
            columns: ["consortium_id", "resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["consortium_id", "id"];
          },
          {
            foreignKeyName: "payment_responsibilities_consortium_id_unit_id_fkey";
            columns: ["consortium_id", "unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["consortium_id", "id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      property_bank_details: {
        Row: {
          account_holder: string | null;
          bank_alias: string | null;
          bank_name: string | null;
          cbu: string | null;
          consortium_id: string;
        };
        Insert: {
          account_holder?: string | null;
          bank_alias?: string | null;
          bank_name?: string | null;
          cbu?: string | null;
          consortium_id: string;
        };
        Update: {
          account_holder?: string | null;
          bank_alias?: string | null;
          bank_name?: string | null;
          cbu?: string | null;
          consortium_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_bank_details_consortium_id_fkey";
            columns: ["consortium_id"];
            isOneToOne: true;
            referencedRelation: "consortiums";
            referencedColumns: ["id"];
          },
        ];
      };
      property_files: {
        Row: {
          consortium_id: string;
          id: string;
          kind: string;
          label: string;
          path: string;
          unit_id: string | null;
        };
        Insert: {
          consortium_id: string;
          id?: string;
          kind: string;
          label: string;
          path: string;
          unit_id?: string | null;
        };
        Update: {
          consortium_id?: string;
          id?: string;
          kind?: string;
          label?: string;
          path?: string;
          unit_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "property_files_consortium_id_fkey";
            columns: ["consortium_id"];
            isOneToOne: false;
            referencedRelation: "consortiums";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_files_consortium_id_unit_id_fkey";
            columns: ["consortium_id", "unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["consortium_id", "id"];
          },
        ];
      };
      property_history: {
        Row: {
          actor_id: string | null;
          consortium_id: string;
          created_at: string;
          entity: string;
          entity_id: string;
          fields: string[];
          id: string;
          operation: string;
        };
        Insert: {
          actor_id?: string | null;
          consortium_id: string;
          created_at?: string;
          entity: string;
          entity_id: string;
          fields: string[];
          id?: string;
          operation: string;
        };
        Update: {
          actor_id?: string | null;
          consortium_id?: string;
          created_at?: string;
          entity?: string;
          entity_id?: string;
          fields?: string[];
          id?: string;
          operation?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_history_consortium_id_fkey";
            columns: ["consortium_id"];
            isOneToOne: false;
            referencedRelation: "consortiums";
            referencedColumns: ["id"];
          },
        ];
      };
      residents: {
        Row: {
          archived_at: string | null;
          consortium_id: string;
          cuit: string | null;
          dni: string | null;
          email: string | null;
          emergency_contact: string | null;
          id: string;
          name: string;
          phone: string | null;
          user_id: string | null;
        };
        Insert: {
          archived_at?: string | null;
          consortium_id: string;
          cuit?: string | null;
          dni?: string | null;
          email?: string | null;
          emergency_contact?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          user_id?: string | null;
        };
        Update: {
          archived_at?: string | null;
          consortium_id?: string;
          cuit?: string | null;
          dni?: string | null;
          email?: string | null;
          emergency_contact?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "residents_consortium_id_fkey";
            columns: ["consortium_id"];
            isOneToOne: false;
            referencedRelation: "consortiums";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "residents_consortium_id_user_id_fkey";
            columns: ["consortium_id", "user_id"];
            isOneToOne: true;
            referencedRelation: "consortium_members";
            referencedColumns: ["consortium_id", "user_id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          created_at: string;
          id: string;
          permission: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          permission: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          created_at?: string;
          id?: string;
          permission?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      unit_coefficients: {
        Row: {
          consortium_id: string;
          effective_from: string;
          expenses: number;
          id: string;
          ownership: number;
          unit_id: string;
        };
        Insert: {
          consortium_id: string;
          effective_from: string;
          expenses: number;
          id?: string;
          ownership: number;
          unit_id: string;
        };
        Update: {
          consortium_id?: string;
          effective_from?: string;
          expenses?: number;
          id?: string;
          ownership?: number;
          unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "unit_coefficients_consortium_id_unit_id_fkey";
            columns: ["consortium_id", "unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["consortium_id", "id"];
          },
        ];
      };
      unit_ownerships: {
        Row: {
          consortium_id: string;
          ends_on: string | null;
          id: string;
          resident_id: string;
          share: number;
          starts_on: string;
          unit_id: string;
        };
        Insert: {
          consortium_id: string;
          ends_on?: string | null;
          id?: string;
          resident_id: string;
          share: number;
          starts_on: string;
          unit_id: string;
        };
        Update: {
          consortium_id?: string;
          ends_on?: string | null;
          id?: string;
          resident_id?: string;
          share?: number;
          starts_on?: string;
          unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "unit_ownerships_consortium_id_resident_id_fkey";
            columns: ["consortium_id", "resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["consortium_id", "id"];
          },
          {
            foreignKeyName: "unit_ownerships_consortium_id_unit_id_fkey";
            columns: ["consortium_id", "unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["consortium_id", "id"];
          },
        ];
      };
      unit_relationships: {
        Row: {
          consortium_id: string;
          description: string | null;
          id: string;
          related_unit_id: string;
          unit_id: string;
        };
        Insert: {
          consortium_id: string;
          description?: string | null;
          id?: string;
          related_unit_id: string;
          unit_id: string;
        };
        Update: {
          consortium_id?: string;
          description?: string | null;
          id?: string;
          related_unit_id?: string;
          unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "unit_relationships_consortium_id_related_unit_id_fkey";
            columns: ["consortium_id", "related_unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["consortium_id", "id"];
          },
          {
            foreignKeyName: "unit_relationships_consortium_id_unit_id_fkey";
            columns: ["consortium_id", "unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["consortium_id", "id"];
          },
        ];
      };
      units: {
        Row: {
          archived_at: string | null;
          billing_group_id: string | null;
          cadastral_code: string | null;
          common_area: number | null;
          consortium_id: string;
          covered: number | null;
          floor_id: string;
          id: string;
          kind: string;
          meters: string | null;
          name: string;
          registry_code: string;
          semi_covered: number | null;
          total_area: number | null;
          uncovered: number | null;
        };
        Insert: {
          archived_at?: string | null;
          billing_group_id?: string | null;
          cadastral_code?: string | null;
          common_area?: number | null;
          consortium_id: string;
          covered?: number | null;
          floor_id: string;
          id?: string;
          kind: string;
          meters?: string | null;
          name: string;
          registry_code: string;
          semi_covered?: number | null;
          total_area?: number | null;
          uncovered?: number | null;
        };
        Update: {
          archived_at?: string | null;
          billing_group_id?: string | null;
          cadastral_code?: string | null;
          common_area?: number | null;
          consortium_id?: string;
          covered?: number | null;
          floor_id?: string;
          id?: string;
          kind?: string;
          meters?: string | null;
          name?: string;
          registry_code?: string;
          semi_covered?: number | null;
          total_area?: number | null;
          uncovered?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "units_consortium_id_billing_group_id_fkey";
            columns: ["consortium_id", "billing_group_id"];
            isOneToOne: false;
            referencedRelation: "billing_groups";
            referencedColumns: ["consortium_id", "id"];
          },
          {
            foreignKeyName: "units_consortium_id_floor_id_fkey";
            columns: ["consortium_id", "floor_id"];
            isOneToOne: false;
            referencedRelation: "floors";
            referencedColumns: ["consortium_id", "id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: {
        Args: { invitation_id: string };
        Returns: undefined;
      };
      create_property_consortium: {
        Args: { label: string; org: string };
        Returns: string;
      };
      has_permission: {
        Args: { action: string; target: string };
        Returns: boolean;
      };
      property_admins: {
        Args: { target: string };
        Returns: {
          display_name: string;
          user_id: string;
        }[];
      };
    };
    Enums: {
      app_role:
        | "SUPER_ADMIN"
        | "ADMIN"
        | "ACCOUNTANT"
        | "BOARD_MEMBER"
        | "OWNER"
        | "TENANT"
        | "MAINTENANCE";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "SUPER_ADMIN",
        "ADMIN",
        "ACCOUNTANT",
        "BOARD_MEMBER",
        "OWNER",
        "TENANT",
        "MAINTENANCE",
      ],
    },
  },
} as const;
