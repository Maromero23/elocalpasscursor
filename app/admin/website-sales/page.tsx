'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  CalendarIcon, 
  DollarSignIcon, 
  UserIcon, 
  BuildingIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FilterIcon,
  SearchIcon,
  DownloadIcon
} from 'lucide-react'

interface WebsiteSale {
  id: string
  qrCode: string
  customerName: string
  customerEmail: string
  amount: number
  guests: number
  days: number
  expiresAt: string
  createdAt: string
  isActive: boolean
  deliveryType: 'immediate' | 'scheduled'
  scheduledFor?: string
  isProcessed?: boolean
  seller: {
    id: string
    name: string
    email: string
    location?: {
      name: string
      distributor?: {
        name: string
      }
    }
  }
}

interface SalesSummary {
  totalSales: number
  totalRevenue: number
  immediateDeliveries: number
  scheduledDeliveries: number
  activeQRCodes: number
  expiredQRCodes: number
}

export default function WebsiteSalesPage() {
  const [sales, setSales] = useState<WebsiteSale[]>([])
  const [summary, setSummary] = useState<SalesSummary>({
    totalSales: 0,
    totalRevenue: 0,
    immediateDeliveries: 0,
    scheduledDeliveries: 0,
    activeQRCodes: 0,
    expiredQRCodes: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sellerFilter, setSellerFilter] = useState('all')
  const [deliveryFilter, setDeliveryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sellers, setSellers] = useState<Array<{id: string, name: string}>>([])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        search: searchTerm,
        status: statusFilter,
        seller: sellerFilter,
        delivery: deliveryFilter
      })

      const response = await fetch(`/api/admin/website-sales?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSales(data.sales)
        setSummary(data.summary)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSellers = async () => {
    try {
      const response = await fetch('/api/admin/sellers')
      if (response.ok) {
        const data = await response.json()
        setSellers(data.sellers)
      }
    } catch (error) {
      console.error('Error fetching sellers:', error)
    }
  }

  useEffect(() => {
    fetchSellers()
  }, [])

  useEffect(() => {
    fetchSales()
  }, [currentPage, searchTerm, statusFilter, sellerFilter, deliveryFilter])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (sale: WebsiteSale) => {
    const now = new Date()
    const expiresAt = new Date(sale.expiresAt)
    const isExpired = now > expiresAt

    if (!sale.isActive) {
      return <Badge variant="destructive">Inactive</Badge>
    }
    if (isExpired) {
      return <Badge variant="secondary">Expired</Badge>
    }
    return <Badge variant="default">Active</Badge>
  }

  const getDeliveryTypeBadge = (sale: WebsiteSale) => {
    if (sale.deliveryType === 'scheduled') {
      return <Badge variant="outline">Scheduled</Badge>
    }
    return <Badge variant="default">Immediate</Badge>
  }

  const exportSales = async () => {
    try {
      const response = await fetch('/api/admin/website-sales/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `website-sales-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting sales:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Website Sales</h1>
          <p className="text-gray-600 mt-2">
            Track all sales from the website with detailed seller information
          </p>
        </div>
        <Button onClick={exportSales} className="flex items-center gap-2">
          <DownloadIcon className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              All time website sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total amount collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active QR Codes</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeQRCodes}</div>
            <p className="text-xs text-muted-foreground">
              Currently active passes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Deliveries</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.scheduledDeliveries}</div>
            <p className="text-xs text-muted-foreground">
              Future scheduled QRs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Customer, email, QR code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Seller</label>
              <Select value={sellerFilter} onValueChange={setSellerFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sellers</SelectItem>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Type</label>
              <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setSellerFilter('all')
                  setDeliveryFilter('all')
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.customerName}</div>
                          <div className="text-sm text-gray-500">{sale.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {sale.qrCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(sale.amount)}</div>
                        <div className="text-sm text-gray-500">
                          {sale.guests} guests, {sale.days} days
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.seller.name}</div>
                          <div className="text-sm text-gray-500">{sale.seller.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.seller.location?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">
                            {sale.seller.location?.distributor?.name || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getDeliveryTypeBadge(sale)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(sale)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(sale.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(sale.expiresAt)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 