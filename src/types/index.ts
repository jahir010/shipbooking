// User types
export type UserRole = 'customer' | 'shipowner' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
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
  method: 'card' | 'bkash' | 'nagad' | 'rocket' | 'upay';
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  createdAt: string;
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
