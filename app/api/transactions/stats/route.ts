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
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {
      status: "COMPLETED",
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const [totalRevenue, totalTransactions, averageOrderValue, topProducts] = await Promise.all([
      prisma.transaction.aggregate({
        where,
        _sum: {
          total: true,
        },
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({
        where,
        _avg: {
          total: true,
        },
      }),
      prisma.transactionItem.groupBy({
        by: ["productId"],
        where: {
          transaction: where,
        },
        _sum: {
          quantity: true,
          total: true,
        },
        orderBy: {
          _sum: {
            total: "desc",
          },
        },
        take: 5,
      }),
    ])

    // Get product details for top products
    const productIds = topProducts.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
      },
    })

    const topProductsWithDetails = topProducts.map((item) => {
      const product = products.find((p) => p.id === item.productId)
      return {
        product,
        totalQuantity: item._sum.quantity,
        totalRevenue: item._sum.total,
      }
    })

    return NextResponse.json({
      totalRevenue: totalRevenue._sum.total || 0,
      totalTransactions,
      averageOrderValue: averageOrderValue._avg.total || 0,
      topProducts: topProductsWithDetails,
    })
  } catch (error) {
    console.error("Get transaction stats error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
