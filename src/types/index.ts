export type UserStatus = "active" | "paused" | "disabled";
export type UserRole = "admin" | "member" | "user";
export type ProductCategory = "Steel" | "Cement" | "Consumer" | "Others";
export type ProductGrade = "Grade A" | "Grade B";
export type FinancialItemType =
  | "income"
  | "expense"
  | "asset"
  | "liability"
  | "metric";

export interface FinancialTemplateItem {
  key: string;
  title: string;
  defaultValue: number;
  type: FinancialItemType;
  editable: boolean;
  enabled: boolean;
  isActive?: boolean;
  order: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancialValueItem extends FinancialTemplateItem {
  value: number;
}

export type FinancialRequestType = "deposit" | "withdrawal";
export type FinancialRequestStatus = "pending" | "approved" | "cancelled";

export interface FinancialRequest {
  id: string;
  type: FinancialRequestType;
  amount: number;
  applied: boolean;
  calculation: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  note?: string;
  requestedBy: string;
  userId: string;
  status: FinancialRequestStatus;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  grade: ProductGrade | null;
  price: number;
  image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PropertyType = "sale";

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  priceType: string;
  propertyType: PropertyType;
  address: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  features: string[];
  ownerName: string;
  phoneNumber: string;
  whatsappNumber: string;
  imageUrl: string;
  imageUrls?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  country: string;
  joinedAt: string;
  status: UserStatus;
  isActive?: boolean;
  role: UserRole;
  avatar?: string;
  profilePhotoUrl?: string;
  image_url?: string;
  referralCode?: string;
  walletTier: "starter" | "growth" | "pro";
  lastActiveAt: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  lastLoginAt?: string | null;
}

export interface UserCurrentData {
  items: FinancialValueItem[];
  updatedAt: string;
}

export interface MonthlyHistoryRecord {
  id: string;
  key?: string;
  month: string;
  year: number;
  label: string;
  items: FinancialValueItem[];
  createdAt: string;
  updatedAt?: string;
  storedAt?: string;
  currentDataUpdatedAt?: string;
  source?: "manual";
}

export interface ManagedUser {
  profile: UserProfile;
  currentData: UserCurrentData;
  monthlyHistory: MonthlyHistoryRecord[];
}

export interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  description: string;
}

export interface DashboardSeriesPoint {
  name: string;
  balance: number;
  revenue: number;
  withdrawals: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "snapshot" | "update" | "item" | "user";
}

export interface DashboardOverview {
  metrics: DashboardMetric[];
  monthlySeries: DashboardSeriesPoint[];
  allocation: Array<{ name: string; value: number }>;
  recentUpdates: RecentActivity[];
}

export interface UserFilters {
  query: string;
  status: "all" | "active" | "inactive";
}

export interface HistoryFilters {
  month: "all" | string;
  year: "all" | string;
  userId: "all" | string;
}

export interface AppSettings {
  emailAlerts: boolean;
  defaultCurrency: string;
  autoSnapshot: boolean;
  darkMode: boolean;
}
