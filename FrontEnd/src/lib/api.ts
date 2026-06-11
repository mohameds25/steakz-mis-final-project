export type Role = "HEADQUARTER_MANAGER" | "BRANCH_MANAGER" | "CHEF" | "WAITER" | "CASHIER" | "ADMIN" | "CUSTOMER";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | null;
  branchName: string;
};

const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const sameHostApiUrl = `${window.location.protocol}//${window.location.hostname}:4000`;
const apiUrl = configuredApiUrl && !configuredApiUrl.includes("localhost") ? configuredApiUrl : sameHostApiUrl;

export async function login(email: string, password: string) {
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) {
    throw new Error("Login failed");
  }
  return response.json() as Promise<{ token: string; user: SessionUser }>;
}

export async function registerCustomer(name: string, email: string, password: string) {
  const response = await fetch(`${apiUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });
  if (!response.ok) {
    throw new Error("Registration failed");
  }
  return response.json() as Promise<{ token: string; user: SessionUser }>;
}

export async function getResource<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function postResource<T>(path: string, token: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function putResource<T>(path: string, token: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function deleteResource(path: string, token: string): Promise<void> {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
}
