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
debugger
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