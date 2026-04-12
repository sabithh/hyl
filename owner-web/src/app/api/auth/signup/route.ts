import { NextResponse } from "next/server";
import { BackendApiError, CreateGymOwnerInput, createGymOwnerAccount } from "@/lib/api";
import {
  OWNER_ACCESS_TOKEN_COOKIE,
  OWNER_REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/session";
import { cookies } from "next/headers";

const requiredFields: Array<keyof CreateGymOwnerInput> = [
  "gymName",
  "gymEmail",
  "ownerName",
  "ownerEmail",
  "ownerPassword",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CreateGymOwnerInput> & { confirmPassword?: string };

    for (const field of requiredFields) {
      const value = body[field];
      if (typeof value !== "string" || value.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            message: `${field} is required.`,
          },
          { status: 400 }
        );
      }
    }

    if (body.confirmPassword !== undefined && body.ownerPassword !== body.confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Passwords do not match.",
        },
        { status: 400 }
      );
    }

    const auth = await createGymOwnerAccount({
      gymName: body.gymName!.trim(),
      gymEmail: body.gymEmail!.trim(),
      gymPhone: body.gymPhone?.trim() || undefined,
      gymAddress: body.gymAddress?.trim() || undefined,
      gymCity: body.gymCity?.trim() || undefined,
      gymState: body.gymState?.trim() || undefined,
      gymCountry: body.gymCountry?.trim() || undefined,
      gymPincode: body.gymPincode?.trim() || undefined,
      ownerName: body.ownerName!.trim(),
      ownerEmail: body.ownerEmail!.trim(),
      ownerPhone: body.ownerPhone?.trim() || undefined,
      ownerPassword: body.ownerPassword!,
    });

    if (auth.user.role !== "owner") {
      return NextResponse.json(
        {
          success: false,
          message: "Owner account could not be created.",
        },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(OWNER_ACCESS_TOKEN_COOKIE, auth.accessToken, accessTokenCookieOptions);
    cookieStore.set(OWNER_REFRESH_TOKEN_COOKIE, auth.refreshToken, refreshTokenCookieOptions);

    return NextResponse.json({
      success: true,
      message: "Owner account created",
      user: auth.user,
      gym: auth.gym,
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
        message: "Unable to create owner account right now.",
      },
      { status: 500 }
    );
  }
}
