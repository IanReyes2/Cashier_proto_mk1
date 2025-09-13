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

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: true,
              },
            },
          },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Get transaction error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuth(request)

    // Only admins can update transactions
    if (auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { status } = await request.json()

    if (!["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const transaction = await prisma.transaction.update({
      where: { id: params.id },
      data: { status },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Update transaction error:", error)
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
