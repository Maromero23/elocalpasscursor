"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "../../../components/auth/protected-route"
import Link from "next/link"
import { Building2, Users, MapPin, QrCode } from "lucide-react"

const getNavItems = (userRole: string) => {
  if (userRole === "ADMIN") {
    return [
      { href: "/admin", label: "Dashboard", icon: Building2 },
      { href: "/admin/distributors", label: "Distributors", icon: Users },
      { href: "/admin/locations", label: "Locations", icon: MapPin },
      { href: "/admin/sellers", label: "Sellers", icon: Users },
      { href: "/admin/qr-config", label: "QR Config", icon: QrCode },
    ]
  }
  return []
}

interface Seller {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function SellersManagement() {
  const { data: session } = useSession()
  const navItems = getNavItems(session?.user?.role || "")
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  })

  // Fetch sellers
  const fetchSellers = async () => {
    try {
      const response = await fetch("/api/admin/sellers")
      if (response.ok) {
        const data = await response.json()
        setSellers(data.sellers || [])
      }
    } catch (error) {
      console.error("Error fetching sellers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSellers()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingSeller ? `/api/admin/sellers/${editingSeller.id}` : "/api/admin/sellers"
      const method = editingSeller ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchSellers()
        setShowCreateForm(false)
        setEditingSeller(null)
        setFormData({ name: "", email: "", password: "" })
      } else {
        const error = await response.json()
        alert(error.message || "Error saving seller")
      }
    } catch (error) {
      console.error("Error saving seller:", error)
      alert("Error saving seller")
    }
  }

  // Handle delete
  const handleDelete = async (sellerId: string) => {
    if (!confirm("Are you sure you want to delete this seller?")) return

    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchSellers()
      } else {
        alert("Error deleting seller")
      }
    } catch (error) {
      console.error("Error deleting seller:", error)
      alert("Error deleting seller")
    }
  }

  // Handle edit
  const handleEdit = (seller: Seller) => {
    setEditingSeller(seller)
    setFormData({
      name: seller.name,
      email: seller.email,
      password: ""
    })
    setShowCreateForm(true)
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-orange-400 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
                <div className="flex space-x-4">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-orange-100 hover:text-white hover:bg-orange-500"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-xs text-orange-200">1:50 PM</span>
                <span className="text-sm text-orange-100">Welcome, {session?.user?.name}</span>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
                >
                  Create New Seller
                </button>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* Create/Edit Form Modal */}
            {showCreateForm && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingSeller ? "Edit Seller" : "Create New Seller"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Password {editingSeller && "(leave blank to keep current)"}
                        </label>
                        <input
                          type="password"
                          required={!editingSeller}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                        >
                          {editingSeller ? "Update" : "Create"} Seller
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false)
                            setEditingSeller(null)
                            setFormData({ name: "", email: "", password: "" })
                          }}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Sellers Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Sellers ({sellers.length})
                </h2>
                
                {loading ? (
                  <div className="text-center py-4">Loading sellers...</div>
                ) : sellers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No sellers found. Create the first one!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sellers.map((seller) => (
                          <tr key={seller.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{seller.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{seller.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(seller.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEdit(seller)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(seller.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
