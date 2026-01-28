"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Users, LogOut, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL, WS_URL } from "../../config";
import { getCurrentUser, User } from "@/lib/auth";

// --------------------
// Interfaces
// --------------------
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

interface MenuItem {
  id: number;
  name: string;
  price: number;
  available: boolean;
  category?: string;
  availabilities?: { dayOfWeek: string }[];
}

// --------------------
// Kiosk API URL
// --------------------
const KIOSK_URL = "http://localhost:3000"; // Replace with your kiosk frontend URL
const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function MenuDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<"history" | "menu">(
    "history",
  );
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const router = useRouter();

  // --------------------
  // Auth Guard
  // --------------------
  useEffect(() => {
    const storedUser = getCurrentUser();
    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(storedUser);
    }
  }, [router]);

  // --------------------
  // Fetch Orders
  // --------------------
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/order`);
      const jsonData = await res.json();
      const data: Order[] = Array.isArray(jsonData) ? jsonData : [];
      const normalizedOrders = data.map((o) => ({
        ...o,
        items: o.items || [],
      }));
      setOrders(normalizedOrders.filter((o) => o.status === "pending"));
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------
  // Fetch Menu Items
  // --------------------
  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kiosk-menu");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------
  // WebSocket for real-time updates
  // --------------------
  useEffect(() => {
    if (selectedCategory !== "history") return;

    wsRef.current = new WebSocket(WS_URL);
    wsRef.current.onopen = () => console.log("WebSocket connected");

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "init") {
          const normalizedOrders = (
            Array.isArray(data.orders) ? data.orders : []
          ).map((o: Order) => ({ ...o, items: o.items || [] }));
          setOrders(
            normalizedOrders.filter((o: Order) => o.status === "pending"),
          );
        } else if (data.type === "new_order") {
          if (data.order.status === "pending") {
            setOrders((prev) => {
              if (prev.find((o) => o.id === data.order.id)) return prev;
              return [
                ...prev,
                { ...data.order, items: data.order.items || [] },
              ];
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

  // --------------------
  // Initial fetch
  // --------------------
  useEffect(() => {
    if (selectedCategory === "history") fetchOrders();
    else fetchMenuItems();
  }, [selectedCategory]);

  // --------------------
  // Actions
  // --------------------
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
        setOrders((prev: Order[]) =>
          prev.filter((o) => o.id !== selectedOrder.id),
        );
        setSelectedOrder(null);
      } else {
        let errorBody: unknown;
        try {
          errorBody = await res.json();
        } catch {
          errorBody = await res.text();
        }
        console.error("❌ Failed to confirm order:", errorBody);
      }
    } catch (err) {
      console.error("❌ Error confirming order:", err);
    }
  };

 const handleDenyOrder = async () => {
  if (!selectedOrder) return;

  try {
    const res = await fetch(`${API_URL}/api/order/${selectedOrder.id}`, {
      method: "DELETE",
      credentials: "include", // keep if backend expects cookies
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }

    setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
    setSelectedOrder(null);
  } catch (err) {
    console.error("❌ Failed to deny order:", err);
  }
};


  const openMenuModal = (item: MenuItem) => {
    setEditingItem(item);
    setSelectedDays(
      item.availabilities?.map((a) => a.dayOfWeek.toLowerCase()) || [],
    );
  };

  const handleSaveAvailability = async () => {
    if (!editingItem) return;

    await fetch("/api/kiosk-menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingItem.id,
        days: selectedDays,
      }),
    });

    fetchMenuItems();
    setEditingItem(null);
    setSelectedDays([]);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  // --------------------
  // Categories
  // --------------------
  const categories = [
    { id: "history", label: "Orders", icon: History },
    { id: "menu", label: "Menu Maker", icon: UtensilsCrossed },
  ] as const;

  // --------------------
  // Render
  // --------------------
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

            {/* Actions Section */}
            <div className="pt-4 mt-4 border-t border-red-800 space-y-2">
              <div>
                <button
                  onClick={() =>
                    window.open(`${API_URL}/api/export/orders`, "_blank")
                  }
                  className=" bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded"
                >
                  Download Orders CSV
                </button>
              </div>

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
          {/* Order Modal */}
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

          {/* Menu Maker Modal */}
          {editingItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">
                  {editingItem.name} Availability
                </h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      className={`py-2 px-3 rounded border ${
                        selectedDays.includes(day)
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                      onClick={() => toggleDay(day)}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveAvailability} className="flex-1">
                    Save
                  </Button>
                  <Button
                    onClick={() => setEditingItem(null)}
                    variant="destructive"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Orders / Menu List */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedCategory === "history"
                ? "Order Management"
                : "Menu Maker"}
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedCategory === "history"
                ? "View order history and manage orders"
                : "Edit menu item availability"}
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
                          {order.items?.map((item, idx) => (
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
                : menuItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {item.name}
                          </h3>
                          <span className="font-bold text-red-900">
                            ₱{item.price}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Category: {item.category ?? "Uncategorized"}
                        </p>
                        <p
                          className={`text-sm font-medium mb-3 ${
                            item.available ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {item.available ? "Available" : "Unavailable"}
                        </p>
                        <div className="text-xs text-gray-500 mb-4">
                          Available on:{" "}
                          {item.availabilities && item.availabilities.length > 0
                            ? item.availabilities
                                .map((d) => d.dayOfWeek)
                                .join(", ")
                            : "None"}
                        </div>
                        <Button
                          className="w-full mb-2"
                          variant="outline"
                          onClick={() => openMenuModal(item)}
                        >
                          Edit Availability
                        </Button>
                        <Button
                          className="w-full"
                          variant={item.available ? "destructive" : "default"}
                          onClick={async () => {
                            await fetch("/api/kiosk-menu", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                id: item.id,
                                available: !item.available,
                              }),
                            });

                            fetchMenuItems();
                          }}
                        >
                          {item.available ? "Disable Item" : "Enable Item"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          )}

          {!loading &&
            ((selectedCategory === "history" && orders.length === 0) ||
              (selectedCategory === "menu" && menuItems.length === 0)) && (
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
