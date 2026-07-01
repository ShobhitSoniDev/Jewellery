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

export interface CCustomerBillGenerate_Payload {
  CustomerCode?:    string  | null;   // NULL = All customers
  description?:        string  | null;   
  language?:          number  | 3;  
}
  export const CustomerBillGenerate = async (payload: CCustomerBillGenerate_Payload) => {
  try {
    // ✅ Get token from sessionStorage
    const token = sessionStorage.getItem("token");

    // ✅ Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Reports.CustomerBillGenerate_URL,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
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



/* ================================================================
   PAYLOAD — matches Jewellery.GetPurchase_Report SP parameters
================================================================ */
export interface PurchaseReport_Payload {
  FromDate?:      string  | null;   // YYYY-MM-DD (inclusive)
  ToDate?:        string  | null;   // YYYY-MM-DD (inclusive)
  SupplierId?:    number  | null;   // NULL = All suppliers
  ProductId?:     number  | null;   // NULL = All products
  CategoryId?:    number  | null;   // NULL = All categories
  MetalId?:       number  | null;   // NULL = All metals (Product_Master.MetalId)
  MetalType?:     string  | null;   // 'GOLD' | 'SILVER' | NULL (all)
  PurchaseNo?:    string  | null;   // Partial match search
  PaymentStatus?: string  | null;   // 'PAID' | 'PARTIAL' | 'UNPAID' | NULL (all)
  IsActive?:      boolean | null;   // NULL = both active & inactive
}
 
/* ================================================================
   RESPONSE SHAPES — 5 result sets from SP
================================================================ */
 
/* Result Set 1 — Purchase detail rows (new jewellery items) */
export interface PurchaseReportDetail {
  PurchaseId:          number;
  PurchaseNo:          string;
  PurchaseDate:        string;
  SupplierId:          number;
  SupplierName:        string;
  SupplierPhone:       string | null;
  SupplierGSTIN:       string | null;
  PurchaseDetailId:    number;
  ProductId:           number;
  ProductCode:         string;
  ProductName:         string;
  CategoryName:        string;
  MetalName:           string;
  MetalType:           "GOLD" | "SILVER";
  Quantity:            number;
  GrossWeight:         number;
  NetWeight:           number;
  MetalRate:           number;
  MakingCharge:        number;
  MakingChargeType:    "FLAT" | "PERCENT";
  StoneCharge:         number;
  Amount:              number;
  PurchaseTotalAmount: number;
  PurchasePaidAmount:  number;
  PurchaseDueAmount:   number;
  PaymentStatus:       "PAID" | "PARTIAL" | "UNPAID";
  Remarks:             string | null;
  IsActive:            boolean;
}
 
/* Result Set 2 — Old Jewellery rows */
export interface PurchaseReportOldJewellery {
  OldJewelDetailId: number;
  PurchaseId:       number;
  PurchaseNo:       string;
  PurchaseDate:     string;
  SupplierId:       number;
  SupplierName:     string;
  ItemDescription:  string | null;
  GrossWeight:      number;
  MetalType:        "GOLD" | "SILVER";
  Touch:            number | null;
  DeductionWeight:  number | null;
  PureWeight:       number | null;
  MetalRate:        number;
  Amount:           number;
  IsActive:         boolean;
}
 
/* Result Set 3 — Overall Summary */
export interface PurchaseReportSummary {
  TotalPurchases:          number;
  TotalLineItems:          number;
  TotalQuantity:           number;
  TotalGrossWeight:        number;
  TotalNetWeight:          number;
  TotalDetailsAmount:      number;
  TotalOldJewelleryAmount: number;
  TotalAmount:             number;
  TotalPaidAmount:         number;
  TotalDueAmount:          number;
}
 
/* Result Set 4 — Supplier-wise Summary */
export interface PurchaseReportSupplierSummary {
  SupplierId:              number;
  SupplierName:            string;
  PurchaseCount:           number;
  TotalQuantity:           number;
  TotalNetWeight:          number;
  TotalDetailsAmount:      number;
  TotalOldJewelleryAmount: number;
  TotalAmount:             number;
}
 
/* Result Set 5 — MetalType-wise Summary */
export interface PurchaseReportMetalSummary {
  MetalType:   "GOLD" | "SILVER";
  TotalRows:   number;
  TotalWeight: number;
  TotalAmount: number;
}
 
/* Combined response shape (as mapped by your backend/API layer) */
export interface PurchaseReport_Response {
  details:         PurchaseReportDetail[];
  oldJewellery:    PurchaseReportOldJewellery[];
  summary:         PurchaseReportSummary[];         // single-row array
  supplierSummary: PurchaseReportSupplierSummary[];
  metalSummary:    PurchaseReportMetalSummary[];
}
 
/* ================================================================
   SERVICE FUNCTION
================================================================ */
export const GetPurchase_Report = async (
  payload: PurchaseReport_Payload
): Promise<{ data: PurchaseReport_Response } | undefined> => {
  try {
    const token = sessionStorage.getItem("token");
 
    const response = await api.post(
      API_ENDPOINTS.Reports.GetPurchaseReport_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
 
    return response.data;
  } catch (error) {
    console.error("GetPurchase_Report error:", error);
 
    const message =
      error instanceof Error ? error.message : "Something went wrong";
 
    Swal.fire({
      icon:  "error",
      title: "Error",
      text:  message,
    });
 
    return undefined;
  }
};


/* ================================================================
   PAYLOAD — matches Jewellery.GetSales_Report SP parameters
================================================================ */
export interface SalesReport_Payload {
  FromDate?:      string  | null;   // YYYY-MM-DD (inclusive)
  ToDate?:        string  | null;   // YYYY-MM-DD (inclusive)
  CustomerId?:    number  | null;   // NULL = All customers
  CustomerType?:  string  | null;   // 'FULKAR' | 'HOLESALE' | NULL (all)
  ProductId?:     number  | null;   // NULL = All products
  CategoryId?:    number  | null;   // NULL = All categories
  MetalId?:       number  | null;   // NULL = All metals (Product_Master.MetalId)
  MetalType?:     string  | null;   // 'GOLD' | 'SILVER' | NULL (all)
  BillNo?:        string  | null;   // Partial match search
  PaymentMode?:   string  | null;   // 'CASH'|'CARD'|'UPI'|'CHEQUE'|'MIXED'|NULL (all)
  PaymentStatus?: string  | null;   // 'PAID' | 'PARTIAL' | 'UNPAID' | NULL (all)
  IsActive?:      boolean | null;   // NULL = both active & inactive
}

/* ================================================================
   RESPONSE SHAPES — 5 result sets from SP
================================================================ */

/* Result Set 1 — Sale detail rows (new jewellery items) */
export interface SalesReportDetail {
  SaleId:           number;
  BillNo:           string;
  BillDate:         string;
  CustomerId:       number;
  CustomerName:     string;
  CustomerMobile:   string | null;
  CustomerAddress:  string | null;
  CustomerType:     "FULKAR" | "HOLESALE";
  SaleDetailId:     number;
  ProductId:        number;
  ProductCode:      string;
  ProductName:      string;
  CategoryName:     string;
  MetalName:        string;
  MetalType:        "GOLD" | "SILVER";
  Quantity:         number;
  GrossWeight:      number;
  NetWeight:        number;
  Touch:            number | null;
  PureWeight:       number | null;
  MetalRate:        number;
  MakingCharge:     number;
  MakingChargeType: "FLAT" | "PERCENT";
  StoneCharge:      number;
  GSTRate:          number;
  Amount:           number;
  SaleTotalAmount:  number;
  SaleGSTAmount:    number;
  SalePaidAmount:   number;
  SaleBalanceDue:   number;
  PaymentStatus:    "PAID" | "PARTIAL" | "UNPAID";
  PaymentMode:      "CASH" | "CARD" | "UPI" | "CHEQUE" | "MIXED";
  Remarks:          string | null;
  IsActive:         boolean;
}

/* Result Set 2 — Old Jewellery rows */
export interface SalesReportOldJewellery {
  OldJewelDetailId: number;
  SaleId:           number;
  BillNo:           string;
  BillDate:         string;
  CustomerId:       number;
  CustomerName:     string;
  CustomerMobile:   string | null;
  CustomerType:     "FULKAR" | "HOLESALE";
  ItemDescription:  string | null;
  GrossWeight:      number;
  MetalType:        "GOLD" | "SILVER";
  Touch:            number | null;
  DeductionWeight:  number | null;
  PureWeight:       number | null;
  MetalRate:        number;
  Amount:           number;
  IsActive:         boolean;
}

/* Result Set 3 — Overall Summary */
export interface SalesReportSummary {
  TotalBills:              number;
  TotalLineItems:          number;
  TotalQuantity:           number;
  TotalGrossWeight:        number;
  TotalNetWeight:          number;
  TotalGSTAmount:          number;
  TotalDetailsAmount:      number;
  TotalOldJewelleryAmount: number;
  TotalAmount:             number;
  TotalPaidAmount:         number;
  TotalBalanceDue:         number;
}

/* Result Set 4 — Customer-wise Summary */
export interface SalesReportCustomerSummary {
  CustomerId:              number;
  CustomerName:            string;
  CustomerMobile:          string | null;
  BillCount:               number;
  TotalQuantity:           number;
  TotalNetWeight:          number;
  TotalDetailsAmount:      number;
  TotalOldJewelleryAmount: number;
  TotalAmount:             number;
  TotalPaidAmount:         number;
  TotalBalanceDue:         number;
}

/* Result Set 5 — MetalType-wise Summary */
export interface SalesReportMetalSummary {
  MetalType:   "GOLD" | "SILVER";
  TotalRows:   number;
  TotalWeight: number;
  TotalAmount: number;
}

/* Combined response shape (as mapped by your backend/API layer) */
export interface SalesReport_Response {
  details:         SalesReportDetail[];
  oldJewellery:    SalesReportOldJewellery[];
  summary:         SalesReportSummary[];          // single-row array
  customerSummary: SalesReportCustomerSummary[];
  metalSummary:    SalesReportMetalSummary[];
}

/* ================================================================
   SERVICE FUNCTION
================================================================ */
export const GetSales_Report = async (
  payload: SalesReport_Payload
): Promise<{ data: SalesReport_Response } | undefined> => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.post(
      API_ENDPOINTS.Reports.GetSaleReport_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("GetSales_Report error:", error);

    const message =
      error instanceof Error ? error.message : "Something went wrong";

    Swal.fire({
      icon:  "error",
      title: "Error",
      text:  message,
    });

    return undefined;
  }
};



/* ================================================================
   PAYLOAD — matches Jewellery.GetStock_Report SP parameters
================================================================ */
export interface StockReport_Payload {
  AsOnDate?:    string  | null;   // YYYY-MM-DD (inclusive) | NULL = as of today
  ProductId?:   number  | null;   // NULL = All products
  CategoryId?:  number  | null;   // NULL = All categories
  MetalId?:     number  | null;   // NULL = All metals (Product_Master.MetalId)
  MetalType?:   string  | null;   // 'GOLD' | 'SILVER' | NULL (all)
  StockStatus?: string  | null;   // 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | NULL (all)
  LowStockQty?: number  | null;   // Threshold used when StockStatus = 'LOW_STOCK' (SP default: 5)
  IsActive?:    boolean | null;   // NULL = both active & inactive
}

/* ================================================================
   RESPONSE SHAPES — 5 result sets from SP
================================================================ */

/* Result Set 1 — Product-wise stock detail */
export interface StockReportDetail {
  ProductId:              number;
  ProductCode:            string;
  ProductName:            string;
  CategoryName:           string;
  MetalName:              string;
  MakingChargeType:       "FLAT" | "PERCENT";
  PurchasedQty:           number;
  PurchasedGrossWeight:   number;
  PurchasedNetWeight:     number;
  PurchasedAmount:        number;
  SoldQty:                number;
  SoldGrossWeight:        number;
  SoldNetWeight:          number;
  SoldAmount:             number;
  CurrentStockQty:        number;
  CurrentStockGrossWeight: number;
  CurrentStockNetWeight:  number;
  AvgPurchaseRatePerGram: number;
  CurrentStockValue:      number;
  StockStatus:            "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  IsActive:                boolean;
}

/* Result Set 2 — Category-wise Summary */
export interface StockReportCategorySummary {
  CategoryName:              string;
  TotalProducts:             number;
  TotalPurchasedQty:         number;
  TotalSoldQty:              number;
  TotalCurrentStockQty:      number;
  TotalCurrentStockNetWeight: number;
  TotalCurrentStockValue:    number;
}

/* Result Set 3 — MetalType-wise Summary */
export interface StockReportMetalSummary {
  MetalName:                    string;
  TotalProducts:                number;
  TotalPurchasedQty:            number;
  TotalSoldQty:                 number;
  TotalCurrentStockQty:         number;
  TotalCurrentStockGrossWeight: number;
  TotalCurrentStockNetWeight:   number;
  TotalCurrentStockValue:       number;
}

/* Result Set 4 — Overall Summary */
export interface StockReportSummary {
  AsOnDate:                   string;
  TotalProducts:              number;
  TotalInStockProducts:       number;
  TotalLowStockProducts:      number;
  TotalOutOfStockProducts:    number;
  TotalPurchasedQty:          number;
  TotalSoldQty:               number;
  TotalCurrentStockQty:       number;
  TotalCurrentStockGrossWeight: number;
  TotalCurrentStockNetWeight: number;
  TotalCurrentStockValue:     number;
}

/* Result Set 5 — Low Stock / Out of Stock Alert List */
export interface StockReportAlert {
  ProductId:             number;
  ProductCode:           string;
  ProductName:           string;
  CategoryName:          string;
  MetalName:             string;
  CurrentStockQty:       number;
  CurrentStockNetWeight: number;
  StockStatus:           "LOW_STOCK" | "OUT_OF_STOCK";
}

/* Combined response shape (as mapped by your backend/API layer) */
export interface StockReport_Response {
  details:         StockReportDetail[];
  categorySummary: StockReportCategorySummary[];
  metalSummary:    StockReportMetalSummary[];
  summary:         StockReportSummary[];   // single-row array
  lowStockAlerts:  StockReportAlert[];
}

/* ================================================================
   SERVICE FUNCTION
================================================================ */
export const GetStock_Report = async (
  payload: StockReport_Payload
): Promise<{ data: StockReport_Response } | undefined> => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.post(
      API_ENDPOINTS.Reports.GetStock_Report_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("GetStock_Report error:", error);

    const message =
      error instanceof Error ? error.message : "Something went wrong";

    Swal.fire({
      icon:  "error",
      title: "Error",
      text:  message,
    });

    return undefined;
  }
};