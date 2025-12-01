"use client"

import { useState, useContext, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AuthContext } from "../App"
import MakeQuotationForm from "../components/call-tracker/MakeQuotationFrom"
import QuotationValidationForm from "../components/call-tracker/QuotationValidationForm"
import OrderExpectedForm from "../components/call-tracker/OrderExpectedForm"
import OrderStatusForm from "../components/call-tracker/OrderStatusFrom"

function NewCallTracker() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const leadId = searchParams.get("leadId")
  const { showNotification } = useContext(AuthContext)
  const [customerFeedbackOptions, setCustomerFeedbackOptions] = useState([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStage, setCurrentStage] = useState("")
  const [formData, setFormData] = useState({
    enquiryNo: leadId || "",
    enquiryStatus: "",
    customerFeedback: "",
  })
  const [enquiryStatusOptions, setEnquiryStatusOptions] = useState([])
  const [isLoadingDropdown, setIsLoadingDropdown] = useState(false)

  // State for MakeQuotationForm data
  const [quotationData, setQuotationData] = useState({
    companyName: "",
    sendQuotationNo: "",
    quotationSharedBy: "",
    quotationNumber: "",
    valueWithoutTax: "",
    valueWithTax: "",
    remarks: "",
    quotationFile: null,
    quotationFileUrl: "", // New field to store the uploaded file URL
  })

  // State for QuotationValidationForm data
  const [validationData, setValidationData] = useState({
    validationQuotationNumber: "",
    validatorName: "",
    sendStatus: "",
    validationRemark: "",
    faqVideo: "no",
    productVideo: "no",
    offerVideo: "no",
    productCatalog: "no",
    productImage: "no",
  })

  // State for OrderExpectedForm data
  const [orderExpectedData, setOrderExpectedData] = useState({
    nextCallDate: "",
    nextCallTime: "",
    followupStatus: "",
  })

  // State for OrderStatusForm data
  const [orderStatusData, setOrderStatusData] = useState({
    orderStatusQuotationNumber: "",
    orderStatus: "",
    acceptanceVia: "",
    paymentMode: "",
    paymentTerms: "",
    transportMode: "",
    creditDays: "",
    creditLimit: "",
    conveyedForRegistration: "",
    orderVideo: "",
    acceptanceFile: null,
    orderRemark: "",
    apologyVideo: null,
    reasonStatus: "",
    reasonRemark: "",
    holdReason: "",
    holdingDate: "",
    holdRemark: "",
    destination: "",
    poNumber: "",
  })

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Add this function inside the NewCallTracker component
  const fetchLatestQuotationNumber = async (enquiryNo) => {
    try {
      const scriptUrl = "https://script.google.com/macros/s/AKfycbyLTNpTAVKaVuGH_-GrVNxDOgXqbWiBYzdf8PQWWwIFhLiIz_1lT3qEQkl7BS1osfToGQ/exec"
      const params = {
        action: "getQuotationNumber",
        enquiryNo: enquiryNo
      }

      const urlParams = new URLSearchParams()
      for (const key in params) {
        urlParams.append(key, params[key])
      }

      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: urlParams
      })

      const result = await response.json()
      if (result.success && result.quotationNumber) {
        return result.quotationNumber
      }
      return ""
    } catch (error) {
      console.error("Error fetching quotation number:", error)
      return ""
    }
  }

  // Fetch dropdown options from DROPDOWN sheet column G
// Fetch dropdown options from backend AWS Postgres
// Fetch dropdown options from backend AWS Postgres
useEffect(() => {
  const fetchDropdownOptions = async () => {
    try {
      setIsLoadingDropdown(true);

      // Fetch enquiry status
      // const statusRes = await fetch(
      //   "http://localhost:5050/api/enquiry-tracker-form-dropdowns/enquiry_status"
      // );
      const statusRes = await fetch(`${API_BASE_URL}/enquiry-tracker-form-dropdowns/enquiry_status`);
      const statusJson = await statusRes.json();

      // Fetch customer feedback
      // const feedbackRes = await fetch(
      //   "http://localhost:5050/api/enquiry-tracker-form-dropdowns/what_did_customer_say"
      // );
      const feedbackRes = await fetch(`${API_BASE_URL}/enquiry-tracker-form-dropdowns/what_did_customer_say`);
      const feedbackJson = await feedbackRes.json();

      if (statusJson.success) {
        setEnquiryStatusOptions(statusJson.values);
      }

      if (feedbackJson.success) {
        setCustomerFeedbackOptions(feedbackJson.values);
      }

    } catch (error) {
      console.error("❌ Dropdown fetch error:", error);
    } finally {
      setIsLoadingDropdown(false);
    }
  };

  fetchDropdownOptions();
}, []);



  // Update form data when leadId changes
  useEffect(() => {
    if (leadId) {
      setFormData(prevData => ({
        ...prevData,
        enquiryNo: leadId
      }))
    }
  }, [leadId])

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }))
  }

  // Handler for quotation form data updates
  const handleQuotationChange = (field, value) => {
    setQuotationData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handler for validation form data updates
  const handleValidationChange = (field, value) => {
    setValidationData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handler for order expected form data updates
  const handleOrderExpectedChange = (field, value) => {
    setOrderExpectedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handler for order status form data updates
  const handleOrderStatusChange = (field, value) => {
    setOrderStatusData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Function to format date as dd/mm/yyyy
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Function to upload image/video to Google Drive
  const uploadFileToDrive = async (file, fileType = "image") => {
    try {
      // Convert file to base64
      const reader = new FileReader()

      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Data = reader.result.split(',')[1] // Remove the data:image/...;base64, prefix

            const scriptUrl = "https://script.google.com/macros/s/AKfycbyLTNpTAVKaVuGH_-GrVNxDOgXqbWiBYzdf8PQWWwIFhLiIz_1lT3qEQkl7BS1osfToGQ/exec"

            const params = {
              action: fileType === "pdf" ? "uploadPDF" : "uploadImage",
              fileName: file.name,
              mimeType: file.type
            }

            // Add the appropriate data parameter based on file type
            if (fileType === "pdf") {
              params.pdfData = base64Data;
            } else {
              params.imageData = base64Data;
            }

            const urlParams = new URLSearchParams()
            for (const key in params) {
              urlParams.append(key, params[key])
            }

            const response = await fetch(scriptUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              body: urlParams
            })

            const result = await response.json()

            if (result.success) {
              resolve(result.fileUrl)
            } else {
              reject(new Error(result.error || "Failed to upload file"))
            }
          } catch (error) {
            reject(error)
          }
        }

        reader.onerror = () => {
          reject(new Error("Failed to read file"))
        }

        reader.readAsDataURL(file)
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    }
  }



const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    let acceptanceFileUrl = "";
    let apologyVideoUrl = "";
    let orderNumber = "";

    // Upload acceptance file if YES
    if (currentStage === "order-status" && orderStatusData.orderStatus === "yes") {
      if (orderStatusData.acceptanceFile) {
        showNotification("Uploading acceptance file...", "info");
        acceptanceFileUrl = await uploadFileToDrive(orderStatusData.acceptanceFile);
        showNotification("Acceptance file uploaded", "success");
      }
    }

    // Upload apology video if NO
    if (currentStage === "order-status" && orderStatusData.orderStatus === "no") {
      if (orderStatusData.apologyVideo) {
        showNotification("Uploading apology video...", "info");
        apologyVideoUrl = await uploadFileToDrive(orderStatusData.apologyVideo);
        showNotification("Apology video uploaded", "success");
      }
    }

    // Generate order number if YES
    if (currentStage === "order-status" && orderStatusData.orderStatus === "yes") {
      const latestOrderNumber = await getLatestOrderNumber();
      orderNumber = generateNextOrderNumber(latestOrderNumber);
    }

    // ⭐ BUILD PAYLOAD FOR POSTGRES BACKEND
    const payload = {
      enquiry_no: formData.enquiryNo,
      enquiry_status: formData.enquiryStatus,
      what_did_customer_say: formData.customerFeedback,
      current_stage: currentStage,

      // ORDER EXPECTED
      followup_status: orderExpectedData.followupStatus || null,
      next_call_date: orderExpectedData.nextCallDate || null,
      next_call_time: orderExpectedData.nextCallTime || null,

      // ORDER STATUS YES
      is_order_received_status: orderStatusData.orderStatus || null,
      acceptance_via: orderStatusData.acceptanceVia || null,
      payment_mode: orderStatusData.paymentMode || null,
      // payment_terms_in_days: orderStatusData.paymentTerms || null,
      payment_terms_in_days: orderStatusData.paymentTerms
  ? parseInt(orderStatusData.paymentTerms.replace(/\D/g, "")) 
  : null,
      transport_mode: orderStatusData.transportMode || null,
      po_number: orderStatusData.poNumber || null,
      acceptance_file_upload: acceptanceFileUrl || null,
      remark: orderStatusData.orderRemark || null,

      // ORDER STATUS NO
      if_no_relevant_reason_status: orderStatusData.reasonStatus || null,
      if_no_relevant_reason_remark: orderStatusData.reasonRemark || null,

      // ORDER HOLD
      customer_order_hold_reason_category: orderStatusData.holdReason || null,
      holding_date: orderStatusData.holdingDate || null,
      hold_remark: orderStatusData.holdRemark || null,

      // SALES DETAILS (Optional)
      sales_cordinator: null,
      calling_days: null,
      // order_no: orderNumber || null,
      party_name: null,
      sales_person_name: null
    };

    console.log("Payload sending to backend:", payload);

    // ⭐ SEND TO BACKEND AWS POSTGRES
    // const response = await fetch("http://localhost:5050/api/enquiry-tracker-form", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload)
    // });
    const response = await fetch(`${API_BASE_URL}/enquiry-tracker-form`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

    const result = await response.json();

    if (result.success) {
      showNotification("Enquiry tracker saved!", "success");
      navigate("/call-tracker");
    } else {
      showNotification("Backend error: " + result.error, "error");
    }

  } catch (error) {
    console.error("❌ Submit error:", error);
    showNotification("Error: " + error.message, "error");
  } finally {
    setIsSubmitting(false);
  }
};


  // Helper function to get the latest order number from the sheet
  const getLatestOrderNumber = async () => {
    try {
      const scriptUrl =
        "https://script.google.com/macros/s/AKfycbyLTNpTAVKaVuGH_-GrVNxDOgXqbWiBYzdf8PQWWwIFhLiIz_1lT3qEQkl7BS1osfToGQ/exec";
      const params = {
        action: "getLatestOrderNumber",
        sheetName: "Enquiry Tracker",
      };

      const urlParams = new URLSearchParams();
      for (const key in params) {
        urlParams.append(key, params[key]);
      }

      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlParams,
      });

      const result = await response.json();
      if (result.success) {
        return result.latestOrderNumber || "DO-00"; // Return default if none exists
      }
      return "DO-00"; // Fallback
    } catch (error) {
      console.error("Error fetching latest order number:", error);
      return "DO-00"; // Fallback
    }
  };

  // Helper function to generate the next order number
  const generateNextOrderNumber = (latestOrderNumber) => {
    // Extract the numeric part
    const match = latestOrderNumber.match(/DO-(\d+)/);
    let nextNumber = 1;

    if (match && match[1]) {
      nextNumber = parseInt(match[1], 10) + 1;
    }

    // Format with leading zeros
    const paddedNumber = String(nextNumber).padStart(2, "0");
    return `DO-${paddedNumber}`;
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Call Tracker</h2>
          <p className="text-sm text-slate-500">
            Track the progress of the enquiry
            {formData.enquiryNo && <span className="font-medium"> for Enquiry #{formData.enquiryNo}</span>}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="enquiryNo" className="block text-sm font-medium text-gray-700">
                Enquiry No.
              </label>
              <input
                id="enquiryNo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="En-01"
                value={formData.enquiryNo}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="enquiryStatus" className="block text-sm font-medium text-gray-700">
                Enquiry Status
              </label>
              <select
                id="enquiryStatus"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.enquiryStatus}
                onChange={handleInputChange}
                required
              >
                <option value="">Select status</option>
                {enquiryStatusOptions.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="customerFeedback" className="block text-sm font-medium text-gray-700">
                What Did Customer Say
              </label>
              <input
                list="customer-feedback-options"
                id="customerFeedback"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Select or type customer feedback"
                value={formData.customerFeedback}
                onChange={handleInputChange}
                required
              />
              <datalist id="customer-feedback-options">
                {customerFeedbackOptions.map((feedback, index) => (
                  <option key={index} value={feedback} />
                ))}
              </datalist>
            </div>


            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Current Stage</label>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {/* <input
                    type="radio"
                    id="make-quotation"
                    name="currentStage"
                    value="make-quotation"
                    checked={currentStage === "make-quotation"}
                    onChange={async (e) => {
                      setCurrentStage(e.target.value)
                    }}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  /> */}
                  {/* <label htmlFor="make-quotation" className="text-sm text-gray-700">
                    Make Quotation
                  </label> */}
                </div>
                {/* <div className="flex items-center space-x-2">
      <input
        type="radio"
        id="quotation-validation"
        name="currentStage"
        value="quotation-validation"
        checked={currentStage === "quotation-validation"}
        onChange={async (e) => {
          const stage = e.target.value
          setCurrentStage(stage)
          
          if (formData.enquiryNo) {
            // Fetch the latest quotation number for this enquiry
            const quotationNumber = await fetchLatestQuotationNumber(formData.enquiryNo)
            if (quotationNumber) {
              setValidationData(prev => ({
                ...prev,
                validationQuotationNumber: quotationNumber
              }))
            }
          }
        }}
        className="h-4 w-4 text-purple-600 focus:ring-purple-500"
      />
      <label htmlFor="quotation-validation" className="text-sm text-gray-700">
        Quotation Validation
      </label>
    </div> */}
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="order-expected"
                    name="currentStage"
                    value="order-expected"
                    checked={currentStage === "order-expected"}
                    onChange={async (e) => {
                      setCurrentStage(e.target.value)
                    }}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="order-expected" className="text-sm text-gray-700">
                    Order Expected
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="order-status"
                    name="currentStage"
                    value="order-status"
                    checked={currentStage === "order-status"}
                    onChange={async (e) => {
                      const stage = e.target.value
                      setCurrentStage(stage)

                      if (formData.enquiryNo) {
                        // Fetch the latest quotation number for this enquiry
                        const quotationNumber = await fetchLatestQuotationNumber(formData.enquiryNo)
                        if (quotationNumber) {
                          setOrderStatusData(prev => ({
                            ...prev,
                            orderStatusQuotationNumber: quotationNumber
                          }))
                        }
                      }
                    }}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="order-status" className="text-sm text-gray-700">
                    Order Status
                  </label>
                </div>
              </div>
            </div>

            {currentStage === "make-quotation" && (
              <MakeQuotationForm
                enquiryNo={formData.enquiryNo}
                formData={quotationData}
                onFieldChange={handleQuotationChange}
              />
            )}
            {currentStage === "quotation-validation" && (
              <QuotationValidationForm
                enquiryNo={formData.enquiryNo}
                formData={validationData}
                onFieldChange={handleValidationChange}
              />
            )}
            {currentStage === "order-expected" && (
              <OrderExpectedForm
                enquiryNo={formData.enquiryNo}
                formData={orderExpectedData}
                onFieldChange={handleOrderExpectedChange}
              />
            )}
            {currentStage === "order-status" && (
              <OrderStatusForm
                enquiryNo={formData.enquiryNo}
                formData={orderStatusData}
                onFieldChange={handleOrderStatusChange}
              />
            )}
          </div>
          <div className="p-6 border-t flex justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isSubmitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewCallTracker