export interface Affiliate {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
  email: string
  workPhone: string | null
  whatsApp: string | null
  address: string | null
  web: string | null
  description: string | null
  city: string | null
  maps: string | null
  location: string | null
  discount: string | null
  logo: string | null
  facebook: string | null
  instagram: string | null
  category: string | null
  subCategory: string | null
  service: string | null
  type: string | null
  rating: number | null
  recommended: boolean
  totalVisits: number
  isActive: boolean
} 