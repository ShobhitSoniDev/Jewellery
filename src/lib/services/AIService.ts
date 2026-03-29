import api from "../axios";
import { API_ENDPOINTS } from "../endpoints";

// FAQ Payload Example
// const faqPayload = {
//   id: 0,
//   question: "",
//   answer: "",
//   keywords: "",
//   searchText: "",
//   typeId: 0
// };
export interface faqPayload {
  id: number;
  question: string;
  answer: string;
  email: string;
  keywords: string;
  searchText: string;
  typeId: number;
}

export const FAQMaster_Manage = async (payload: faqPayload) => {
  try {
    debugger
    // Get token
    const token = sessionStorage.getItem("token");

    // API call
    const response = await api.post(
      API_ENDPOINTS.AI.FAQMaster_URL,
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