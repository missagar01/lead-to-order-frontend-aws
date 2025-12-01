const API_BASE_URL1 = import.meta.env.VITE_API_URL;

export const saveQuotationToBackend = async (quotationData) => {
  try {
    const response = await fetch(`${API_BASE_URL1}/quotation-submit/quotation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quotationData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("❌ Backend Save Error:", error);
    throw error;
  }
};


export const fetchQuotationByNo = async (quotationNo) => {
  const res = await fetch(`${API_BASE_URL1}/quotation-submit/quotation/${quotationNo}`);
  return await res.json();
};


export const uploadPDFToBackend = async (base64Data, quotationNo) => {
  try {
    const formData = new FormData();

    // Convert base64 → Blob → File
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });

    const file = new File([blob], `Quotation_${quotationNo}.pdf`, {
      type: "application/pdf",
    });

    formData.append("pdf", file);

    const res = await fetch(`${API_BASE_URL1}/quotation-submit/upload-pdf`, {
      method: "POST",
      body: formData,
    });

    return await res.json();

  } catch (error) {
    console.error("Upload PDF error:", error);
    return { success: false };
  }
};


// const API_BASE_URL = "http://localhost:5050/api"; // Adjust to your backend UR
const API_BASE_URL = import.meta.env.VITE_API_URL;


export const fetchQuotationNumbers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/quotation-lead/quotation-numbers`);
    const result = await response.json();
    
    if (result.success) {
      return result.quotationNumbers;
    } else {
      throw new Error(result.message || "Failed to fetch quotation numbers");
    }
  } catch (error) {
    console.error("Error fetching quotation numbers:", error);
    throw error;
  }
};

export const fetchQuotationDetails = async (quotationNo) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quotation-lead/quotation-details/${quotationNo}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("API Response:", result); // Debug log
    
    if (result.success) {
      return result.data; // Make sure this matches your backend response
    } else {
      throw new Error(result.message || "Failed to fetch quotation details");
    }
  } catch (error) {
    console.error("Error fetching quotation details:", error);
    throw error;
  }
};