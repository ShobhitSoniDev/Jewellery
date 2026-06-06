import api from "../axios";
import { API_ENDPOINTS } from "../endpoints";
import Swal from "sweetalert2";


export interface StockTransaction_ManagePayload {
  StockId: number;
  ProductId: number;
  TransactionType: number,
  Quantity?: number;
  Weight: number,
  ReferenceType: string,
  TransactionDate: string,
  TypeId: number,
}

export const StockTransaction_Manage = async (payload: StockTransaction_ManagePayload) => {
  try {
    // ✅ Get token from sessionStorage
    const token = sessionStorage.getItem("token");
    // ✅ Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Transactions.StockTransaction_Manage_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}` // pass token
        }
      }
    );
    
    return response.data;
    } catch (error) {
  console.error(error);

  let message = "Something went wrong";

  if (error instanceof Error) {
    message = error.message;
  }

  Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
  });
}
};
export const LoanEntry_Manage = async (formData: FormData) => {
  try {
    const token = sessionStorage.getItem("token");
    // 🔍 Debug
    console.log("===== FORM DATA =====");
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    const response = await api.post(
      API_ENDPOINTS.Transactions.LoanEntry_Manage_URL,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          // ❌ DO NOT SET Content-Type
        },
      }
    );

    return response.data;

  } catch (error: any) {
    console.log("ERROR FULL => ", error?.response);
    console.log("ERROR DATA => ", error?.response?.data);
    throw error;
  }
};