import api from "../axios";
import { API_ENDPOINTS } from "../endpoints";

// =============================================
// Online Product Master
// =============================================

export interface OnlineProductPayload {
  TypeId: number;                 // 1 = Upsert, 2 = Get Detail + Images, 3 = List Grid
  ProductId?: number | null;
  ShortDescription?: string;
  LongDescription?: string;
  IsFeatured?: boolean;
  ShowOnWeb?: boolean;
}

export const OnlineProduct_Manage = async (payload: OnlineProductPayload) => {
  try {
    // ✅ Get token from sessionStorage
    const token = sessionStorage.getItem("token");

    // ✅ Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Customer.OnlineProduct_Manage_URL, // Add this endpoint to your API_ENDPOINTS config
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


// =============================================
// Product Images Master
// =============================================

export interface ProductImagesPayload {
  TypeId: number;                 // 1 = Add/Update, 2 = Delete, 3 = Set Primary, 4 = Get
  ProductId?: number | null;
  ImageId?: number | null;
  Image?: string;
  IsPrimary?: boolean;
  DisplayOrder?: number | null;
}

// Uses FormData (multipart) because TypeId = 1 (Add) can carry an actual
// image file to upload, same pattern as LoanEntry_Manage in TransactionsService.
export const ProductImages_Manage = async (payload: FormData) => {
  try {
    // ✅ Get token from sessionStorage
    const token = sessionStorage.getItem("token");

    // ✅ Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Customer.ProductImages_Manage_URL, // Add this endpoint to your API_ENDPOINTS config
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
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


// =============================================
// Product Master (dropdown list)
// =============================================

export const GetProduct_Master = async () => {
  try {
    // ✅ Get token from sessionStorage
    const token = sessionStorage.getItem("token");

    // ✅ Call API with Authorization header
    const response = await api.get(
      API_ENDPOINTS.Customer.GetProduct_Master_URL, // Add this endpoint to your API_ENDPOINTS config
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

export interface GetOnlineProductListPayload {
  CategoryId?: number | null;
  MetalId?: number | null;
  SearchText?: string | null;
  OnlyFeatured?: boolean;
  PageNumber?: number;
  PageSize?: number;
}

export const GetOnline_ProductList = async (
  payload: GetOnlineProductListPayload
) => {
  try {
    const token = sessionStorage.getItem("token");

    const requestPayload = {
      CategoryId: payload.CategoryId ?? null,
      MetalId: payload.MetalId ?? null,
      SearchText: payload.SearchText?.trim() || null,
      OnlyFeatured: payload.OnlyFeatured ?? false,
      PageNumber: payload.PageNumber ?? 1,
      PageSize: payload.PageSize ?? 20,
    };

    const response = await api.post(
      API_ENDPOINTS.Customer.GetOnline_ProductList_URL,
      requestPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
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

export interface GetOnline_ProductByProductIdPayload {
  ProductId: number;
}

export const GetOnline_ProductByProductId = async (
  payload: GetOnline_ProductByProductIdPayload
) => {
  try {
    // Get token from sessionStorage
    const token = sessionStorage.getItem("token");

    // Call GET API with Query String
    const response = await api.get(
      `${API_ENDPOINTS.Customer.GetOnline_ProductByProductId_URL}?ProductId=${payload.ProductId}`,
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

export interface CustomerCartPayload {
  TypeId: number;
  ProductId: number;
  Quantity: number;
}

export const Customer_Cart_Manage = async (
  payload: CustomerCartPayload
) => {
  try {
    // Get token from sessionStorage
    const token = sessionStorage.getItem("token");

    // Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Customer.Customer_Cart_Manage_URL,
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

export interface CustomerWishlistPayload {
  TypeId: number;
  ProductId: number;
}

export const Customer_Wishlist_Manage = async (
  payload: CustomerWishlistPayload
) => {
  try {
    // Get token from sessionStorage
    const token = sessionStorage.getItem("token");

    // Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Customer.Customer_Wishlist_Manage_URL,
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


export interface CustomerAddressPayload {
  TypeId: number;          // 1=Add, 2=Update, 3=Delete, 4=Bind All
  AddressId?: number;      // required for Update (2) / Delete (3)
  AddressLabel?: string;   // "HOME" | "OFFICE" | "OTHER"
  AddressLine?: string;
  City?: string;
  State?: string;
  Pincode?: string;
  IsDefault?: boolean;
}

export const Customer_Address_Manage = async (
  payload: CustomerAddressPayload
) => {
  try {
    // Get token from sessionStorage
    const token = sessionStorage.getItem("token");

    // Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Customer.Customer_Address_Manage_URL,
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