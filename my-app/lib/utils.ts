import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateRange(startDate: string, endDate?: string): string {
  const start = new Date(startDate)
  if (!endDate) {
    return start.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }
  const end = new Date(endDate)
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'open':
    case 'deposit_paid':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'closed':
    case 'fully_paid':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'cancelled':
    case 'refunded':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'pending':
    case 'waiting':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getExperienceLevelColor(level: string | null): string {
  switch (level) {
    case 'beginner':
      return 'bg-emerald-100 text-emerald-800'
    case 'intermediate':
      return 'bg-blue-100 text-blue-800'
    case 'advanced':
      return 'bg-purple-100 text-purple-800'
    case 'pro':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
