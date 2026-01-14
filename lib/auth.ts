// Simple authentication utilities
export interface User {
  id: string
  username: string
  role: "cashier" | "admin"
}

export const AUTH_STORAGE_KEY = "cashier_auth"

export function login(username: string, password: string): User {
  const users = [
    { id: "1", username: "cashier", password: "cashier", role: "cashier" as const },
    { id: "2", username: "admin", password: "admin123", role: "admin" as const },
  ]

  const user = users.find(
    (u) => u.username === username && u.password === password
  )

  if (!user) {
    throw new Error("Invalid credentials")
  }

  const authUser = { id: user.id, username: user.username, role: user.role }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser))
  return authUser
}

export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
