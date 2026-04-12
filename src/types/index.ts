// User types
export type UserRole = 'customer' | 'shipowner' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface UserRecord extends User {
  firstName: string;
  lastName: string;
}

// Cabin types
export type CabinType = 'single-riverside' | 'single-inside' | 'double' | 'family' | 'vip';

export interface Cabin {
  id: string;
  type: CabinType;
  number: string;
  capacity: number;
  basePrice: number;
  amenities: string[];
  shipId: string;
}

export interface CabinAvailability {
  cabinId: string;
  available: number;
  booked: number;
  total: number;
}

// Ship types
export interface Ship {
  id: string;
  name: string;
  operator: string;
  ownerId: string;
  commissionRate: number;
  image: string;
  description: string;
  cabins: Cabin[];
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
}

// Route types
export interface Route {
  id: string;
  shipId: string;
  departurePort: string;
  destinationPort: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // in hours
  date: string;
  seatsAvailable: number;
  totalSeats: number;
  basePrice: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

// Booking types
export interface BookingItem {
  cabinId: string;
  cabinType: CabinType;
  cabinNumber: string;
  quantity: number;
  pricePerUnit: number;
}

export interface Booking {
  id: string;
  userId: string;
  routeId: string;
  items: BookingItem[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  passengers: Passenger[];
  paymentStatus?: Payment['status'] | null;
  invoiceAvailable: boolean;
  invoiceNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  documentType: string;
  documentNumber: string;
  gender: 'male' | 'female' | 'other';
}

// Payment types
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: 'sslcommerz' | 'card' | 'bkash' | 'nagad' | 'rocket' | 'upay';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionId: string;
  createdAt: string;
}

export interface FinanceSummary {
  grossEarnings: number;
  platformCommission: number;
  shipownerEarnings: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  availableToWithdraw: number;
}

export interface Withdrawal {
  id: string;
  shipownerId: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  note?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

// Review types
export interface Review {
  id: string;
  userId: string;
  shipId: string;
  rating: number;
  comment: string;
  createdAt: string;
}
