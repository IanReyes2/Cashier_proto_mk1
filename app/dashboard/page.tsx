"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Users, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL, WS_URL } from "../../config";

// ✅ Full and corrected interface definitions
interface OrderItemDetail {
  id?: string;
  name: string;
  price: number;
  quantity?: number;
  description?: string;
  notes?: string | null;
  orderId?: string;
}

interface Order {
  id: string;
  orderCode?: string;
  items: OrderItemDetail[];
  total: number;
  status: string;
  orderDate?: string;
  customerName?: string;
  orderType?: string;
  tableNumber?: string | null;
  createdAt?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  lastActive: string;
}

export default function MenuDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<"history" | "users">(
    "history"
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const router = useRouter();

  // ✅ Fetch orders (pending only)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/order`);
      const data: Order[] = await res.json();
      const pendingOrders = data.filter((o) => o.status === "pending");
      setOrders(pendingOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data: User[] = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ WebSocket: update orders in real time
  useEffect(() => {
    if (selectedCategory !== "history") return;

    wsRef.current = new WebSocket(WS_URL);
    wsRef.current.onopen = () => console.log("WebSocket connected");

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "init") {
          setOrders(data.orders.filter((o: Order) => o.status === "pending"));
        } else if (data.type === "new_order") {
          if (data.order.status === "pending") {
            setOrders((prev) => {
              if (prev.find((o) => o.id === data.order.id)) return prev;
              return [...prev, data.order];
            });
          }
        } else if (data.type === "status_update") {
          setOrders((prev) => prev.filter((o) => o.id !== data.order.id));
        } else if (data.type === "clear") setOrders([]);
      } catch (e) {
        console.error("Invalid WebSocket message", e);
      }
    };

    wsRef.current.onclose = () => console.log("WebSocket disconnected");
    return () => wsRef.current?.close();
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory !== "history") {
      fetchUsers();
    } else {
      fetchOrders();
    }
  }, [selectedCategory]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleManageOrder = (order: Order) => setSelectedOrder(order);

  const handleProceedToCanteen = async () => {
    if (!selectedOrder) return;

    try {
      const res = await fetch(`${API_URL}/api/order/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });

      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
        setSelectedOrder(null);
      } else {
        console.error("❌ Failed to confirm order", await res.json());
      }
    } catch (err) {
      console.error("❌ Error confirming order:", err);
    }
  };

  const handleDenyOrder = () => setSelectedOrder(null);

  const categories = [
    { id: "history", label: "Orders", icon: History },
    { id: "users", label: "Users", icon: Users },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-900 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <img src="/assets/SFAC_LOGO_Edited.png" />
            </div>
            <h1 className="text-3xl font-bold">THE FRANCISCanteen</h1>
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <div className="w-64 bg-red-900 min-h-[calc(100vh-88px)] p-6">
          <nav className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "secondary" : "ghost"
                  }
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
              );
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
            <div>
              <button
                onClick={() => {
                  // Use your backend IP:port
                  window.open(
                    "http://192.168.1.11:3001/api/export/orders",
                    "_blank"
                  );
                }}
                className=" bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded"
              >
                Download Orders CSV
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold mb-4">Order Management</h3>
                <div className="mb-6">
                  <h4 className="font-semibold">
                    {selectedOrder.items.map((i) => i.name).join(", ")}
                  </h4>
                  <p className="text-red-900 font-bold">
                    ₱{selectedOrder.total}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleProceedToCanteen}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Proceed to Canteen
                  </Button>
                  <Button
                    onClick={handleDenyOrder}
                    variant="destructive"
                    className="flex-1"
                  >
                    Deny
                  </Button>
                </div>
                <Button
                  onClick={() => setSelectedOrder(null)}
                  variant="outline"
                  className="w-full mt-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Orders / Users List */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedCategory === "history" ? "Order Management" : "Users"}
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedCategory === "history"
                ? "View order history and manage orders"
                : "Manage system users"}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading {selectedCategory}...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedCategory === "history"
                ? orders.map((order) => (
                    <Card
                      key={order.id}
                      className="hover:shadow-lg transition-shadow duration-200"
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          {/* ✅ Display orderCode instead of long id */}
                          <h3 className="text-lg font-semibold text-gray-800">
                            Order #{order.orderCode || order.id}
                          </h3>
                          <span className="text-lg font-bold text-red-900">
                            ₱{order.total}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          <p>
                            Status:{" "}
                            <span className="font-medium">{order.status}</span>
                          </p>
                          <p>Date: {order.orderDate || "N/A"}</p>
                        </div>
                        <div className="mt-4 space-y-1">
                          {order.items.map((item, idx) => (
                            <p key={idx} className="text-sm text-gray-700">
                              • {item.name} — ₱{item.price}
                            </p>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleManageOrder(order)}
                          className="w-full mt-4 bg-red-900 hover:bg-red-800 text-white"
                        >
                          Manage This Order
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                : users.map((user) => (
                    <Card
                      key={user.id}
                      className="hover:shadow-lg transition-shadow duration-200"
                    >
                      <CardContent className="p-6">
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {user.name}
                          </h3>
                          <p className="text-gray-600 text-sm">{user.email}</p>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          <p>
                            Role:{" "}
                            <span className="font-medium">{user.role}</span>
                          </p>
                          <p>Last Active: {user.lastActive}</p>
                        </div>
                        <Button className="w-full bg-red-900 hover:bg-red-800 text-white">
                          Manage User
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          )}

          {!loading &&
            ((selectedCategory === "history" && orders.length === 0) ||
              (selectedCategory === "users" && users.length === 0)) && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No {selectedCategory} data available
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
