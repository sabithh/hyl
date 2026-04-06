import { NextResponse } from "next/server";
import { BackendApiError, loginOwner } from "@/lib/api";
import {
  OWNER_ACCESS_TOKEN_COOKIE,
  OWNER_REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body?.email || !body?.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const auth = await loginOwner(body.email, body.password);

    if (auth.user.role !== "owner") {
      return NextResponse.json(
        {
          success: false,
          message: "Only owner accounts can access owner web.",
        },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(OWNER_ACCESS_TOKEN_COOKIE, auth.accessToken, accessTokenCookieOptions);
    cookieStore.set(OWNER_REFRESH_TOKEN_COOKIE, auth.refreshToken, refreshTokenCookieOptions);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: auth.user,
    });
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to login right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
