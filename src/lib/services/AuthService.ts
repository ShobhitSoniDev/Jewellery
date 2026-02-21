import api from "../axios";
import { API_ENDPOINTS } from "../endpoints";

export interface LoginPayload {
  username: string;
  password: string;
}

export const LoginUser = async (payload: LoginPayload) => {
  try {
  const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, payload);
  console.log("Response received:", response.data);
  return response.data;
} catch (error: any) {
  console.error("Login API error:", error);
  return { code: 0, message: "Login failed" };
}

};
export interface LogoutPayload {
  UserId: string;
}
export const LogoutUser = async (payload: LogoutPayload) => {
  debugger

   const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT, payload);

  return response.data;
};

export interface SignUpPayload {
  userName: string;
  email: string;
  password: string;
  oldPassword?: string;
  mobileNo?: string;
  type?: number;
}

export const SignUp = async (payload: SignUpPayload) => {
   debugger;
     try {
  const response = await api.post(API_ENDPOINTS.AUTH.SignUp_URL, payload);
  console.log("Response received:", response.data);
  return response.data;
} catch (error: any) {
  console.error("SignUp API error:", error);
  return { code: 0, message: "SignUp failed" };
}
};