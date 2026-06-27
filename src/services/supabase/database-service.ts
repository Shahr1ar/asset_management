import { getSupabase } from "@/services/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import type {
  AppSettings,
  DashboardOverview,
  FinancialRequest,
  FinancialTemplateItem,
  FinancialValueItem,
  ManagedUser,
  MonthlyHistoryRecord,
  UserProfile,
} from "@/types";

const FIXED_FINANCIAL_TEMPLATE: FinancialTemplateItem[] = [
  {
    key: "balance",
    title: "Balance",
    defaultValue: 9000,
    type: "metric",
    editable: true,
    enabled: true,
    isActive: true,
    order: 1,
    description: "",
  },
  {
    key: "revenue",
    title: "Revenues",
    defaultValue: 9950,
    type: "metric",
    editable: true,
    enabled: true,
    isActive: true,
    order: 2,
    description: "",
  },
  {
    key: "cogs",
    title: "COGS",
    defaultValue: 8900,
    type: "metric",
    editable: true,
    enabled: true,
    isActive: true,
    order: 3,
    description: "",
  },
  {
    key: "gross_profit",
    title: "Gross profit",
    defaultValue: 7000,
    type: "metric",
    editable: true,
    enabled: true,
    isActive: true,
    order: 4,
    description: "",
  },
  {
    key: "bonus",
    title: "Bonus",
    defaultValue: 8000,
    type: "metric",
    editable: true,
    enabled: true,
    isActive: true,
    order: 5,
    description: "",
  },
  {
    key: "withdrawal",
    title: "Withdrawal",
    defaultValue: 2000,
    type: "metric",
    editable: true,
    enabled: true,
    isActive: true,
    order: 6,
    description: "",
  },
  {
    key: "recharge",
    title: "Recharge",
    defaultValue: 2000,
    type: "metric",
    editable: true,
    enabled: true,
    isActive: true,
    order: 7,
    description: "",
  },
  {
    key: "remaining",
    title: "Remaining",
    defaultValue: 2600,
    type: "metric",
    editable: true,
    enabled: true,
    isActive: true,
    order: 8,
    description: "",
  },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function toIsoDate(value: unknown, fallback = ""): string {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return fallback;
}

function isUserItemEnabled(item: Pick<FinancialValueItem, "enabled"> | undefined) {
  return item?.enabled !== false;
}

function getUserItemValue(items: FinancialValueItem[], key: string) {
  const item = items.find((entry) => entry.key === key);
  return isUserItemEnabled(item) ? item?.value ?? 0 : 0;
}

function getMonthlySnapshotMeta(date = new Date()) {
  const year = date.getFullYear();
  const monthNumber = date.getMonth() + 1;
  const month = String(monthNumber).padStart(2, "0");
  const key = `${String(year).slice(-2)}.${month}`;

  return {
    key,
    month,
    year,
    label: `${MONTH_NAMES[monthNumber - 1]} ${year}`,
  };
}

function getMonthlySnapshotPayload(
  currentData: { items: FinancialValueItem[]; updatedAt?: unknown },
  snapshotMeta: ReturnType<typeof getMonthlySnapshotMeta>,
  now: string,
) {
  return {
    month_key: snapshotMeta.key,
    month: snapshotMeta.month,
    year: snapshotMeta.year,
    label: snapshotMeta.label,
    items: currentData.items.map((item) => ({ ...item })),
    created_at: now,
    updated_at: now,
    stored_at: now,
    current_data_updated_at: currentData.updatedAt ?? null,
    source: "manual",
  };
}

function buildOverview(users: ManagedUser[]): DashboardOverview {
  const totalBalance = users.reduce(
    (sum, user) => sum + getUserItemValue(user.currentData.items, "balance"),
    0,
  );
  const totalRevenue = users.reduce(
    (sum, user) => sum + getUserItemValue(user.currentData.items, "revenue"),
    0,
  );
  const totalGrossProfit = users.reduce(
    (sum, user) => sum + getUserItemValue(user.currentData.items, "gross_profit"),
    0,
  );
  const totalWithdrawals = users.reduce(
    (sum, user) => sum + getUserItemValue(user.currentData.items, "withdrawal"),
    0,
  );

  const historyRecords = users.flatMap((user) =>
    user.monthlyHistory.map((history) => ({
      userName: user.profile.fullName,
      record: history,
    })),
  );

  const monthMap = new Map<
    string,
    {
      name: string;
      balance: number;
      revenue: number;
      withdrawals: number;
    }
  >();

  historyRecords.forEach(({ record }) => {
    const current = monthMap.get(record.id) ?? {
      name: record.label,
      balance: 0,
      revenue: 0,
      withdrawals: 0,
    };

    current.balance += getUserItemValue(record.items, "balance");
    current.revenue += getUserItemValue(record.items, "revenue");
    current.withdrawals += getUserItemValue(record.items, "withdrawal");
    monthMap.set(record.id, current);
  });

  const allocation = [
    { name: "Balances", value: totalBalance },
    { name: "Revenue", value: totalRevenue },
    {
      name: "Recharge",
      value: users.reduce(
        (sum, user) => sum + getUserItemValue(user.currentData.items, "recharge"),
        0,
      ),
    },
    {
      name: "Bonus",
      value: users.reduce(
        (sum, user) => sum + getUserItemValue(user.currentData.items, "bonus"),
        0,
      ),
    },
  ].filter((entry) => entry.value > 0);

  const recentUpdates = [
    ...users
      .filter((user) => user.currentData.updatedAt)
      .map((user) => ({
        id: `${user.profile.uid}-current`,
        title: "User financial data updated",
        description: `${user.profile.fullName} current financial data was updated.`,
        timestamp: user.currentData.updatedAt,
        type: "update" as const,
      })),
    ...historyRecords.map(({ userName, record }) => ({
      id: `${userName}-${record.id}`,
      title: "Monthly snapshot available",
      description: `${record.label} snapshot stored for ${userName}.`,
      timestamp: record.createdAt,
      type: "snapshot" as const,
    })),
  ]
    .filter((entry) => entry.timestamp)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 6);

  return {
    metrics: [
      {
        label: "Total Users",
        value: String(users.length),
        change: `${users.filter((user) => user.profile.status === "active").length} active`,
        trend: "neutral",
        description: "Live user count from Supabase",
      },
      {
        label: "Managed Balance",
        value: formatCurrency(totalBalance),
        change: `${monthMap.size} tracked months`,
        trend: "neutral",
        description: "Current balance sum across all users",
      },
      {
        label: "Gross Profit",
        value: formatCurrency(totalGrossProfit),
        change: formatCurrency(totalRevenue),
        trend: "neutral",
        description: "Gross profit with revenue shown as context",
      },
      {
        label: "Withdrawals",
        value: formatCurrency(totalWithdrawals),
        change: `${recentUpdates.length} recent events`,
        trend: "neutral",
        description: "Current withdrawal total across users",
      },
    ],
    monthlySeries: Array.from(monthMap.entries())
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
      .map(([, value]) => value),
    allocation,
    recentUpdates,
  };
}

function normalizeFinancialValue(value: unknown) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : 0;
}

function normalizeRequestCalculation(value: unknown): Record<string, string | number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => Boolean(key))
      .map(([key, entryValue]) => [
        key,
        typeof entryValue === "number" ? entryValue : String(entryValue ?? ""),
      ]),
  );
}

function buildUserProfile(uid: string, row: any): UserProfile {
  return {
    uid,
    userId: row.uid,
    fullName: row.full_name || row.display_name || row.email || uid,
    email: row.email || "",
    phone: row.phone_number || undefined,
    country: row.country || "",
    joinedAt: toIsoDate(row.created_at),
    status: row.status || "active",
    isActive: row.status !== "disabled",
    role: row.role || "user",
    avatar: row.profile_photo_url || undefined,
    profilePhotoUrl: row.profile_photo_url || undefined,
    image_url: row.profile_photo_url || undefined,
    referralCode: row.referral_code || "",
    walletTier: row.wallet_tier || "starter",
    lastActiveAt: toIsoDate(row.last_active_at || row.created_at),
    createdAt: toIsoDate(row.created_at),
    updatedAt: toIsoDate(row.updated_at),
    createdBy: row.created_by || undefined,
    lastLoginAt: toIsoDate(row.last_active_at) || null,
  };
}

function normalizeUserFinancialItems(
  template: FinancialTemplateItem[],
  currentItems: any[],
): FinancialValueItem[] {
  const currentByKey = new Map(currentItems.map((item) => [item.key, item]));

  return template.map((templateItem) => {
    const currentItem = currentByKey.get(templateItem.key);
    const enabled = currentItem?.enabled ?? templateItem.enabled;
    const value = normalizeFinancialValue(currentItem?.value ?? templateItem.defaultValue);

    return {
      key: templateItem.key,
      title: templateItem.title,
      defaultValue: normalizeFinancialValue(templateItem.defaultValue),
      description: templateItem.description || "",
      editable: templateItem.editable ?? true,
      enabled,
      isActive: enabled,
      order: templateItem.order,
      type: templateItem.type ?? "metric",
      createdAt: templateItem.createdAt,
      updatedAt: templateItem.updatedAt,
      value,
    };
  });
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const users = await getUsers();
  return buildOverview(users);
}

export async function getFinancialTemplate(): Promise<FinancialTemplateItem[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return FIXED_FINANCIAL_TEMPLATE;
  }

  const { data, error } = await supabase
    .from("financial_items_template")
    .select("*")
    .order("order_index", { ascending: true });

  if (error || !data) {
    return FIXED_FINANCIAL_TEMPLATE;
  }

  return data.map((row) => ({
    key: row.key,
    title: row.title,
    defaultValue: Number(row.default_value),
    type: row.type || "metric",
    editable: row.editable,
    enabled: row.enabled,
    isActive: row.is_active,
    order: row.order_index,
    description: row.description || "",
    createdAt: toIsoDate(row.created_at),
    updatedAt: toIsoDate(row.updated_at),
  }));
}

export async function updateFinancialItem(
  itemKey: string,
  values: Partial<FinancialTemplateItem>,
) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (values.title !== undefined) payload.title = values.title.trim();
  if (values.description !== undefined) payload.description = values.description.trim();
  if (values.defaultValue !== undefined) payload.default_value = Number(values.defaultValue);
  if (values.isActive !== undefined || values.enabled !== undefined) {
    const isActive = values.isActive ?? values.enabled ?? true;
    payload.is_active = isActive;
    payload.enabled = isActive;
  }
  if (values.order !== undefined) payload.order_index = Number(values.order);

  const { error } = await supabase
    .from("financial_items_template")
    .update(payload)
    .eq("key", itemKey);

  if (error) {
    throw error;
  }
}

export async function getUserProfiles(): Promise<ManagedUser[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("full_name", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    profile: buildUserProfile(row.uid, row),
    currentData: { items: [], updatedAt: "" },
    monthlyHistory: [],
  }));
}

export async function getUsers(): Promise<ManagedUser[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const [template, { data: users }, { data: curData }, { data: histData }] = await Promise.all([
    getFinancialTemplate(),
    supabase.from("users").select("*"),
    supabase.from("user_current_data").select("*"),
    supabase.from("user_monthly_history").select("*"),
  ]);

  if (!users) return [];

  const currentDataMap = new Map(curData?.map((c) => [c.user_id, c]));
  const historyMap = new Map<string, any[]>();
  histData?.forEach((h) => {
    if (!historyMap.has(h.user_id)) {
      historyMap.set(h.user_id, []);
    }
    historyMap.get(h.user_id)!.push(h);
  });

  const managedUsers = users.map((user) => {
    const uId = user.uid;
    const profile = buildUserProfile(uId, user);
    const cur = currentDataMap.get(uId);
    const currentData = {
      updatedAt: cur ? toIsoDate(cur.updated_at) : "",
      items: normalizeUserFinancialItems(template, cur?.items || []),
    };
    const hist = historyMap.get(uId) || [];
    const monthlyHistory = hist
      .map((h) => ({
        id: h.month_key,
        key: h.month_key,
        month: h.month,
        year: h.year,
        label: h.label,
        items: normalizeUserFinancialItems(template, h.items || []),
        createdAt: toIsoDate(h.created_at),
        storedAt: toIsoDate(h.stored_at),
        updatedAt: toIsoDate(h.updated_at),
        currentDataUpdatedAt: toIsoDate(h.current_data_updated_at),
        source: h.source || "manual",
      }))
      .sort((left, right) => right.id.localeCompare(left.id));

    return {
      profile,
      currentData,
      monthlyHistory,
    } as ManagedUser;
  });

  return managedUsers.sort((left, right) =>
    left.profile.fullName.localeCompare(right.profile.fullName),
  );
}

export async function getUserById(userId: string): Promise<ManagedUser | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const [template, { data: userRow }, { data: curRow }, { data: histRows }] = await Promise.all([
    getFinancialTemplate(),
    supabase.from("users").select("*").eq("uid", userId).maybeSingle(),
    supabase.from("user_current_data").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_monthly_history").select("*").eq("user_id", userId),
  ]);

  if (!userRow) return null;

  const profile = buildUserProfile(userRow.uid, userRow);
  const currentData = {
    updatedAt: curRow ? toIsoDate(curRow.updated_at) : "",
    items: normalizeUserFinancialItems(template, curRow?.items || []),
  };
  const monthlyHistory = (histRows || [])
    .map((h) => ({
      id: h.month_key,
      key: h.month_key,
      month: h.month,
      year: h.year,
      label: h.label,
      items: normalizeUserFinancialItems(template, h.items || []),
      createdAt: toIsoDate(h.created_at),
      storedAt: toIsoDate(h.stored_at),
      updatedAt: toIsoDate(h.updated_at),
      currentDataUpdatedAt: toIsoDate(h.current_data_updated_at),
      source: h.source || "manual",
    }))
    .sort((left, right) => right.id.localeCompare(left.id));

  return {
    profile,
    currentData,
    monthlyHistory,
  };
}

export async function updateUserProfile(userId: string, values: Partial<UserProfile>) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (values.fullName !== undefined) payload.full_name = values.fullName;
  if (values.phone !== undefined) payload.phone_number = values.phone;
  if (values.country !== undefined) payload.country = values.country;
  if (values.status !== undefined) payload.status = values.status;
  if (values.role !== undefined) payload.role = values.role;
  if (values.walletTier !== undefined) payload.wallet_tier = values.walletTier;
  if (values.profilePhotoUrl !== undefined) payload.profile_photo_url = values.profilePhotoUrl;

  const { error } = await supabase.from("users").update(payload).eq("uid", userId);
  if (error) throw error;
}

export async function updateUserFinancialData(userId: string, items: any[]) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const template = await getFinancialTemplate();
  const detailedItems = normalizeUserFinancialItems(template, items);

  const { error } = await supabase.from("user_current_data").upsert({
    user_id: userId,
    items: detailedItems,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function storeMonthlySnapshot(userId: string, options: { date?: Date } = {}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const [template, { data: curData }] = await Promise.all([
    getFinancialTemplate(),
    supabase.from("user_current_data").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const items = curData?.items || [];
  const detailedItems = normalizeUserFinancialItems(template, items);

  const now = new Date().toISOString();
  const snapshotMeta = getMonthlySnapshotMeta(options.date);
  const snapshot = getMonthlySnapshotPayload(
    {
      items: detailedItems,
      updatedAt: curData?.updated_at || now,
    },
    snapshotMeta,
    now,
  );

  const { error: upsertHistError } = await supabase.from("user_monthly_history").upsert({
    user_id: userId,
    month_key: snapshotMeta.key,
    month: snapshotMeta.month,
    year: snapshotMeta.year,
    label: snapshotMeta.label,
    items: detailedItems,
    stored_at: now,
    created_at: now,
    updated_at: now,
    current_data_updated_at: curData?.updated_at || now,
    source: "manual",
  });

  if (upsertHistError) throw upsertHistError;

  return snapshot;
}

export async function createMonthlySnapshot(userId: string) {
  return storeMonthlySnapshot(userId);
}

export async function storeMonthlySnapshotsForAllUsers(options: { date?: Date } = {}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const [template, { data: users }, { data: curData }] = await Promise.all([
    getFinancialTemplate(),
    supabase.from("users").select("uid"),
    supabase.from("user_current_data").select("*"),
  ]);

  const snapshotMeta = getMonthlySnapshotMeta(options.date);
  if (!users) {
    return {
      ...snapshotMeta,
      storedCount: 0,
      skippedCount: 0,
    };
  }

  const currentMap = new Map(curData?.map((c) => [c.user_id, c]));
  const now = new Date().toISOString();

  const snapshots: any[] = [];
  const currentUpdates: any[] = [];

  users.forEach((user) => {
    const cur = currentMap.get(user.uid);
    if (!cur) return;

    const detailedItems = normalizeUserFinancialItems(template, cur.items || []);
    snapshots.push({
      user_id: user.uid,
      month_key: snapshotMeta.key,
      month: snapshotMeta.month,
      year: snapshotMeta.year,
      label: snapshotMeta.label,
      items: detailedItems,
      stored_at: now,
      created_at: now,
      updated_at: now,
      current_data_updated_at: cur.updated_at || now,
      source: "manual",
    });

    currentUpdates.push({
      user_id: user.uid,
      items: detailedItems,
      updated_at: cur.updated_at || now,
    });
  });

  if (snapshots.length > 0) {
    const { error: snapError } = await supabase.from("user_monthly_history").upsert(snapshots);
    if (snapError) throw snapError;

    const { error: curError } = await supabase.from("user_current_data").upsert(currentUpdates);
    if (curError) throw curError;
  }

  return {
    ...snapshotMeta,
    storedCount: snapshots.length,
    skippedCount: users.length - snapshots.length,
  };
}

export async function getFinancialRequests(): Promise<FinancialRequest[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("financial_requests")
    .select(`
      *,
      users!financial_requests_user_id_fkey (
        full_name,
        email,
        profile_photo_url
      )
    `)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const userProfile = row.users;
    return {
      id: row.id,
      type: row.type,
      amount: Number(row.amount),
      applied: row.applied,
      calculation: normalizeRequestCalculation(row.calculation),
      createdAt: toIsoDate(row.created_at),
      updatedAt: toIsoDate(row.updated_at),
      reviewedAt: toIsoDate(row.reviewed_at),
      note: row.note || "",
      requestedBy: row.requested_by,
      userId: row.user_id,
      status: row.status || "pending",
      userName: userProfile?.full_name,
      userEmail: userProfile?.email,
      userAvatar: userProfile?.profile_photo_url,
    } as FinancialRequest;
  });
}

export async function cancelFinancialRequest(type: string, requestId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("financial_requests")
    .update({
      applied: false,
      reviewed_at: now,
      status: "cancelled",
      updated_at: now,
    })
    .eq("id", requestId);

  if (error) throw error;
}

export async function approveFinancialRequest(request: FinancialRequest) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  // Call the database function RPC atomically
  const { error } = await supabase.rpc("approve_financial_request", {
    req_id: request.id,
  });

  if (error) {
    throw error;
  }
}

export async function getSettings(): Promise<AppSettings> {
  const supabase = getSupabase();
  if (!supabase) return { emailAlerts: false, defaultCurrency: "", autoSnapshot: false, darkMode: false };

  const { data, error } = await supabase
    .from("admin_settings")
    .select("*")
    .eq("key", "default")
    .maybeSingle();

  if (error || !data) {
    return { emailAlerts: false, defaultCurrency: "", autoSnapshot: false, darkMode: false };
  }

  return {
    emailAlerts: data.email_alerts,
    defaultCurrency: data.default_currency || "",
    autoSnapshot: data.auto_snapshot ?? false,
    darkMode: data.dark_mode ?? false,
  };
}

export async function saveSettings(settings: AppSettings) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.from("admin_settings").upsert({
    key: "default",
    email_alerts: settings.emailAlerts,
    default_currency: settings.defaultCurrency,
    auto_snapshot: settings.autoSnapshot,
    dark_mode: settings.darkMode,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function getMergedUserFinancialRows(user: ManagedUser) {
  const template = await getFinancialTemplate();
  return normalizeUserFinancialItems(template, user.currentData.items);
}

export async function getUserCount(): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  if (error) return 0;
  return count || 0;
}
