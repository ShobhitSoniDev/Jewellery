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

export interface LoanTransaction_ManagePayload {
  LoanTransactionId?: number;
  LoanId: number;
  TransactionTypeId: number;
  InterestRate?: number;
  TransactionDate: string;
  Amount: number;
  Description?: string;
  TypeId: number;
}

export const LoanTransaction_Manage = async (
  payload: LoanTransaction_ManagePayload
) => {
  try {
    const token = sessionStorage.getItem("token");
debugger
    const response = await api.post(
      API_ENDPOINTS.Transactions.LoanTransaction_Manage_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

export interface CustomerLedger_ManagePayload {
  TransId?: number;           // Required for Update (TypeId=2), Delete (TypeId=3), GetById (TypeId=4)
  CustomerCode?: string;        // Required for Insert / Update
  TransactionDate?: string;   // Required for Insert / Update (YYYY-MM-DD)
  TransactionType?: number;   // Required for Insert / Update (from TransactionTypeMaster)
  Amount?: number;            // Required for Insert / Update
  Description?: string;       // Optional (max 250 chars)
  TypeId: number;             // 1=Insert | 2=Update | 3=Delete | 4=GetById | 5=GetAll | 6=GetTransactionTypes
}

  export const CustomerLedger_Manage = async (
  payload: CustomerLedger_ManagePayload
) => {
  try {
    // ✅ Get token from sessionStorage
    const token = sessionStorage.getItem("token");

    // ✅ Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Transactions.CustomerLedger_Manage_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`, // pass token
        },
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


// =============================================
// ADD THIS TO YOUR: @/lib/services/MasterService.ts
// =============================================

export type MakingChargeType = 'FLAT' | 'PERCENT';

export interface PurchaseDetailItem {
  ProductId:        number;
  Quantity:         number;
  GrossWeight:      number;
  NetWeight:        number;
  MetalRate:        number;
  MakingCharge:     number;
  MakingChargeType: MakingChargeType;  // ✅ Strict type
  StoneCharge:      number;
  Amount:           number;
}

export interface PurchasePayload {
  TypeId: number;
  PurchaseId?: number | null;
  PurchaseNo?: string;
  PurchaseDate?: string;         // "YYYY-MM-DD"
  SupplierId?: number | null;
  TotalAmount?: number | null;
  PaidAmount?: number;
  Remarks?: string;
  IsActive?: boolean;
  CreatedBy?: string;
  DetailsJson?: string;          // JSON.stringify(PurchaseDetailItem[])
}

export const Purchase_Manage = async (payload: PurchasePayload) => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.post(
      API_ENDPOINTS.Transactions.Purchase_Manage_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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


export interface SalesDetailItem {
  ProductId:        number;
  Quantity:         number;
  GrossWeight:      number;
  NetWeight:        number;
  MetalRate:        number;
  MakingCharge:     number;
  MakingChargeType: MakingChargeType;  // ✅ Strict type
  StoneCharge:      number;
  Amount:           number;
  GSTRate:          number;
}

export interface SalesPayload {
  TypeId: number;
  PurchaseId?: number | null;
  PurchaseNo?: string;
  PurchaseDate?: string;         // "YYYY-MM-DD"
  SupplierId?: number | null;
  TotalAmount?: number | null;
  PaidAmount?: number;
  Remarks?: string;
  IsActive?: boolean;
  CreatedBy?: string;
  DetailsJson?: string;          // JSON.stringify(SalesDetailItem[])
}

export const Sales_Manage = async (payload: SalesPayload) => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.post(
      API_ENDPOINTS.Transactions.Sale_Manage_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
