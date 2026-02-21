export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    SignUp_URL: "/auth/signup",
  },
  Master: {
    MetalMaster_Manage_URL: "/master/MetalMaster_Manage",
    CategoryMaster_Manage_URL: "/master/CategoryMaster_Manage",
    ProductMaster_Manage_URL: "/master/ProductMaster_Manage",
    GetAllMetals_URL: "/master/GetAllMetals",
    GetAllCategories_URL: "/master/GetAllCategories",
    GetAllProducts_URL: "/master/GetAllProducts",
  },
  Transactions: {
    StockTransaction_Manage_URL: "/transactions/StockTransaction_Manage",
  }
} as const;