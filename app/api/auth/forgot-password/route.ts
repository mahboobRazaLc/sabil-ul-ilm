import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account exists with this email, you will receive a password reset link shortly.",
      });
    }

    // Delete any existing tokens for this user
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate a new token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Build the reset URL
    const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send the email
    await sendPasswordResetEmail(normalizedEmail, resetUrl);

    return NextResponse.json({
      message: "If an account exists with this email, you will receive a password reset link shortly.",
    });
  } catch (error) {
    console.error("[forgot-password] Error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
  }
}
