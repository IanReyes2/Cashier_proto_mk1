import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Simple password check (no hashing)
    if (user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "24h" }
    );

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
