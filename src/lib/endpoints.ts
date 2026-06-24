export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    SignUp_URL: "/auth/signup",
  },
  Master: {
    GetMenu_URL: "/master/GetMenu",
    MetalMaster_Manage_URL: "/master/MetalMaster_Manage",
    CategoryMaster_Manage_URL: "/master/CategoryMaster_Manage",
    ProductMaster_Manage_URL: "/master/ProductMaster_Manage",
    GetAllMetals_URL: "/master/GetAllMetals",
    GetAllCategories_URL: "/master/GetAllCategories",
    GetAllProducts_URL: "/master/GetAllProducts",
    CustomerMaster_Manage_URL: "/master/CustomerMaster_Manage",
    GetLoan_Masters_URL: "/master/GetLoan_Masters",
  },
  Transactions: {
    StockTransaction_Manage_URL: "/transactions/StockTransaction_Manage",
    LoanEntry_Manage_URL: "/transactions/LoanEntry_Save",
    LoanTransaction_Manage_URL: "/transactions/LoanTransactionsDetail_Manage",
    CustomerLedger_Manage_URL: "/transactions/CustomerLedger_Manage",
  },
  Reports: {
    GetLoanEntryReport_URL: "/reports/GetLoanEntry",
  GetDashboardData_URL: "/reports/Dashboard_GetData",
  LoanOutstandingCalculate_URL: "/reports/LoanOutstandingCalculate",
   CustomerLedgerReport_URL: "/reports/CustomerLedgerReport",
   CustomerBillGenerate_URL: "/reports/CustomerBillGenerate",
  }
  ,
  AI: {
    FAQMaster_URL: "/ai/FAQMaster_Manage",
  }
} as const;
