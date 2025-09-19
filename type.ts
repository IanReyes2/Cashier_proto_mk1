// src/types.ts

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  notes?: string
}

export interface Order {
  id: string
  customerName: string
  items: OrderItem[]
  total: number
  status: "pending" | "preparing" | "completed" | "cancelled"
  createdAt: string
  updatedAt: string
  tableNumber?: number
  orderType: "dine-in" | "takeout" | "delivery"
}
