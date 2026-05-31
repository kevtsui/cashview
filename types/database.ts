// Manually-maintained types matching the Supabase schema.
// Once you have `supabase gen types typescript` set up you can replace this.

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["households"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["households"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          household_id: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      // plaid_items: clients should never select access_token.
      // Use plaid_items_safe view instead (see migration SQL).
      plaid_items_safe: {
        Row: {
          id: string;
          household_id: string;
          item_id: string;
          institution_id: string | null;
          institution_name: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          household_id: string;
          plaid_item_id: string;
          plaid_account_id: string;
          name: string;
          official_name: string | null;
          type: string;
          subtype: string | null;
          current_balance: number | null;
          available_balance: number | null;
          currency_code: string;
          last_updated: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["accounts"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["accounts"]["Insert"]>;
      };
    };
  };
}

export type Household = Database["public"]["Tables"]["households"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type PlaidItemSafe = Database["public"]["Tables"]["plaid_items_safe"]["Row"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
