export type UserRole = "owner" | "trainer" | "trainee";

export type BackendHealth = {
  online: boolean;
  message: string;
  url: string;
  environment?: string;
  timestamp?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type ApiPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type OwnerUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  gymId: string;
  profilePicUrl?: string | null;
};

export type AuthLoginResult = {
  user: OwnerUser;
  accessToken: string;
  refreshToken: string;
};

export type CreateGymOwnerInput = {
  gymName: string;
  gymEmail: string;
  gymPhone?: string;
  gymAddress?: string;
  gymCity?: string;
  gymState?: string;
  gymCountry?: string;
  gymPincode?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  ownerPassword: string;
};

export type Gym = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  _count?: {
    users: number;
    subscriptions: number;
    payments: number;
    attendance: number;
  };
};

export type CreateGymOwnerResult = {
  gym: Gym;
  user: OwnerUser;
  accessToken: string;
  refreshToken: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  assignedTrainerId?: string | null;
  joinDate?: string | null;
};

export type MembersResponse = {
  members: Member[];
  pagination: ApiPagination;
};

export type Trainer = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  trainerProfile?: {
    specializations?: string[] | null;
    certifications?: string[] | null;
    experienceYears?: number | null;
    maxTrainees?: number | null;
  } | null;
};

export type WorkoutPlan = {
  id: string;
  title: string;
  isActive: boolean;
  trainer?: { id: string; name: string } | null;
  trainee?: { id: string; name: string } | null;
  exercises?: Array<{ id: string }>;
  startDate?: string | null;
  endDate?: string | null;
};

export type WorkoutPlansResponse = {
  plans: WorkoutPlan[];
  pagination: ApiPagination;
};

export type DietPlan = {
  id: string;
  title: string;
  isActive: boolean;
  dailyCaloriesTarget?: number | null;
  dailyProteinTargetG?: number | null;
  trainer?: { id: string; name: string } | null;
  trainee?: { id: string; name: string } | null;
};

export type DietPlansResponse = {
  dietPlans: DietPlan[];
  pagination: ApiPagination;
};

export type Payment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
};

export type PaymentsResponse = {
  payments: Payment[];
  pagination: ApiPagination;
};

export type PaymentSummary = {
  monthlyRevenue: number;
  monthlyTransactions: number;
  totalRevenue: number;
  totalTransactions: number;
  pendingAmount: number;
  pendingCount: number;
  byMethod: Array<{ method: string; _sum: { amount: number | null }; _count: { id: number } }>;
};

export type AttendanceToday = {
  totalCheckIns: number;
  currentlyInside: number;
  records: Array<{
    id: string;
    checkInTime: string;
    checkOutTime?: string | null;
    user?: { id: string; name: string; email: string; phone?: string | null };
  }>;
};

export type AttendanceAnalytics = {
  totalRecords: number;
  averageSessionDuration: number;
  peakHours: Array<{ hour: string; count: number }>;
  weekdayTrend: Array<{ day: string; count: number }>;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  notifications: Notification[];
  pagination: ApiPagination;
};

export type ExpiringSubscription = {
  id: string;
  endDate: string;
  user: { id: string; name: string; email: string };
  plan: { id: string; name: string; price: number };
};

export type ReferralStats = {
  totalsByStatus: Array<{ status: string; _count: { id: number } }>;
  totalsByType: Array<{ rewardType: string; _count: { id: number } }>;
  topReferrers: Array<{
    referrerId: string;
    referrals: number;
    user: { id: string; name: string; email: string } | null;
  }>;
};

const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:5000";
export const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");

export class BackendApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const buildErrorMessage = (payload: unknown, status: number): string => {
  if (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  return `Request failed with status ${status}`;
};

async function backendRequest<T>(path: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    cache: "no-store",
    next: { revalidate: 0 },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new BackendApiError(buildErrorMessage(payload, response.status), response.status);
  }

  const envelope = payload as ApiEnvelope<T>;
  return envelope.data;
}

export async function getBackendHealth(): Promise<BackendHealth> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/health`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return {
        online: false,
        message: `Backend responded ${response.status}`,
        url: apiBaseUrl,
      };
    }

    const payload = (await response.json()) as { message?: string; timestamp?: string; environment?: string };

    return {
      online: true,
      message: "Backend connected",
      url: apiBaseUrl,
      timestamp: payload.timestamp,
      environment: payload.environment,
    };
  } catch {
    return {
      online: false,
      message: "Backend unreachable",
      url: apiBaseUrl,
    };
  }
}

export function loginOwner(email: string, password: string): Promise<AuthLoginResult> {
  return backendRequest<AuthLoginResult>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
}

export function createGymOwnerAccount(input: CreateGymOwnerInput): Promise<CreateGymOwnerResult> {
  return backendRequest<CreateGymOwnerResult>(
    "/api/auth/create-gym-owner",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export function getOwnerProfile(accessToken: string): Promise<OwnerUser> {
  return backendRequest<OwnerUser>("/api/auth/profile", { method: "GET" }, accessToken);
}

export function getGym(accessToken: string): Promise<Gym> {
  return backendRequest<Gym>("/api/gym", { method: "GET" }, accessToken);
}

export function getMembers(accessToken: string, role: UserRole = "trainee", page = 1, limit = 50): Promise<MembersResponse> {
  return backendRequest<MembersResponse>(
    `/api/members?role=${encodeURIComponent(role)}&page=${page}&limit=${limit}`,
    { method: "GET" },
    accessToken
  );
}

export function getTrainers(accessToken: string): Promise<Trainer[]> {
  return backendRequest<Trainer[]>("/api/trainers", { method: "GET" }, accessToken);
}

export function getWorkoutPlans(accessToken: string, page = 1, limit = 100): Promise<WorkoutPlansResponse> {
  return backendRequest<WorkoutPlansResponse>(
    `/api/workout-plans?page=${page}&limit=${limit}`,
    { method: "GET" },
    accessToken
  );
}

export function getDietPlans(accessToken: string, page = 1, limit = 100): Promise<DietPlansResponse> {
  return backendRequest<DietPlansResponse>(
    `/api/diet-plans?page=${page}&limit=${limit}`,
    { method: "GET" },
    accessToken
  );
}

export function getPayments(accessToken: string, page = 1, limit = 100): Promise<PaymentsResponse> {
  return backendRequest<PaymentsResponse>(
    `/api/payments?page=${page}&limit=${limit}`,
    { method: "GET" },
    accessToken
  );
}

export function getPaymentSummary(accessToken: string): Promise<PaymentSummary> {
  return backendRequest<PaymentSummary>("/api/payments/summary", { method: "GET" }, accessToken);
}

export function getAttendanceToday(accessToken: string): Promise<AttendanceToday> {
  return backendRequest<AttendanceToday>("/api/attendance/today", { method: "GET" }, accessToken);
}

export function getAttendanceAnalytics(accessToken: string): Promise<AttendanceAnalytics> {
  return backendRequest<AttendanceAnalytics>("/api/attendance/analytics", { method: "GET" }, accessToken);
}

export function getNotifications(accessToken: string, page = 1, limit = 50): Promise<NotificationsResponse> {
  return backendRequest<NotificationsResponse>(
    `/api/notifications?page=${page}&limit=${limit}`,
    { method: "GET" },
    accessToken
  );
}

export function getExpiringSubscriptions(accessToken: string, days = 7): Promise<ExpiringSubscription[]> {
  return backendRequest<ExpiringSubscription[]>(`/api/subscriptions/expiring?days=${days}`, { method: "GET" }, accessToken);
}

export function getReferralStats(accessToken: string): Promise<ReferralStats> {
  return backendRequest<ReferralStats>("/api/referrals/stats", { method: "GET" }, accessToken);
}
