import { formatAxiosError } from "@/lib/formatAxiosError";
import { TUser, UserRole } from "@/types/userTypes";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  AxiosRequestConfig,
} from "axios";
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export const API_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!API_URL) {
  throw new Error("VITE_API_BASE_URL is not defined in environment variables");
}

const PUBLIC_URLS = [
  "/login",
  "/instructor/login",
  "/admin/login",
  "/logout",
  "/",
];

const SKIP_TOKEN_REFRESH_URLS = ["/refresh", ...PUBLIC_URLS, "/logout"];

// In‑memory token (we rely on HTTP‑only cookies for persistence)
let accessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

// --- Token refresh queue ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Refresh token function – calls your refresh endpoint
const refreshAccessToken = async (instance: AxiosInstance): Promise<string> => {
  try {
    const response = await instance.post<{ token: string }>("/refresh");
    console.log("Refresh response: ", response.data);
    if (!response.data.token) throw new Error("Invalid refresh response");
    return response.data.token;
  } catch (error) {
    authProvider.setAccessToken(null);

    const { response } = formatAxiosError(error);
    console.error(response);
    throw new Error(response?.message);
  }
};

export const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    withCredentials: true,
    timeout: 40000,
  });

  // Request interceptor: attach token for non‑public endpoints.
  instance.interceptors.request.use((config) => {
    const token = getAccessToken();
    const isPublic = PUBLIC_URLS.some((url) => config.url === url);
    if (token && config.headers && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: on 401, try refreshing the token.
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError): Promise<AxiosResponse> => {
      const originalRequest = error.config as CustomAxiosRequestConfig;
      if (
        SKIP_TOKEN_REFRESH_URLS.some((url) =>
          originalRequest.url?.includes(url),
        )
      ) {
        return Promise.reject(error);
      }

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        if (isRefreshing) {
          // Queue the request while refresh is in progress
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return instance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        return new Promise((resolve, reject) => {
          (async () => {
            try {
              const newToken = await refreshAccessToken(axiosInstance);
              setAccessToken(newToken);
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              processQueue(null, newToken);
              resolve(instance(originalRequest));
            } catch (refreshError) {
              processQueue(refreshError, null);
              reject(refreshError);
            } finally {
              isRefreshing = false;
            }
          })();
        });
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

export const axiosInstance = createAxiosInstance();

// --- authProvider Object ---
export const authProvider = {
  getSession: async (
    signal?: AbortSignal,
  ): Promise<{
    success: boolean;
    data: {
      id: string;
      role: UserRole;
    };
  }> => {
    const response = await axiosInstance.get("/auth/session", { signal });
    return response.data;
  },
  getUserById: async (
    id: string,
    role: UserRole,
    signal?: AbortSignal,
  ): Promise<{ success: boolean; data: TUser }> => {
    const response = await axiosInstance.get(`/${role}/${id}`, {
      signal,
    });
    return response.data;
  },
  refreshAccessToken: async (): Promise<string> => {
    return await refreshAccessToken(axiosInstance);
  },
  logout: async (signal?: AbortSignal): Promise<void> => {
    try {
      await axiosInstance.post("/logout", { signal });
    } catch (error) {
      console.error("Student logout failed", error);
    } finally {
      setAccessToken(null);
    }
  },
  setAccessToken,
  getAccessToken,
};

export default axiosInstance;
