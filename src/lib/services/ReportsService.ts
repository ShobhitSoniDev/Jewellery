import api from "../axios";
import { API_ENDPOINTS } from "../endpoints";
import Swal from "sweetalert2";

export interface LoanReportPayload {
  LoanId?: number | null;
  CustomerId?: number | null;
  LoanType?: string | null;
  LoanStatus?: string | null;
  MetalType?: string | null;
  FromDate?: string | null;
  ToDate?: string | null;
  AmountFrom?: number | null;
  AmountTo?: number | null;
  PageNo: number;
  PageSize: number;
}

export const LoanReport_Search = async (
  payload: LoanReportPayload
) => {
  try {
    const token = sessionStorage.getItem("token");
    const response = await api.post(
      API_ENDPOINTS.Reports.GetLoanEntryReport_URL,
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
export const Dashboard_GetData = async () => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.get(
      API_ENDPOINTS.Reports.GetDashboardData_URL,
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

export interface LoanOutstandingCalculatePayload {
  loanId: number;
  closerDate: string;
}

export const LoanOutstandingCalculate = async (
  payload: LoanOutstandingCalculatePayload
) => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.post(
      API_ENDPOINTS.Reports.LoanOutstandingCalculate_URL,
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

export interface CustomerLedgerReport_Payload {
  CustomerCode?:    string  | null;   // NULL = All customers
  FromDate?:        string  | null;   // YYYY-MM-DD
  ToDate?:          string  | null;   // YYYY-MM-DD
  TransactionType?: number  | null;   // NULL = All, 1 = DR, 2 = CR
  TypeId:           number;           // 1 = Detail Report, 2 = Summary Report
}

export const CustomerLedger_Report = async (payload: CustomerLedgerReport_Payload) => {
  try {
    // ✅ Get token from sessionStorage
    const token = sessionStorage.getItem("token");

    // ✅ Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Reports.CustomerLedgerReport_URL,
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
      icon:  "error",
      title: "Error",
      text:  message,
    });
  }
};
