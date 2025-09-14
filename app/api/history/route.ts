import { NextResponse } from "next/server"

// Mock data for order history - replace with your actual database queries
const mockOrderHistory = [
  {
    id: 1,
    name: "Grilled Chicken Salad",
    description: "Mixed greens with grilled chicken and vinaigrette",
    price: "$16.99",
    status: "Completed",
    orderDate: "2024-01-15 14:30",
  },
  {
    id: 2,
    name: "Beef Burger",
    description: "Angus beef patty with lettuce, tomato, and fries",
    price: "$18.99",
    status: "Pending",
    orderDate: "2024-01-15 13:45",
  },
  {
    id: 3,
    name: "Caesar Wrap",
    description: "Chicken caesar salad wrapped in a flour tortilla",
    price: "$14.99",
    status: "In Progress",
    orderDate: "2024-01-15 12:20",
  },
  {
    id: 4,
    name: "Fish & Chips",
    description: "Beer-battered cod with crispy fries and tartar sauce",
    price: "$19.99",
    status: "Completed",
    orderDate: "2024-01-14 18:15",
  },
  {
    id: 5,
    name: "Cappuccino",
    description: "Espresso with steamed milk and foam",
    price: "$5.99",
    status: "Completed",
    orderDate: "2024-01-14 16:30",
  },
  {
    id: 6,
    name: "Avocado Toast",
    description: "Smashed avocado on sourdough with cherry tomatoes",
    price: "$11.99",
    status: "Cancelled",
    orderDate: "2024-01-14 10:45",
  },
]

export async function GET() {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // In a real application, you would fetch from your database here
    // const orders = await db.orders.findMany({ orderBy: { createdAt: 'desc' } })

    return NextResponse.json(mockOrderHistory)
  } catch (error) {
    console.error("Error fetching order history:", error)
    return NextResponse.json({ error: "Failed to fetch order history" }, { status: 500 })
  }
}
