"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, Users, LogOut, Utensils } from "lucide-react"

interface OrderItem {
  id: number
  name: string
  description: string
  price: string
  status: string
  orderDate: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
  lastActive: string
}

export default function MenuDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<"history" | "users">("history")
  const [data, setData] = useState<OrderItem[] | User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)

  const fetchData = async (category: "history" | "users") => {
    setLoading(true)
    try {
      // Simulate API call - replace with your actual backend endpoint
      const response = await fetch(`/api/${category}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error(`Failed to fetch ${category}:`, error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(selectedCategory)
  }, [selectedCategory])

  const handleLogout = () => {
    // Add your logout logic here
    console.log("Logging out...")
  }

  const handleManageOrder = (order: OrderItem) => {
    setSelectedOrder(order)
  }

  const handleProceedToCanteen = () => {
    console.log("Proceeding to canteen for order:", selectedOrder?.id)
    setSelectedOrder(null)
  }

  const handleDenyOrder = () => {
    console.log("Denying order:", selectedOrder?.id)
    setSelectedOrder(null)
  }

  const categories = [
    { id: "history", label: "History", icon: History },
    { id: "users", label: "Users", icon: Users },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-900 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Logo placeholder */}
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <img src="/assets/SFAC_LOGO_Edited.png"></img>
            </div>
            <h1 className="text-3xl font-bold">The FrancisCanteen</h1>
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <div className="w-64 bg-red-900 min-h-[calc(100vh-88px)] p-6">
          <nav className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left p-4 h-auto ${
                    selectedCategory === category.id
                      ? "bg-white text-red-900 hover:bg-gray-100"
                      : "text-white hover:bg-red-800"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="text-lg font-medium">{category.label}</span>
                </Button>
              )
            })}

            <div className="pt-4 mt-4 border-t border-red-800">
              <Button
                variant="ghost"
                className="w-full justify-start text-left p-4 h-auto text-white hover:bg-red-800"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span className="text-lg font-medium">Logout</span>
              </Button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold mb-4">Order Management</h3>
                <div className="mb-6">
                  <h4 className="font-semibold">{selectedOrder.name}</h4>
                  <p className="text-gray-600 text-sm">{selectedOrder.description}</p>
                  <p className="text-red-900 font-bold">{selectedOrder.price}</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleProceedToCanteen} className="flex-1 bg-green-600 hover:bg-green-700">
                    Proceed to Canteen
                  </Button>
                  <Button onClick={handleDenyOrder} variant="destructive" className="flex-1">
                    Deny
                  </Button>
                </div>
                <Button onClick={() => setSelectedOrder(null)} variant="outline" className="w-full mt-3">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 capitalize">{selectedCategory}</h2>
            <p className="text-gray-600 mt-1">
              {selectedCategory === "history" ? "View order history and manage orders" : "Manage system users"}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading {selectedCategory}...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedCategory === "history"
                ? // Render order history
                  (data as OrderItem[]).map((order) => (
                    <Card key={order.id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">{order.name}</h3>
                          <span className="text-lg font-bold text-red-900">{order.price}</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-2">{order.description}</p>
                        <div className="text-xs text-gray-500 mb-3">
                          <p>
                            Status: <span className="font-medium">{order.status}</span>
                          </p>
                          <p>Date: {order.orderDate}</p>
                        </div>
                        <Button
                          onClick={() => handleManageOrder(order)}
                          className="w-full bg-red-900 hover:bg-red-800 text-white"
                        >
                          Manage This Order
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                : // Render users
                  (data as User[]).map((user) => (
                    <Card key={user.id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                          <p className="text-gray-600 text-sm">{user.email}</p>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          <p>
                            Role: <span className="font-medium">{user.role}</span>
                          </p>
                          <p>Last Active: {user.lastActive}</p>
                        </div>
                        <Button className="w-full bg-red-900 hover:bg-red-800 text-white">Manage User</Button>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          )}

          {!loading && data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No {selectedCategory} data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
