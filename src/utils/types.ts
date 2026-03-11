export type CoordinatesPoint = {
  lat: number;
  lon: number;
};

export type TripCoordinates = {
  from: CoordinatesPoint;
  to: CoordinatesPoint;
};

export type TripInfo = {
  distance: number;
  duration: number;
  coordinates: TripCoordinates;
};

export type Location = {
  address: string;
  cityKey: string;
};
export type Booking = {
  id: string;
  seats: number;
  status: "confirmed" | "pending" | "cancelled";
  createdAt: string;
  updatedAt: string;
  passenger: Passenger;
  passengerId: string;
};
export type Passenger = {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  rating: number;
  telegram: string | null;
  phone: string;
};

export type TripStatus = "active" | "completed" | "cancelled";
export type UserRole = "driver" | "passenger";
export type TTrip = {
  id: string;
  role: UserRole;
  from: Location;
  to: Location;
  departureAt: string;
  price: number;
  availableSeats: number;
  description: string;
  instantBooking: boolean;
  maxTwoBackSeats: boolean;
  status: TripStatus;
  tripInfo: TripInfo;
  createdAt: string;
  updatedAt: string;
  bookings: Booking[];
};
export type TTripCard =
  | { type: "trip"; data: TTrip }
  | { type: "booking"; data: TBooking };
export type TBooking = {
  createdAt: string;
  id: string;
  passenger: Passenger;
  passengerId: string;
  seats: number;
  status: string;
  trip: {
    availableSeats: number;
    createdAt: string;
    departureAt: string;
    description: string;
    driver: Passenger;
    driverId: string;
    from: TripCoordinates;
    id: string;
    instantBooking: boolean;
    maxTwoBackSeats: boolean;
    price: number;
    status: string;
    to: TripCoordinates;
    tripInfo: TripInfo;
    updatedAt: string;
    tripId: string;
  };
  updatedAt: string;
};
