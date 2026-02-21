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
  debugger
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


export interface AddProductPayload {
  ProductId: number;
  ProductName: string;
  CategoryId: number,
  MetalId?: number;
  GrossWeight: number,
  NetWeight: number,
  WastageWeight: number,
  MakingCharge: number,
  RatePerGram: number,
  TotalQuantity: number,
  TypeId: number,
}

export const ProductMaster_Manage = async (payload: AddProductPayload) => {
  try {
  debugger
    // ✅ Get token from sessionStorage
    const token = sessionStorage.getItem("token");
    // ✅ Call API with Authorization header
    const response = await api.post(
      API_ENDPOINTS.Master.ProductMaster_Manage_URL,
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