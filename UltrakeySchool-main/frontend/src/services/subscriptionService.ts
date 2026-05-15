import apiClient from '../api/client'

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  studentLimit: number
  userLimit: number
  features: string[]
}

export interface Subscription {
  _id: string
  schoolId: string
  planId: string
  planName: string
  status: string
  approvalStatus: string
  price: number
  currency: string
  startDate: string
  endDate: string
  features: string[]
  paymentMethod: {
    type: string
    brand: string
    lastFour: string
  }
}

export interface PaymentData {
  planId: string
  billingCycle: 'monthly' | 'yearly'
  paymentMethod: {
    type: string
    brand: string
    lastFour: string
  }
  amount?: number
  currency?: string
}

export const subscriptionService = {
  // Get available subscription plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get('/subscriptions/plans')
    return response.data.data
  },

  // Get current subscription for the user's institution
  async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const response = await apiClient.get('/subscriptions/current')
      return response.data.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  // Create a new subscription
  async createSubscription(data: PaymentData): Promise<{ subscriptionId: string; status: string; transactionId: string }> {
    const response = await apiClient.post('/subscriptions/create', data)
    return response.data.data
  },

  // Get pending subscriptions (for SuperAdmin)
  async getPendingSubscriptions(): Promise<Subscription[]> {
    const response = await apiClient.get('/subscriptions/pending')
    return response.data.data
  },

  // Approve or reject subscription (for SuperAdmin)
  async approveSubscription(subscriptionId: string, action: 'approve' | 'reject', notes?: string): Promise<void> {
    await apiClient.patch(`/subscriptions/${subscriptionId}/approve`, {
      action,
      notes
    })
  },

  // Format price with currency
  formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price)
  },

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge-soft-warning'
      case 'active':
        return 'badge-soft-success'
      case 'rejected':
        return 'badge-soft-danger'
      case 'suspended':
        return 'badge-soft-secondary'
      case 'expired':
        return 'badge-soft-dark'
      default:
        return 'badge-soft-secondary'
    }
  },

  // Get status text
  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending Approval'
      case 'active':
        return 'Active'
      case 'rejected':
        return 'Rejected'
      case 'suspended':
        return 'Suspended'
      case 'expired':
        return 'Expired'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  },

  // Check if subscription is expiring soon
  isExpiringSoon(endDate: string, days: number = 7): boolean {
    const expiry = new Date(endDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= days && diffDays > 0
  },

  // Get days until expiry
  getDaysUntilExpiry(endDate: string): number {
    const expiry = new Date(endDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}
