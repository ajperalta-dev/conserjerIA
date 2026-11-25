// Generated from PostgreSQL information_schema by scripts/verify-database.mjs
export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          organization_id: string | null;
          action: string;
          resource_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          organization_id?: string | null;
          action: string;
          resource_id: string;
          created_at?: string;
        };
        Update: Partial<{
          id?: string;
          actor_id?: string | null;
          organization_id?: string | null;
          action: string;
          resource_id: string;
          created_at?: string;
        }>;
        Relationships: [];
      };
      consortium_members: {
        Row: {
          id: string;
          organization_id: string;
          consortium_id: string;
          user_id: string;
          role:
            | "SUPER_ADMIN"
            | "ADMIN"
            | "ACCOUNTANT"
            | "BOARD_MEMBER"
            | "OWNER"
            | "TENANT"
            | "MAINTENANCE";
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          consortium_id: string;
          user_id: string;
          role:
            | "SUPER_ADMIN"
            | "ADMIN"
            | "ACCOUNTANT"
            | "BOARD_MEMBER"
            | "OWNER"
            | "TENANT"
            | "MAINTENANCE";
          created_at?: string;
        };
        Update: Partial<{
          id?: string;
          organization_id: string;
          consortium_id: string;
          user_id: string;
          role:
            | "SUPER_ADMIN"
            | "ADMIN"
            | "ACCOUNTANT"
            | "BOARD_MEMBER"
            | "OWNER"
            | "TENANT"
            | "MAINTENANCE";
          created_at?: string;
        }>;
        Relationships: [];
      };
      consortiums: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<{
          id?: string;
          organization_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        }>;
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          organization_id: string;
          consortium_id: string;
          email: string;
          role:
            | "SUPER_ADMIN"
            | "ADMIN"
            | "ACCOUNTANT"
            | "BOARD_MEMBER"
            | "OWNER"
            | "TENANT"
            | "MAINTENANCE";
          created_by: string;
          created_at: string;
          expires_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          consortium_id: string;
          email: string;
          role:
            | "SUPER_ADMIN"
            | "ADMIN"
            | "ACCOUNTANT"
            | "BOARD_MEMBER"
            | "OWNER"
            | "TENANT"
            | "MAINTENANCE";
          created_by?: string;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
        };
        Update: Partial<{
          id?: string;
          organization_id: string;
          consortium_id: string;
          email: string;
          role:
            | "SUPER_ADMIN"
            | "ADMIN"
            | "ACCOUNTANT"
            | "BOARD_MEMBER"
            | "OWNER"
            | "TENANT"
            | "MAINTENANCE";
          created_by?: string;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
        }>;
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role:
            | "SUPER_ADMIN"
            | "ADMIN"
            | "ACCOUNTANT"
            | "BOARD_MEMBER"
            | "OWNER"
            | "TENANT"
            | "MAINTENANCE";
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role:
            | "SUPER_ADMIN"
            | "ADMIN"
            | "ACCOUNTANT"
            | "BOARD_MEMBER"
            | "OWNER"
            | "TENANT"
            | "MAINTENANCE";
          created_at?: string;
        };
        Update: Partial<{
          id?: string;
          organization_id: string;
          user_id: string;
          role:
            | "SUPER_ADMIN"
            | "ADMIN"
            | "ACCOUNTANT"
            | "BOARD_MEMBER"
            | "OWNER"
            | "TENANT"
            | "MAINTENANCE";
          created_at?: string;
        }>;
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<{
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        }>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        }>;
        Relationships: [];
      };
      role_permissions: {
        Row: {
          id: string;
          role:
            | "SUPER_ADMIN"
            | "ADMIN"
            | "ACCOUNTANT"
            | "BOARD_MEMBER"
            | "OWNER"
            | "TENANT"
            | "MAINTENANCE";
          permission: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          role:
            | "SUPER_ADMIN"
            | "ADMIN"
            | "ACCOUNTANT"
            | "BOARD_MEMBER"
            | "OWNER"
            | "TENANT"
            | "MAINTENANCE";
          permission: string;
          created_at?: string;
        };
        Update: Partial<{
          id?: string;
          role:
            | "SUPER_ADMIN"
            | "ADMIN"
            | "ACCOUNTANT"
            | "BOARD_MEMBER"
            | "OWNER"
            | "TENANT"
            | "MAINTENANCE";
          permission: string;
          created_at?: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_permission: {
        Args: { target: string; action: string };
        Returns: boolean;
      };
      accept_invitation: {
        Args: { invitation_id: string };
        Returns: undefined;
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
    CompositeTypes: Record<string, never>;
  };
};
