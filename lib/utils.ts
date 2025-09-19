import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- PATCH START: order helper ---
import type { Order } from "../type"

export async function sendOrder(order: Partial<Order>) {
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to send order")
    }

    return data.data as Order
  } catch (err) {
    console.error("sendOrder error:", err)
    throw err
  }
}

