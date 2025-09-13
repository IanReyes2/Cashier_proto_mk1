import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

// Middleware to verify authentication
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get customers error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    verifyAuth(request)

    const { name, email, phone, address } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    })

    if (existingCustomer) {
      return NextResponse.json({ error: "Customer already exists with this email" }, { status: 409 })
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error("Create customer error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
