import { NextResponse } from "next/server"

// Mock data for users - replace with your actual database queries
const mockUsers = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@company.com",
    role: "Manager",
    lastActive: "2024-01-15 15:30",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "Staff",
    lastActive: "2024-01-15 14:45",
  },
  {
    id: 3,
    name: "Mike Davis",
    email: "mike.davis@company.com",
    role: "Chef",
    lastActive: "2024-01-15 16:20",
  },
  {
    id: 4,
    name: "Emily Wilson",
    email: "emily.wilson@company.com",
    role: "Staff",
    lastActive: "2024-01-15 13:15",
  },
  {
    id: 5,
    name: "David Brown",
    email: "david.brown@company.com",
    role: "Admin",
    lastActive: "2024-01-15 12:00",
  },
  {
    id: 6,
    name: "Lisa Garcia",
    email: "lisa.garcia@company.com",
    role: "Staff",
    lastActive: "2024-01-14 17:30",
  },
]

export async function GET() {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // In a real application, you would fetch from your database here
    // const users = await db.users.findMany({ orderBy: { lastActive: 'desc' } })

    return NextResponse.json(mockUsers)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
