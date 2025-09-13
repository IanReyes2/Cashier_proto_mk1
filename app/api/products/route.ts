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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { sku: { contains: search, mode: "insensitive" as const } },
      ]
    }

    if (category) {
      where.category = category
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get products error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request)

    // Only admins can create products
    if (auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { name, description, price, sku, category, stock } = await request.json()

    if (!name || !price || !sku) {
      return NextResponse.json({ error: "Name, price, and SKU are required" }, { status: 400 })
    }

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    })

    if (existingProduct) {
      return NextResponse.json({ error: "Product with this SKU already exists" }, { status: 409 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number.parseFloat(price),
        sku,
        category,
        stock: Number.parseInt(stock) || 0,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Create product error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
