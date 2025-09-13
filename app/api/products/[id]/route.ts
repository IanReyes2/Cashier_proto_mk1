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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    verifyAuth(request)

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuth(request)

    // Only admins can update products
    if (auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { name, description, price, sku, category, stock } = await request.json()

    if (!name || !price || !sku) {
      return NextResponse.json({ error: "Name, price, and SKU are required" }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price: Number.parseFloat(price),
        sku,
        category,
        stock: Number.parseInt(stock) || 0,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Update product error:", error)
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuth(request)

    // Only admins can delete products
    if (auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Delete product error:", error)
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
