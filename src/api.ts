import axios from "axios";

const api = axios.create({
  baseURL: "https://api.pop-utka.uz",
  withCredentials: true,
});
export const billingApi = axios.create({
  baseURL: "https://billing.pop-utka.uz",
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
export const createPayment = (data: any) => {
  return billingApi.post("/api/payment/orders", data);
};

export const getPayment = (paymentId: string) => {
  return billingApi.get(`/api/payment/status/${paymentId}`);
};

export const createChat = (id: string) => {
  return handleRequest(
    api.post("/chats", {
      user2Id: id,
    }),
  );
};
export const getChats = () => {
  return handleRequest(api.get("/chats"));
};
export const createReview = async (data: {
  tripId: string;
  targetUserId: string;
  text: string;
  rating: number;
  driving?: number;
  cleanliness?: number;
  politeness?: number;
}) => {
  return handleRequest(api.post("/reviews", data));
};
export const getChatByID = (id: string) => {
  return handleRequest(api.get(`/chats/${id}`));
};
export const getReviews = (id: string) => {
  return handleRequest(api.get(`/reviews/user/${id}`));
};
export const apiUploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);

  return handleRequest(
    api.post("/upload/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  );
};
export const getTrips = async (filters?: {
  from?: string;
  to?: string;
  departureAt?: string;
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
    }),
  );
};
export const register = async (form?: {
  username: string;
  email: string;
  birthDate: string;
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
      birthDate: form.birthDate,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: form.role,
      firstName: form.firstName,
      lastName: form.lastName,
      gender: form.gender,
    }),
  );
};
export const checkRegister = async (form?: {
  loginstr: string;
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
}) => {
  if (!form) throw new Error("Form data is required");

  return handleRequest(
    api.post("/auth/check-register", {
      username: form.loginstr,
      email: form.email,
      phone: form.phone,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      birthDate: form.birthDate,
    }),
  );
};
export const checkRecover = async (phone: string) => {
  if (!phone) throw new Error("Form data is required");

  return handleRequest(
    api.post("/auth/check-recover", {
      phone: phone,
    }),
  );
};

export const login = async (login: string, password: string) => {
  return handleRequest(
    api.post("/auth/login", {
      login,
      password,
    }),
  );
};
export const getMe = async () => {
  return handleRequest(api.get("/auth/me"));
};
export const getTrip = async (id: string) => {
  return handleRequest(api.get(`/trips/${id}`));
};
export const getBooking = async (id: string) => {
  return handleRequest(api.get(`/bookings/${id}`));
};
export const getTripHistory = async () => {
  return handleRequest(api.get("/bookings/passenger/history"));
};
export const getMyBookings = async () => {
  return handleRequest(api.get("bookings/me"));
};
export const confirmBooking = async (id: string) => {
  return handleRequest(api.patch(`/driver/bookings/${id}/confirm`));
};
export const completeTrip = async (id: string) => {
  return handleRequest(api.patch(`/trips/${id}/complete`));
};
export const markUnreadAsRead = async () => {
  return handleRequest(api.patch("/notifications/read-all"));
};
export const markAsRead = async (id: string) => {
  return handleRequest(api.patch(`/notifications/${id}/read`));
};
export const rejectBooking = async (id: string) => {
  return handleRequest(api.patch(`/driver/bookings/${id}/reject`));
};
export const getUser = async (id: string) => {
  return handleRequest(api.get(`/users/${id}`));
};
export const createCode = async ({
  phone,
  type,
}: {
  phone: string;
  type: string;
}) => {
  return handleRequest(
    api.post("/otp", {
      phone,
      type,
    }),
  );
};
export const confirmCode = async ({
  phone,
  type,
  inputCode,
}: {
  phone: string;
  type: string;
  inputCode: string;
}) => {
  return handleRequest(
    api.post("/otp/verify", {
      phone,
      type,
      inputCode,
    }),
  );
};

export const resetPass = async ({
  phone,
  newPassword,
}: {
  phone: string;
  newPassword: string;
}) => {
  return handleRequest(
    api.post("/pass/reset", {
      phone,
      newPassword,
    }),
  );
};
export const updateCar = async (
  id: string,
  { model, color, year, licensePlate }: any,
) => {
  return handleRequest(
    api.patch(`/users/me/car`, { model, color, year, licensePlate }),
  );
};
export const updateProfile = async (body: any) => {
  return handleRequest(api.patch(`/users/me`, body));
};
export const updateCarPhoto = async (file: File) => {
  const formData = new FormData();
  formData.append("photos", file);

  return handleRequest(
    api.post(`/upload/car`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  );
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
    }),
  );
};
export const createTrip = async ({
  from,
  to,
  price,
  availableSeats,
  description,
  maxTwoBackSeats,
  departureAt,
}: {
  from: { cityKey: string; address: string };
  to: { cityKey: string; address: string };
  departureAt: string;
  price: number;
  availableSeats: number;
  description: string;
  maxTwoBackSeats: boolean;
}) => {
  return handleRequest(
    api.post("/trips", {
      from,
      to,
      departureAt,
      price,
      availableSeats,
      description,
      maxTwoBackSeats,
    }),
  );
};
