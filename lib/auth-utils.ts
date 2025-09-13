export interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "CASHIER"
  createdAt: Date
  updatedAt: Date
}

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Login failed")
  }

  const data = await response.json()

  // Store token in localStorage
  localStorage.setItem("auth_token", data.token)

  return data
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: "ADMIN" | "CASHIER" = "CASHIER",
): Promise<{ user: User }> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password, role }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Registration failed")
  }

  return await response.json()
}

export async function getCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem("auth_token")

  if (!token) {
    return null
  }

  try {
    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      localStorage.removeItem("auth_token")
      return null
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    localStorage.removeItem("auth_token")
    return null
  }
}

export function logout(): void {
  localStorage.removeItem("auth_token")
}

export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token")
}
