import {
  BarChart3,
  Building2,
  Clock3,
  HandCoins,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";

export const APP_NAME = "Asset Management Admin";

export const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Financial Items",
    href: "/financial-items",
    icon: WalletCards,
  },
  {
    title: "Financial Requests",
    href: "/financial-requests",
    icon: HandCoins,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
  },
  {
    title: "Real Estate",
    href: "/properties",
    icon: Building2,
  },
  {
    title: "History",
    href: "/history",
    icon: Clock3,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Analytics",
    href: "/dashboard#analytics",
    icon: BarChart3,
  },
] as const;

export const DEFAULT_FINANCIAL_KEYS = [
  "balance",
  "revenue",
  "cogs",
  "gross_profit",
  "bonus",
  "withdrawal",
  "recharge",
  "remaining",
];
