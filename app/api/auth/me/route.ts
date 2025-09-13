import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as {
      userId: string
      email: string
      role: string
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}
