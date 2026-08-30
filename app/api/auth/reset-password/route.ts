import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid reset link." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 });
    }

    if (new Date() > resetToken.expiresAt) {
      // Delete expired token
      await db.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update the user's password and delete the token
    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      db.passwordResetToken.delete({ where: { id: resetToken.id } }),
    ]);

    return NextResponse.json({
      message: "Your password has been reset successfully! You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("[reset-password] Error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
  }
}
