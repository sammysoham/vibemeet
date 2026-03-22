import { getAuthSession } from "@/lib/auth";
import type { Friend, User } from "@/types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: BodyInit | object;
  token?: string;
  isFormData?: boolean;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = getAuthSession();
  const token = options.token || session?.token;
  const headers = new Headers();

  if (!options.isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body:
      options.body && !options.isFormData
        ? JSON.stringify(options.body)
        : (options.body as BodyInit | undefined),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data as T;
}

export const api = {
  signup: (payload: {
    email: string;
    password: string;
    displayName: string;
    gender: string;
    acceptedTerms: boolean;
  }) =>
    apiRequest<{ token: string; user: User }>("/api/auth/signup", {
      method: "POST",
      body: payload,
    }),
  login: (payload: {
    email: string;
    password: string;
    acceptedTerms: boolean;
  }) =>
    apiRequest<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: payload,
    }),
  guest: (payload: {
    displayName: string;
    gender: string;
    acceptedTerms: boolean;
  }) =>
    apiRequest<{ token: string; user: User }>("/api/auth/guest", {
      method: "POST",
      body: payload,
    }),
  me: () => apiRequest<{ user: User }>("/api/auth/me"),
  getOnlineCount: () => apiRequest<{ count: number }>("/api/users/online"),
  listFriends: () => apiRequest<{ friends: Friend[] }>("/api/friends"),
  addFriend: (friendUserId: string) =>
    apiRequest<{ friendship: Friend }>("/api/friends", {
      method: "POST",
      body: { friendUserId },
    }),
  checkout: () =>
    apiRequest<{
      checkoutUrl: string | null;
      demoMode: boolean;
      message?: string;
      user?: User;
    }>("/api/billing/checkout", {
      method: "POST",
    }),
  reportUser: (payload: { reportedUserId: string; reason: string }) =>
    apiRequest("/api/reports", {
      method: "POST",
      body: payload,
    }),
  uploadChatMedia: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<{
      url: string;
      mediaType: "image" | "video";
      fileName: string;
    }>("/api/uploads/chat-media", {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  },
};
