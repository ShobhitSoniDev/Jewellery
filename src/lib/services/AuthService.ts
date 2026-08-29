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
     try {
  const response = await api.post(API_ENDPOINTS.AUTH.SignUp_URL, payload);
  console.log("Response received:", response.data);
  return response.data;
} catch (error: any) {
  console.error("SignUp API error:", error);
  return { code: 0, message: "SignUp failed" };
}
};


export interface LoginCustomerPayload {
  shopCode: string;
  mobile: string;
  password: string;
}

export const LoginCustomerUser = async (payload: LoginCustomerPayload) => {
  try {
  const response = await api.post(API_ENDPOINTS.AUTH.LOGINCustomer_URL, payload);
  console.log("Response received:", response.data);
  return response.data;
} catch (error: any) {
  console.error("Login API error:", error);
  return { code: 0, message: "Login failed" };
}

};



export interface SignUpCustomerPayload {
  userName: string;
  email: string;
  password: string;
  oldPassword?: string;
  mobileNo?: string;
  type?: number;
}

export const SignUpCustomer = async (payload: SignUpCustomerPayload) => {
     try {
  const response = await api.post(API_ENDPOINTS.AUTH.SignUpCustomer_URL, payload);
  console.log("Response received:", response.data);
  return response.data;
} catch (error: any) {
  console.error("SignUp API error:", error);
  return { code: 0, message: "SignUp failed" };
}
};

export interface CustomerLogoutPayload {
  CustomerId: string;
}

export const CustomerLogoutUser = async (payload: CustomerLogoutPayload) => {
  try {
    const token = sessionStorage.getItem("token");
    const response = await api.post(API_ENDPOINTS.AUTH.LOGOUTCustomer_URL, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  } catch (error: any) {
    // Local logout must still succeed if the server session has already expired.
    return { code: 0, message: error?.response?.data?.message || "Logout failed" };
  }
};


export interface CustomerOrderManagePayload {
  TypeId: number;      // 1 = Get single order + items, 2 = List all orders
  OrderId?: number;    // required for TypeId 1
}

export const Customer_Order_Manage = async (
  payload: CustomerOrderManagePayload
) => {
  try {

    // Get token from sessionStorage
    const token = sessionStorage.getItem("token");

    // Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Customer.Customer_Order_Manage_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;

  } catch (error) {

    console.log("ERROR FULL => ", error?.response);
    console.log("ERROR DATA => ", error?.response?.data);
    throw error;
  }
};
