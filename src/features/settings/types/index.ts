export interface OnboardingStatus {
  shopProfileCompleted: boolean
  firstProductAdded: boolean
  firstStudentAdded: boolean
  firstSaleCompleted: boolean
  completedCount: number
  totalCount: number
  allCompleted: boolean
}

export interface ShopProfileData {
  name: string
  phone: string
  address: string
  business_hours: string
  business_number: string
}
