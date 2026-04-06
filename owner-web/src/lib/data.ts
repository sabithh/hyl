export const dashboardKpis = [
  { label: "Active Members", value: "1,284", delta: "+6.2%" },
  { label: "Monthly Revenue", value: "$92,400", delta: "+11.8%" },
  { label: "Attendance Rate", value: "87%", delta: "+2.1%" },
  { label: "Pending Renewals", value: "63", delta: "-1.4%" },
] as const;

export const members = [
  { name: "Ava Sharma", plan: "Pro Annual", trainer: "Coach Alex", status: "Active", renewal: "18 days" },
  { name: "Noah Patel", plan: "Quarterly Plus", trainer: "Coach Kira", status: "Active", renewal: "44 days" },
  { name: "Mia Khan", plan: "Starter", trainer: "Coach Alex", status: "Expiring", renewal: "6 days" },
  { name: "Liam Das", plan: "Pro Annual", trainer: "Coach Theo", status: "Paused", renewal: "-" },
  { name: "Sara Iqbal", plan: "Quarterly Plus", trainer: "Coach Riya", status: "Active", renewal: "31 days" },
] as const;

export const trainers = [
  { name: "Coach Alex", specialty: "Hypertrophy", trainees: 32, rating: 4.9 },
  { name: "Coach Kira", specialty: "Fat Loss", trainees: 27, rating: 4.8 },
  { name: "Coach Theo", specialty: "Strength", trainees: 24, rating: 4.7 },
  { name: "Coach Riya", specialty: "Mobility", trainees: 19, rating: 4.9 },
] as const;

export const workoutPlans = [
  { title: "Foundation Strength", assigned: 148, completion: "81%" },
  { title: "Lean Cut 8 Weeks", assigned: 112, completion: "74%" },
  { title: "Power Build", assigned: 79, completion: "69%" },
  { title: "Beginner Reboot", assigned: 166, completion: "88%" },
] as const;

export const dietPlans = [
  { title: "Balanced 2100", assigned: 201, adherence: "77%" },
  { title: "High Protein 2400", assigned: 144, adherence: "72%" },
  { title: "Low Carb Cut", assigned: 108, adherence: "68%" },
] as const;

export const payments = [
  { member: "Ava Sharma", amount: "$499", method: "Card", status: "Paid", date: "2026-03-28" },
  { member: "Mia Khan", amount: "$89", method: "UPI", status: "Overdue", date: "2026-03-25" },
  { member: "Noah Patel", amount: "$199", method: "Card", status: "Paid", date: "2026-03-22" },
  { member: "Sara Iqbal", amount: "$199", method: "Cash", status: "Pending", date: "2026-03-21" },
] as const;

export const attendanceSeries = [72, 78, 80, 84, 87, 90, 88] as const;

export const notifications = [
  { title: "Renewal Reminder", audience: "63 Members", channel: "Push", state: "Scheduled" },
  { title: "New Plan Drop", audience: "All Trainees", channel: "In-app", state: "Sent" },
  { title: "March Challenge", audience: "Active Members", channel: "Email", state: "Draft" },
] as const;

export const referrals = [
  { member: "Ava Sharma", referrals: 5, reward: "1 Month Extension" },
  { member: "Noah Patel", referrals: 3, reward: "Protein Voucher" },
  { member: "Sara Iqbal", referrals: 2, reward: "Diet Consult" },
] as const;

export const recentActivity = [
  "7 new members joined from referral campaign.",
  "Coach Alex published 3 updated workout plans.",
  "Attendance crossed 90% on Monday peak hour.",
  "2 overdue invoices were recovered this morning.",
] as const;
