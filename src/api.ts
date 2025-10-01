import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
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
  price?: number;
  seats?: number;
}) => {
  return handleRequest(
    api.get("/trips", {
      params: filters, // если filters = undefined → просто /trips
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
  avatar?: string;
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
      avatar: form.avatar,
    })
  );
};
