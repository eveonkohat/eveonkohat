import "server-only"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDate } from "@/lib/utils/format"

export type ReportResult =
  | { kind: "table"; columns: string[]; rows: string[][] }
  | { kind: "unavailable"; reason: string }
  | { kind: "redirect"; href: string }

export async function getReportData(tenantId: string, slug: string): Promise<ReportResult> {
  const supabase = await createClient()

  switch (slug) {
    case "sales-summary": {
      const [scooterSales, posSales] = await Promise.all([
        supabase.from("scooter_sales").select("date, customer_name, total_amount").eq("tenant_id", tenantId),
        supabase.from("pos_sales").select("date, customer_name, grand_total").eq("tenant_id", tenantId),
      ])
      const rows = [
        ...(scooterSales.data ?? []).map((s) => [formatDate(s.date), s.customer_name, "Scooter Sale", formatCurrency(s.total_amount)]),
        ...(posSales.data ?? []).map((s) => [formatDate(s.date), s.customer_name, "POS Sale", formatCurrency(s.grand_total)]),
      ].sort((a, b) => (a[0] < b[0] ? 1 : -1))
      return { kind: "table", columns: ["Date", "Customer", "Type", "Amount"], rows }
    }

    case "income-report": {
      const [scooterSales, posSales, otherIncome] = await Promise.all([
        supabase.from("scooter_sales").select("date, total_amount").eq("tenant_id", tenantId),
        supabase.from("pos_sales").select("date, grand_total").eq("tenant_id", tenantId),
        supabase
          .from("account_transactions")
          .select("date, amount")
          .eq("tenant_id", tenantId)
          .eq("source_type", "other_income"),
      ])
      const byDate = new Map<string, number>()
      for (const s of scooterSales.data ?? []) byDate.set(s.date, (byDate.get(s.date) ?? 0) + Number(s.total_amount))
      for (const s of posSales.data ?? []) byDate.set(s.date, (byDate.get(s.date) ?? 0) + Number(s.grand_total))
      for (const s of otherIncome.data ?? []) byDate.set(s.date, (byDate.get(s.date) ?? 0) + Number(s.amount))
      const rows = [...byDate.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([date, amount]) => [formatDate(date), formatCurrency(amount)])
      return { kind: "table", columns: ["Date", "Total Income"], rows }
    }

    case "payment-collection": {
      const [scooterSales, posSales, installments] = await Promise.all([
        supabase.from("scooter_sales").select("date, customer_name, received_amount").eq("tenant_id", tenantId),
        supabase.from("pos_sales").select("date, customer_name, received_amount").eq("tenant_id", tenantId),
        supabase.from("installment_payments").select("payment_date, amount").eq("tenant_id", tenantId),
      ])
      const rows = [
        ...(scooterSales.data ?? [])
          .filter((s) => Number(s.received_amount) > 0)
          .map((s) => [formatDate(s.date), s.customer_name, "Scooter Sale", formatCurrency(s.received_amount)]),
        ...(posSales.data ?? [])
          .filter((s) => Number(s.received_amount) > 0)
          .map((s) => [formatDate(s.date), s.customer_name, "POS Sale", formatCurrency(s.received_amount)]),
        ...(installments.data ?? []).map((p) => [formatDate(p.payment_date), "—", "Installment Payment", formatCurrency(p.amount)]),
      ].sort((a, b) => (a[0] < b[0] ? 1 : -1))
      return { kind: "table", columns: ["Date", "Customer", "Source", "Amount"], rows }
    }

    case "top-selling-models": {
      const { data: scooters } = await supabase.from("scooters").select("make, model, status").eq("tenant_id", tenantId)
      const counts = new Map<string, number>()
      for (const b of scooters ?? []) {
        if (b.status !== "sold") continue
        const key = `${b.make} ${b.model}`
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
      const rows = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([model, count]) => [model, String(count)])
      return { kind: "table", columns: ["Model", "Units Sold"], rows }
    }

    case "expense-report": {
      const { data } = await supabase
        .from("expenses")
        .select("date, category, sub_category, amount")
        .eq("tenant_id", tenantId)
        .order("date", { ascending: false })
      const rows = (data ?? []).map((e) => [formatDate(e.date), e.category, e.sub_category ?? "—", formatCurrency(e.amount)])
      return { kind: "table", columns: ["Date", "Category", "Sub-Category", "Amount"], rows }
    }

    case "expense-categories": {
      const { data } = await supabase.from("expenses").select("category, amount").eq("tenant_id", tenantId)
      const byCategory = new Map<string, number>()
      for (const e of data ?? []) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount))
      const rows = [...byCategory.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => [category, formatCurrency(amount)])
      return { kind: "table", columns: ["Category", "Total"], rows }
    }

    case "tax-report":
    case "agent-commission":
    case "staff-payroll":
      return {
        kind: "unavailable",
        reason:
          slug === "tax-report"
            ? "Tax configuration isn't tracked yet — this report needs a tax rate/category model that hasn't been built."
            : slug === "agent-commission"
              ? "Agent commission tracking requires a sales-agent model that hasn't been built yet."
              : "Staff payroll requires a payroll module that hasn't been built yet.",
      }

    case "purchase-tax": {
      const { data } = await supabase
        .from("purchases")
        .select("date, make, model, tax_per_unit, quantity")
        .eq("tenant_id", tenantId)
        .gt("tax_per_unit", 0)
      const rows = (data ?? []).map((p) => [
        formatDate(p.date),
        `${p.make} ${p.model}`,
        String(p.quantity),
        formatCurrency(p.tax_per_unit),
        formatCurrency(p.tax_per_unit * p.quantity),
      ])
      return { kind: "table", columns: ["Date", "Scooter", "Qty", "Tax / Unit", "Total Tax"], rows }
    }

    case "stock-report":
    case "available-stock":
    case "sold-stock": {
      let query = supabase
        .from("scooters")
        .select("make, model, chassis_no, status, purchase_price")
        .eq("tenant_id", tenantId)
      if (slug === "available-stock") query = query.eq("status", "in_stock")
      if (slug === "sold-stock") query = query.eq("status", "sold")
      const { data } = await query
      const rows = (data ?? []).map((b) => [
        `${b.make} ${b.model}`,
        b.chassis_no ?? "N/A",
        b.status,
        formatCurrency(b.purchase_price),
      ])
      return { kind: "table", columns: ["Scooter", "Chassis No.", "Status", "Value"], rows }
    }

    case "stock-aging": {
      const { data } = await supabase
        .from("scooters")
        .select("make, model, created_at")
        .eq("tenant_id", tenantId)
        .eq("status", "in_stock")
      const now = Date.now()
      const rows = (data ?? [])
        .map((b) => {
          const days = Math.floor((now - new Date(b.created_at).getTime()) / (1000 * 60 * 60 * 24))
          return [`${b.make} ${b.model}`, formatDate(b.created_at), `${days} days`]
        })
        .sort((a, b) => Number(b[2].split(" ")[0]) - Number(a[2].split(" ")[0]))
      return { kind: "table", columns: ["Scooter", "Purchased On", "Days In Stock"], rows }
    }

    case "stock-valuation": {
      const [scooters, otherItems] = await Promise.all([
        supabase.from("scooters").select("make, model, purchase_price").eq("tenant_id", tenantId).eq("status", "in_stock"),
        supabase.from("other_items").select("item_name, unit_price, quantity_remaining").eq("tenant_id", tenantId),
      ])
      const rows = [
        ...(scooters.data ?? []).map((b) => [`${b.make} ${b.model}`, "1", formatCurrency(b.purchase_price)]),
        ...(otherItems.data ?? [])
          .filter((i) => i.quantity_remaining > 0)
          .map((i) => [i.item_name, String(i.quantity_remaining), formatCurrency(i.unit_price * i.quantity_remaining)]),
      ]
      return { kind: "table", columns: ["Item", "Qty", "Value"], rows }
    }

    case "customer-ledger": {
      const [customers, sales] = await Promise.all([
        supabase.from("installment_customers").select("id, name, cnic").eq("tenant_id", tenantId),
        supabase.from("installment_sales").select("customer_id, balance").eq("tenant_id", tenantId),
      ])
      const balanceByCustomer = new Map<string, number>()
      for (const s of sales.data ?? []) {
        balanceByCustomer.set(s.customer_id, (balanceByCustomer.get(s.customer_id) ?? 0) + Number(s.balance))
      }
      const rows = (customers.data ?? []).map((c) => [
        c.name,
        c.cnic ?? "—",
        formatCurrency(balanceByCustomer.get(c.id) ?? 0),
      ])
      return { kind: "table", columns: ["Customer", "CNIC", "Balance"], rows }
    }

    case "supplier-ledger":
    case "party-balances": {
      const { data } = await supabase.from("parties").select("name, phone, current_balance").eq("tenant_id", tenantId)
      const rows = (data ?? []).map((p) => [p.name, p.phone ?? "—", formatCurrency(p.current_balance)])
      return { kind: "table", columns: ["Party", "Phone", "Balance"], rows }
    }

    case "installment-status": {
      const { data } = await supabase
        .from("installment_sales")
        .select("order_code, item_description, status, balance")
        .eq("tenant_id", tenantId)
      const rows = (data ?? []).map((s) => [s.order_code, s.item_description ?? "—", s.status, formatCurrency(s.balance)])
      return { kind: "table", columns: ["Order", "Item", "Status", "Balance"], rows }
    }

    case "overdue-recovery": {
      const { data } = await supabase
        .from("installment_sales")
        .select("order_code, item_description, balance")
        .eq("tenant_id", tenantId)
        .eq("status", "overdue")
      const rows = (data ?? []).map((s) => [s.order_code, s.item_description ?? "—", formatCurrency(s.balance)])
      return { kind: "table", columns: ["Order", "Item", "Balance"], rows }
    }

    case "daily-cash-flow": {
      const { data } = await supabase
        .from("account_transactions")
        .select("date, direction, amount")
        .eq("tenant_id", tenantId)
      const byDate = new Map<string, { in: number; out: number }>()
      for (const t of data ?? []) {
        const entry = byDate.get(t.date) ?? { in: 0, out: 0 }
        if (t.direction === "in") entry.in += Number(t.amount)
        else entry.out += Number(t.amount)
        byDate.set(t.date, entry)
      }
      const rows = [...byDate.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([date, v]) => [formatDate(date), formatCurrency(v.in), formatCurrency(v.out), formatCurrency(v.in - v.out)])
      return { kind: "table", columns: ["Date", "Cash In", "Cash Out", "Net"], rows }
    }

    case "bank-transactions": {
      const { data: bankAccounts } = await supabase
        .from("accounts")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .eq("type", "bank")
      const bankIds = (bankAccounts ?? []).map((a) => a.id)
      if (bankIds.length === 0) {
        return { kind: "unavailable", reason: "No bank accounts have been added yet — create one in Accounts → Create Account." }
      }
      const { data } = await supabase
        .from("account_transactions")
        .select("date, direction, category, description, amount, account_id")
        .eq("tenant_id", tenantId)
        .in("account_id", bankIds)
        .order("date", { ascending: false })
      const nameById = new Map((bankAccounts ?? []).map((a) => [a.id, a.name]))
      const rows = (data ?? []).map((t) => [
        formatDate(t.date),
        nameById.get(t.account_id ?? "") ?? "—",
        t.direction === "in" ? "Credit" : "Debit",
        t.description ?? t.category ?? "—",
        formatCurrency(t.amount),
      ])
      return { kind: "table", columns: ["Date", "Account", "Type", "Description", "Amount"], rows }
    }

    case "purchase-summary": {
      const { data } = await supabase
        .from("purchases")
        .select("date, make, model, quantity, total_amount")
        .eq("tenant_id", tenantId)
        .order("date", { ascending: false })
      const rows = (data ?? []).map((p) => [
        formatDate(p.date),
        `${p.make} ${p.model}`,
        String(p.quantity),
        formatCurrency(p.total_amount),
      ])
      return { kind: "table", columns: ["Date", "Scooter", "Qty", "Total"], rows }
    }

    case "profit-and-loss":
      return { kind: "redirect", href: "/pl" }

    case "monthly-summary": {
      const { data: scooterSales } = await supabase
        .from("scooter_sales")
        .select("date, total_amount")
        .eq("tenant_id", tenantId)
      const { data: posSales } = await supabase
        .from("pos_sales")
        .select("date, grand_total")
        .eq("tenant_id", tenantId)
      const { data: expenses } = await supabase.from("expenses").select("date, amount").eq("tenant_id", tenantId)

      const byMonth = new Map<string, { revenue: number; expense: number }>()
      const bump = (key: string, field: "revenue" | "expense", amount: number) => {
        const entry = byMonth.get(key) ?? { revenue: 0, expense: 0 }
        entry[field] += amount
        byMonth.set(key, entry)
      }
      for (const s of scooterSales ?? []) bump(s.date.slice(0, 7), "revenue", Number(s.total_amount))
      for (const s of posSales ?? []) bump(s.date.slice(0, 7), "revenue", Number(s.grand_total))
      for (const e of expenses ?? []) bump(e.date.slice(0, 7), "expense", Number(e.amount))

      const rows = [...byMonth.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([month, v]) => [month, formatCurrency(v.revenue), formatCurrency(v.expense), formatCurrency(v.revenue - v.expense)])
      return { kind: "table", columns: ["Month", "Revenue", "Expenses", "Net"], rows }
    }

    default:
      return { kind: "unavailable", reason: "Unknown report." }
  }
}
