import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BackendApiError, OwnerUser, getOwnerProfile } from "@/lib/api";

export const OWNER_ACCESS_TOKEN_COOKIE = "hyl_owner_access_token";
export const OWNER_REFRESH_TOKEN_COOKIE = "hyl_owner_refresh_token";

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const accessTokenCookieOptions = {
  ...baseCookieOptions,
  maxAge: 60 * 60 * 24 * 7,
};

export const refreshTokenCookieOptions = {
  ...baseCookieOptions,
  maxAge: 60 * 60 * 24 * 30,
};

export async function getOwnerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(OWNER_ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function clearOwnerSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OWNER_ACCESS_TOKEN_COOKIE);
  cookieStore.delete(OWNER_REFRESH_TOKEN_COOKIE);
}

export async function requireOwnerSession(): Promise<{ accessToken: string; user: OwnerUser }> {
  const accessToken = await getOwnerAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  try {
    const user = await getOwnerProfile(accessToken);

    if (user.role !== "owner") {
      redirect("/login?error=owner-only");
    }

    return { accessToken, user };
  } catch (error) {
    if (error instanceof BackendApiError && (error.status === 401 || error.status === 403)) {
      redirect("/login?error=session-expired");
    }

    redirect("/login?error=session-invalid");
  }
}
