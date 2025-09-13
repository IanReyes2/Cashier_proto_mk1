"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { getAuthToken } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LogOut,
  User,
  CreditCard,
  History,
  Store,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Search,
  Edit,
  UserPlus,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react"

interface Product {
  id: string
  name: string
  description?: string
  price: number
  sku: string
  category?: string
  stock: number
}

interface TransactionItem {
  id: string
  productId: string
  quantity: number
  price: number
  total: number
  product?: {
    id: string
    name: string
    sku: string
  }
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}

interface Transaction {
  id: string
  customerId?: string
  userId: string
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: string
  status: string
  createdAt: Date
  updatedAt: Date
  customer?: {
    id: string
    name: string
    email: string
  }
  user?: {
    id: string
    name: string
    email: string
  }
  items: TransactionItem[]
}

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("transactions")

  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  // Transaction state
  const [cart, setCart] = useState<{ productId: string; name: string; price: number; quantity: number }[]>([])
  const [customItem, setCustomItem] = useState({ name: "", price: "" })

  // User management state
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  // History state
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken()
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })
  }

  const fetchProducts = async () => {
    try {
      const response = await apiCall("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await apiCall("/api/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const response = await apiCall("/api/transactions")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    }
  }

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (user) {
      fetchProducts()
      fetchCustomers()
      fetchTransactions()
    }
  }, [user, isLoading, router])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        return prev.map((item) => (item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, change: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const newQuantity = Math.max(0, item.quantity + change)
            return newQuantity === 0 ? null : { ...item, quantity: newQuantity }
          }
          return item
        })
        .filter(Boolean) as typeof cart
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  const addCustomItem = () => {
    if (customItem.name && customItem.price) {
      const price = Number.parseFloat(customItem.price)
      if (!isNaN(price)) {
        const newItem = {
          productId: `custom-${Date.now()}`,
          name: customItem.name,
          price: price,
          quantity: 1,
        }
        setCart((prev) => [...prev, newItem])
        setCustomItem({ name: "", price: "" })
      }
    }
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const processPayment = async () => {
    if (cart.length === 0) return

    setLoading(true)
    try {
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))

      const response = await apiCall("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          items,
          paymentMethod: "Credit Card",
          discount: 0,
          tax: 0,
        }),
      })

      if (response.ok) {
        const newTransaction = await response.json()
        setTransactions((prev) => [newTransaction, ...prev])
        alert(`Payment processed! Total: $${calculateTotal().toFixed(2)}`)
        setCart([])
        // Refresh products to update stock
        fetchProducts()
      } else {
        const error = await response.json()
        alert(`Payment failed: ${error.error}`)
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm)),
  )

  const addCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) return

    setLoading(true)
    try {
      const response = await apiCall("/api/customers", {
        method: "POST",
        body: JSON.stringify(newCustomer),
      })

      if (response.ok) {
        const customer = await response.json()
        setCustomers((prev) => [...prev, customer])
        setNewCustomer({ name: "", email: "", phone: "", address: "" })
        setIsAddCustomerOpen(false)
      } else {
        const error = await response.json()
        alert(`Failed to add customer: ${error.error}`)
      }
    } catch (error) {
      console.error("Add customer error:", error)
      alert("Failed to add customer. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const updateCustomer = async () => {
    if (!editingCustomer) return

    setLoading(true)
    try {
      const response = await apiCall(`/api/customers/${editingCustomer.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editingCustomer.name,
          email: editingCustomer.email,
          phone: editingCustomer.phone,
          address: editingCustomer.address,
        }),
      })

      if (response.ok) {
        const updatedCustomer = await response.json()
        setCustomers((prev) =>
          prev.map((customer) => (customer.id === updatedCustomer.id ? updatedCustomer : customer)),
        )
        setEditingCustomer(null)
      } else {
        const error = await response.json()
        alert(`Failed to update customer: ${error.error}`)
      }
    } catch (error) {
      console.error("Update customer error:", error)
      alert("Failed to update customer. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const deleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return

    setLoading(true)
    try {
      const response = await apiCall(`/api/customers/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCustomers((prev) => prev.filter((customer) => customer.id !== id))
      } else {
        const error = await response.json()
        alert(`Failed to delete customer: ${error.error}`)
      }
    } catch (error) {
      console.error("Delete customer error:", error)
      alert("Failed to delete customer. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      (transaction.user?.name && transaction.user.name.toLowerCase().includes(historySearchTerm.toLowerCase())) ||
      (transaction.customer?.name &&
        transaction.customer.name.toLowerCase().includes(historySearchTerm.toLowerCase())) ||
      transaction.items.some((item) => item.product?.name.toLowerCase().includes(historySearchTerm.toLowerCase()))

    const matchesDate =
      dateFilter === "all" ||
      (() => {
        const transactionDate = new Date(transaction.createdAt)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)

        switch (dateFilter) {
          case "today":
            return transactionDate.toDateString() === today.toDateString()
          case "yesterday":
            return transactionDate.toDateString() === yesterday.toDateString()
          case "week":
            return transactionDate >= weekAgo
          default:
            return true
        }
      })()

    const matchesPayment =
      paymentFilter === "all" || transaction.paymentMethod.toLowerCase() === paymentFilter.toLowerCase()

    return matchesSearch && matchesDate && matchesPayment
  })

  const getTotalRevenue = () => {
    return filteredTransactions.reduce((sum, transaction) => sum + transaction.total, 0)
  }

  const getAverageTransaction = () => {
    return filteredTransactions.length > 0 ? getTotalRevenue() / filteredTransactions.length : 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Store className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Cashier Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{user.name}</span>
              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name}!</h2>
          <p className="text-muted-foreground">Manage your point of sale operations from this dashboard.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>Select items to add to the transaction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {products.map((product) => (
                      <Button
                        key={product.id}
                        variant="outline"
                        className="h-auto p-3 flex flex-col items-start bg-transparent"
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                      >
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm text-muted-foreground">${product.price.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                      </Button>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Add Custom Item</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Item name"
                        value={customItem.name}
                        onChange={(e) => setCustomItem((prev) => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Price"
                        type="number"
                        step="0.01"
                        value={customItem.price}
                        onChange={(e) => setCustomItem((prev) => ({ ...prev, price: e.target.value }))}
                      />
                      <Button onClick={addCustomItem} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Current Transaction
                  </CardTitle>
                  <CardDescription>Review and process the current sale</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No items in cart</div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.productId} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="icon" variant="outline" onClick={() => updateQuantity(item.productId, -1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button size="icon" variant="outline" onClick={() => updateQuantity(item.productId, 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="destructive" onClick={() => removeFromCart(item.productId)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total:</span>
                          <span>${calculateTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={processPayment} className="flex-1" disabled={loading}>
                            {loading ? "Processing..." : "Process Payment"}
                          </Button>
                          <Button onClick={clearCart} variant="outline">
                            Clear Cart
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
                <CardDescription>Manage customer information and accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                        <DialogDescription>Enter customer information to create a new account.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Customer name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="customer@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer((prev) => ({ ...prev, address: e.target.value }))}
                            placeholder="Customer address"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddCustomerOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={addCustomer} disabled={loading}>
                          {loading ? "Adding..." : "Add Customer"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone || "N/A"}</TableCell>
                          <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="icon" variant="outline" onClick={() => setEditingCustomer(customer)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Customer</DialogTitle>
                                    <DialogDescription>Update customer information.</DialogDescription>
                                  </DialogHeader>
                                  {editingCustomer && (
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-name">Name</Label>
                                        <Input
                                          id="edit-name"
                                          value={editingCustomer.name}
                                          onChange={(e) =>
                                            setEditingCustomer((prev) =>
                                              prev ? { ...prev, name: e.target.value } : null,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-email">Email</Label>
                                        <Input
                                          id="edit-email"
                                          type="email"
                                          value={editingCustomer.email}
                                          onChange={(e) =>
                                            setEditingCustomer((prev) =>
                                              prev ? { ...prev, email: e.target.value } : null,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-phone">Phone</Label>
                                        <Input
                                          id="edit-phone"
                                          value={editingCustomer.phone || ""}
                                          onChange={(e) =>
                                            setEditingCustomer((prev) =>
                                              prev ? { ...prev, phone: e.target.value } : null,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-address">Address</Label>
                                        <Input
                                          id="edit-address"
                                          value={editingCustomer.address || ""}
                                          onChange={(e) =>
                                            setEditingCustomer((prev) =>
                                              prev ? { ...prev, address: e.target.value } : null,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditingCustomer(null)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={updateCustomer} disabled={loading}>
                                      {loading ? "Updating..." : "Update Customer"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => deleteCustomer(customer.id)}
                                disabled={loading}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredCustomers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No customers found matching your search." : "No customers yet."}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${getTotalRevenue().toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">From {filteredTransactions.length} transactions</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${getAverageTransaction().toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Per transaction</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredTransactions.length}</div>
                  <p className="text-xs text-muted-foreground">In selected period</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View and filter past transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="week">Last 7 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All methods</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Cashier</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">#{transaction.id.slice(-8)}</TableCell>
                          <TableCell>
                            <div>
                              <div>{new Date(transaction.createdAt).toLocaleDateString()}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(transaction.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {transaction.items.length} item{transaction.items.length !== 1 ? "s" : ""}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">${transaction.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.paymentMethod}</Badge>
                          </TableCell>
                          <TableCell>{transaction.user?.name || "Unknown"}</TableCell>
                          <TableCell>{transaction.customer?.name || "Walk-in"}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => setSelectedTransaction(transaction)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Transaction Details</DialogTitle>
                                  <DialogDescription>
                                    Transaction #{transaction.id.slice(-8)} -{" "}
                                    {new Date(transaction.createdAt).toLocaleDateString()} at{" "}
                                    {new Date(transaction.createdAt).toLocaleTimeString()}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedTransaction && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Cashier</Label>
                                        <p className="text-sm">{selectedTransaction.user?.name || "Unknown"}</p>
                                      </div>
                                      <div>
                                        <Label>Customer</Label>
                                        <p className="text-sm">{selectedTransaction.customer?.name || "Walk-in"}</p>
                                      </div>
                                      <div>
                                        <Label>Payment Method</Label>
                                        <p className="text-sm">{selectedTransaction.paymentMethod}</p>
                                      </div>
                                      <div>
                                        <Label>Total</Label>
                                        <p className="text-sm font-medium">${selectedTransaction.total.toFixed(2)}</p>
                                      </div>
                                    </div>
                                    <Separator />
                                    <div>
                                      <Label>Items</Label>
                                      <div className="mt-2 space-y-2">
                                        {selectedTransaction.items.map((item, index) => (
                                          <div
                                            key={index}
                                            className="flex justify-between items-center p-2 bg-muted rounded"
                                          >
                                            <div>
                                              <span className="font-medium">
                                                {item.product?.name || "Unknown Item"}
                                              </span>
                                              <span className="text-sm text-muted-foreground ml-2">
                                                x{item.quantity}
                                              </span>
                                            </div>
                                            <span>${item.total.toFixed(2)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
                                    Close
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredTransactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {historySearchTerm || dateFilter !== "all" || paymentFilter !== "all"
                      ? "No transactions found matching your filters."
                      : "No transactions yet."}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
