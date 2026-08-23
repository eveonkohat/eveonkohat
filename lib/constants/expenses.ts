export const EXPENSE_CATEGORIES: Record<string, string[]> = {
  "Rent & Utilities": ["Shop Rent", "Electricity Bill", "Gas Bill", "Water Bill", "Internet"],
  Payroll: ["Staff Salary", "Bonus", "Commission"],
  Marketing: ["Social Media Ads", "Print Ads", "Signage"],
  "Office & Admin": ["Stationery", "Repairs & Maintenance", "Legal & Professional Fees"],
  Transport: ["Fuel", "Vehicle Maintenance", "Delivery Charges"],
  Other: ["Miscellaneous"],
}

export const EXPENSE_CATEGORY_NAMES = Object.keys(EXPENSE_CATEGORIES)
