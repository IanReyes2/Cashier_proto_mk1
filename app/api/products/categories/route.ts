import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

function verifyAuth(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    throw new Error("No token provided")
  }

  return jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as {
    userId: string
    email: string
    role: string
  }
}

export async function GET(request: NextRequest) {
  try {
    verifyAuth(request)

    const categories = await prisma.product.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
      where: {
        category: {
          not: null,
        },
      },
    })

    const categoryList = categories.map((item) => item.category).filter(Boolean)

    return NextResponse.json({ categories: categoryList })
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
