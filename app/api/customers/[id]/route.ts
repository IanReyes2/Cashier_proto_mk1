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

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Get customer error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    verifyAuth(request)

    const { name, email, phone, address } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name,
        email,
        phone,
        address,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Update customer error:", error)
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    verifyAuth(request)

    await prisma.customer.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Customer deleted successfully" })
  } catch (error) {
    console.error("Delete customer error:", error)
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
