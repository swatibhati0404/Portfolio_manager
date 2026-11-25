
const API_URL = "http://localhost:5000/api";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data;
}
