import api from "../axios";
import { API_ENDPOINTS } from "../endpoints";



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
  debugger
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
   console.log("ERROR FULL => ", error.response);
   console.log("ERROR DATA => ", error.response?.data);
}
};