import api from "../axios";
import { API_ENDPOINTS } from "../endpoints";



export interface AddMetalPayload {
  metalName: string;
  purity: number;
  typeId: number,
  metalId?: string;
}

export const MetalMaster_Manage = async (payload: AddMetalPayload) => {
    // ✅ Get token from sessionStorage
    const token = sessionStorage.getItem("token");
    // ✅ Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Master.MetalMaster_Manage_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}` // pass token
        }
      }
    );
    return response.data;
};


export const getMetalList = async (payload: AddMetalPayload) => {
    // ✅ Get token from sessionStorage
    const token = sessionStorage.getItem("token");
   
    // ✅ Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Master.MetalMaster_Manage_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}` // pass token
        }
      }
    );

    return response.data;
};

export interface AddCategoryPayload {
  metalId: number;
  categoryName: string;
  typeId: number,
  categoryId?: number;
}

export const CategoryMaster_Manage = async (payload: AddCategoryPayload) => {
  try {
    // ✅ Get token from sessionStorage
    const token = sessionStorage.getItem("token");
    // ✅ Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Master.CategoryMaster_Manage_URL,
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

// =============================================
// ADD THIS TO YOUR: @/lib/services/MasterService.ts
// =============================================

export interface ProductMasterPayload {
  TypeId: number;
  ProductId?: number | null;
  ProductCode?: string;
  ProductName?: string;
  CategoryId?: number | null;
  MetalId?: number | null;
  MakingCharge?: number | null;
  MakingChargeType?: string;   // "FLAT" | "PERCENT"
  IsActive?: boolean;
  AuditBy?: string;
}

export const ProductMaster_Manage = async (payload: ProductMasterPayload) => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.post(
      API_ENDPOINTS.Master.ProductMaster_Manage_URL, // Add this endpoint to your API_ENDPOINTS config
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


export const getMenu = async () => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.get(
      API_ENDPOINTS.Master.GetMenu_URL,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log("ERROR => ", error?.response?.data);
    throw error?.response?.data;
  }
};

export interface AddCustomerPayload {
  CustomerCode: string;
  customerName: string;
  mobileNo: string;
  email: string;
  address: string;
  city: string;
  pincode: number;
  typeId: number;
}


export const CustomerMaster_Manage = async (payload: AddCustomerPayload) => {
  try {
    // Get token
    const token = sessionStorage.getItem("token");

    // API call
    const response = await api.post(
      API_ENDPOINTS.Master.CustomerMaster_Manage_URL,
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

    throw error; // important for frontend catch
  }
};


export const GetLoan_Masters = async () => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.get(
      API_ENDPOINTS.Master.GetLoan_Masters_URL,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log("ERROR => ", error?.response?.data);
    throw error?.response?.data;
  }
};

// =========================
// Role Master
// =========================

export interface RoleMasterPayload {
  roleId: number;
  roleName: string;
  roleDescription: string;
  isActive: boolean;
  typeId: number;
  roleCode: string;
}

export const RoleMaster_Manage = async (
  payload: RoleMasterPayload
) => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.post(
      API_ENDPOINTS.Master.Role_Master_Manage_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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

// =========================
// Role Menu Mapping
// =========================

export interface RoleMenuMappingPayload {
  roleId: number;
  menuIds: string;
  typeId: number;
}

export const RoleMenuMapping_Manage = async (
  payload: RoleMenuMappingPayload
) => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.post(
      API_ENDPOINTS.Master.RoleMenuMapping_Manage_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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


// =========================
// Change Password
// =========================

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const ChangePassword_Manage = async (
  payload: ChangePasswordPayload
) => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.post(
      API_ENDPOINTS.Master.ChangePassword_Manage_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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


// =========================
// User Master
// =========================

export interface UserManagePayload {
  loginId: number;
  userName: string;
  password: string;
  roleId: number;
  email: string;
  mobileNo: string;
  isActive: boolean;
  typeId: number;
}

export const User_Manage = async (
  payload: UserManagePayload
) => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.post(
      API_ENDPOINTS.Master.User_Manage_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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

// =============================================
// ADD THIS TO YOUR: @/lib/services/MasterService.ts
// =============================================

export interface SupplierMasterPayload {
  SupplierId?: number | null;
  SupplierName?: string;
  Phone?: string;
  GSTIN?: string;
  Address?: string;
  IsActive?: boolean;
  TypeId: number;
}

export const SupplierMaster_Manage = async (payload: SupplierMasterPayload) => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.post(
      API_ENDPOINTS.Master.SupplierMaster_Manage_URL, // Add this endpoint to your API_ENDPOINTS config
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
