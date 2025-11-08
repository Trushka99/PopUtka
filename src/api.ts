import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});

const handleRequest = async (request: any) => {
  const MOCK_MODE = false;

  if (MOCK_MODE) {
    return Promise.reject({
      response: {
        status: 503,
        data: { message: "API is not available (mock mode)" },
      },
    });
  }

  try {
    const response = await request;
    return response;
  } catch (err) {
    console.error("Ошибка при выполнении запроса:", err);
    throw err;
  }
};

export const getTrips = async (filters?: {
  from?: string;
  to?: string;
  date?: string;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  timeFrom?: string;
  timeTo?: string;
  driverGender?: string;
}) => {
  return handleRequest(
    api.get("/trips", {
      params: filters,
    })
  );
};
export const register = async (form?: {
  username: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  gender: string;
}) => {
  if (!form) throw new Error("Form data is required");

  return handleRequest(
    api.post("/auth/register", {
      username: form.username,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: form.role,
      firstName: form.firstName,
      lastName: form.lastName,
      gender: form.gender,
    })
  );
};

export const login = async (login: string, password: string) => {
  return handleRequest(
    api.post("/auth/login", {
      login,
      password,
    })
  );
};
export const getMe = async () => {
  return handleRequest(api.get("/auth/me"));
};
export const getTrip = async (id: number) => {
  return handleRequest(api.get(`/trips/${id}`));
};
export const getUser = async (id: number) => {
  return handleRequest(api.get(`/users/${id}`));
};
export const logout = async () => {
  return handleRequest(api.post("/auth/logout"));
};
export const bookTrip = async ({
  tripId,
  seats,
}: {
  tripId: number;
  seats: number;
}) => {
  return handleRequest(
    api.post("/bookings", {
      tripId,
      seats,
    })
  );
};
export const createTrip = async ({
  from,
  to,
  departureTime,
  price,
  availableSeats,
  description,
  instantBooking,
  maxTwoBackSeats,
  departureDate,
}: {
  from: { cityKey: string; address: string };
  to: { cityKey: string; address: string };
  departureTime: string;
  price: number;
  availableSeats: number;
  description: string;
  instantBooking: boolean;
  maxTwoBackSeats: boolean;
  departureDate: string;
}) => {
  return handleRequest(
    api.post("/trips", {
      from,
      to,
      departureTime,
      price,
      availableSeats,
      description,
      instantBooking,
      maxTwoBackSeats,
      departureDate,
    })
  );
};
