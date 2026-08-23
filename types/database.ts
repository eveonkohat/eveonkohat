export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type TenantRow = {
  id: string
  name: string
  owner_name: string | null
  phone: string | null
  address: string | null
  logo_url: string | null
  plan_type: string
  showroom_type: string | null
  status: "Active" | "Suspended" | "Trial"
  max_users: number
  max_vehicles: number
  created_at: string
  updated_at: string
}

type ProfileRow = {
  id: string
  tenant_id: string
  full_name: string | null
  email: string
  role: "tenant-owner" | "manager" | "staff"
  permissions: string[]
  created_at: string
  updated_at: string
}

type PartyRow = {
  id: string
  tenant_id: string
  name: string
  contact_person: string | null
  phone: string | null
  address: string | null
  opening_balance: number
  current_balance: number
  notes: string | null
  created_at: string
  updated_at: string
}

type AccountRow = {
  id: string
  tenant_id: string
  type: "cash" | "bank"
  name: string
  address: string | null
  opening_balance: number
  current_balance: number
  created_at: string
  updated_at: string
}

type AccountTransactionRow = {
  id: string
  tenant_id: string
  account_id: string | null
  to_account_id: string | null
  date: string
  direction: "in" | "out"
  category: string | null
  description: string | null
  amount: number
  source_type:
    | "sale"
    | "purchase"
    | "expense"
    | "installment_payment"
    | "transfer"
    | "other_income"
    | "manual"
  source_id: string | null
  created_at: string
}

type PurchaseRow = {
  id: string
  tenant_id: string
  order_code: string
  party_id: string | null
  date: string
  vehicle_type: string
  make: string
  model: string
  color: string | null
  year: number | null
  purchase_price: number
  tax_per_unit: number
  carriage_per_unit: number
  quantity: number
  total_amount: number
  paid_amount: number
  balance: number
  status: string
  notes: string | null
  created_at: string
}

type BikeRow = {
  id: string
  tenant_id: string
  purchase_id: string | null
  make: string
  model: string
  year: number | null
  color: string | null
  vehicle_type: string
  chassis_no: string | null
  engine_no: string | null
  purchase_price: number
  sold_price: number | null
  status: "in_stock" | "sold" | "returned"
  created_at: string
  updated_at: string
}

type PurchaseReturnRow = {
  id: string
  tenant_id: string
  bike_id: string
  return_date: string
  agreed_return_amount: number
  notes: string | null
  created_at: string
}

type OtherItemRow = {
  id: string
  tenant_id: string
  party_id: string | null
  date: string
  item_name: string
  quantity: number
  quantity_remaining: number
  unit_price: number
  total_amount: number
  paid_amount: number
  balance: number
  payment_account_id: string | null
  description: string | null
  created_at: string
}

type BikeSaleRow = {
  id: string
  tenant_id: string
  order_code: string
  bike_id: string | null
  customer_name: string
  customer_cnic: string | null
  customer_phone: string | null
  date: string
  total_amount: number
  received_amount: number
  balance: number
  payment_status: "received" | "partial" | "pending"
  payment_account_id: string | null
  notes: string | null
  created_at: string
}

export type PosSaleItem = {
  description: string
  qty: number
  uom: string
  rate: number
  amount: number
}

type PosSaleRow = {
  id: string
  tenant_id: string
  order_code: string
  customer_name: string
  customer_phone: string | null
  date: string
  items: PosSaleItem[]
  terms_and_conditions: string | null
  grand_total: number
  received_amount: number
  balance: number
  payment_account_id: string | null
  invoice_notes: string | null
  payment_slip_url: string | null
  created_at: string
}

type InstallmentCustomerRow = {
  id: string
  tenant_id: string
  customer_code: string
  name: string
  father_name: string | null
  cnic: string | null
  phone: string | null
  address: string | null
  guarantor_name: string | null
  guarantor_cnic: string | null
  guarantor_phone: string | null
  registration_date: string
  created_at: string
  updated_at: string
}

type InstallmentSaleRow = {
  id: string
  tenant_id: string
  order_code: string
  customer_id: string
  bike_id: string | null
  item_description: string | null
  sale_date: string
  total_amount: number
  down_payment: number
  term_months: number
  per_installment: number
  paid_amount: number
  balance: number
  status: "active" | "completed" | "overdue"
  created_at: string
  updated_at: string
}

type InstallmentPaymentRow = {
  id: string
  tenant_id: string
  installment_sale_id: string
  payment_date: string
  amount: number
  account_id: string | null
  notes: string | null
  created_at: string
}

type InstallmentTermRow = {
  id: string
  tenant_id: string
  title: string
  terms_text: string
  created_at: string
  updated_at: string
}

type ExpenseRow = {
  id: string
  tenant_id: string
  date: string
  category: string
  sub_category: string | null
  payment_account_id: string | null
  amount: number
  description: string | null
  created_at: string
}

type Nullable<T> = { [K in keyof T]: T[K] | null | undefined }

type TableDef<Row> = {
  Row: Row
  Insert: Nullable<Partial<Row>>
  Update: Nullable<Partial<Row>>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      tenants: TableDef<TenantRow>
      profiles: TableDef<ProfileRow>
      parties: TableDef<PartyRow>
      accounts: TableDef<AccountRow>
      account_transactions: TableDef<AccountTransactionRow>
      purchases: TableDef<PurchaseRow>
      bikes: TableDef<BikeRow>
      purchase_returns: TableDef<PurchaseReturnRow>
      other_items: TableDef<OtherItemRow>
      bike_sales: TableDef<BikeSaleRow>
      pos_sales: TableDef<PosSaleRow>
      installment_customers: TableDef<InstallmentCustomerRow>
      installment_sales: TableDef<InstallmentSaleRow>
      installment_payments: TableDef<InstallmentPaymentRow>
      installment_terms: TableDef<InstallmentTermRow>
      expenses: TableDef<ExpenseRow>
    }
    Views: Record<string, never>
    Functions: {
      current_tenant_id: {
        Args: Record<string, never>
        Returns: string
      }
      current_role: {
        Args: Record<string, never>
        Returns: string
      }
      bootstrap_tenant_and_profile: {
        Args: Record<string, never>
        Returns: ProfileRow
      }
      factory_reset_tenant: {
        Args: Record<string, never>
        Returns: undefined
      }
      post_ledger_entry: {
        Args: {
          p_tenant_id: string
          p_account_id: string
          p_direction: "in" | "out"
          p_amount: number
          p_category: string | null
          p_description: string | null
          p_source_type: string
          p_source_id?: string | null
        }
        Returns: undefined
      }
      transfer_between_accounts: {
        Args: {
          p_tenant_id: string
          p_from_account_id: string
          p_to_account_id: string
          p_amount: number
          p_note?: string | null
        }
        Returns: undefined
      }
      adjust_party_balance: {
        Args: {
          p_tenant_id: string
          p_party_id: string
          p_delta: number
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
  }
}

export type Tenant = TenantRow
export type Profile = ProfileRow
export type Party = PartyRow
export type Account = AccountRow
export type AccountTransaction = AccountTransactionRow
export type Purchase = PurchaseRow
export type Bike = BikeRow
export type PurchaseReturn = PurchaseReturnRow
export type OtherItem = OtherItemRow
export type BikeSale = BikeSaleRow
export type PosSale = PosSaleRow
export type InstallmentCustomer = InstallmentCustomerRow
export type InstallmentSale = InstallmentSaleRow
export type InstallmentPayment = InstallmentPaymentRow
export type InstallmentTerm = InstallmentTermRow
export type Expense = ExpenseRow
