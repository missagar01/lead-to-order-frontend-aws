import { useState, useEffect } from "react"

function OrderStatusForm({ formData, onFieldChange, enquiryNo }) {
  const [orderStatus, setOrderStatus] = useState(formData.orderStatus || "")
  const [acceptanceViaOptions, setAcceptanceViaOptions] = useState([])
  const [paymentModeOptions, setPaymentModeOptions] = useState([])
  const [reasonStatusOptions, setReasonStatusOptions] = useState([])
  const [holdReasonOptions, setHoldReasonOptions] = useState([])
  const [paymentTermsOptions, setPaymentTermsOptions] = useState([])
  const [conveyedOptions, setConveyedOptions] = useState([])
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false)
  const [orderVideoError, setOrderVideoError] = useState("")
  const [transportModeOptions, setTransportModeOptions] = useState([])
  const [quotationNumbers, setQuotationNumbers] = useState([])
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false)
  const [creditDaysOptions, setCreditDaysOptions] = useState([])
  const [creditLimitOptions, setCreditLimitOptions] = useState([])

  // Fetch dropdown options from DROPDOWN sheet
// Fetch dropdowns from backend instead of Google Sheet
useEffect(() => {
  const loadDropdowns = async () => {
    try {
      setIsLoadingDropdowns(true);

      const apiBase = "http://localhost:5050/api/enquiry-tracker-form-dropdowns";

      const columns = [
  "acceptance_via",
  "payment_mode",
  "not_received_reason_status",
  "hold_reason_category",
  "payment_terms_days",
  "transport_mode"
];


      const fetchColumn = async (col) => {
        try {
          const res = await fetch(`${apiBase}/${col}`);
          const json = await res.json();
          if (json.success) return json.values;
          return [];
        } catch (err) {
          console.error(`Failed fetching ${col}:`, err);
          return [];
        }
      };

      const [
        acceptanceVia,
        paymentMode,
        reasonStatus,
        holdReason,
        paymentTerms,
        transportMode
      ] = await Promise.all(columns.map(col => fetchColumn(col)));

      setAcceptanceViaOptions(acceptanceVia);
      setPaymentModeOptions(paymentMode);
      setReasonStatusOptions(reasonStatus);
      setHoldReasonOptions(holdReason);
      setPaymentTermsOptions(paymentTerms);
      setTransportModeOptions(transportMode);
    } catch (err) {
      console.error("Dropdown fetch error:", err);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  loadDropdowns();
}, []);


  // Fetch quotation numbers for the given enquiry number
  useEffect(() => {
    const fetchQuotationNumbers = async () => {
      if (!enquiryNo) return

      try {
        setIsLoadingQuotations(true)

        // First try fetching from FMS sheet (for pending enquiries)
        const fmsUrl = "https://docs.google.com/spreadsheets/d/1bLTwtlHUmADSOyXJBxQJ2sxEy-dII8v2aGCDYuqppx4/gviz/tq?tqx=out:json&sheet=FMS"
        const fmsResponse = await fetch(fmsUrl)
        const fmsText = await fmsResponse.text()

        // Extract the JSON part from the response
        const fmsJsonStart = fmsText.indexOf('{')
        const fmsJsonEnd = fmsText.lastIndexOf('}') + 1
        const fmsJsonData = fmsText.substring(fmsJsonStart, fmsJsonEnd)

        const fmsData = JSON.parse(fmsJsonData)

        const matchingQuotations = []

        // Check FMS sheet first (for pending enquiries)
        if (fmsData && fmsData.table && fmsData.table.rows) {
          fmsData.table.rows.forEach(row => {
            // Column B is index 1 (enquiry number) and column BI is index 60 (quotation number)
            if (row.c &&
              row.c[1] &&
              row.c[1].v &&
              row.c[1].v.toString() === enquiryNo.toString() &&
              row.c[35] &&
              row.c[35].v) {
              matchingQuotations.push(row.c[35].v)
            }
          })
        }

        // If no matches found in FMS, try ENQUIRY TO ORDER sheet (for direct enquiries)
        if (matchingQuotations.length === 0) {
          const enquiryUrl = "https://docs.google.com/spreadsheets/d/1bLTwtlHUmADSOyXJBxQJ2sxEy-dII8v2aGCDYuqppx4/gviz/tq?tqx=out:json&sheet=ENQUIRY TO ORDER"
          const enquiryResponse = await fetch(enquiryUrl)
          const enquiryText = await enquiryResponse.text()

          const enquiryJsonStart = enquiryText.indexOf('{')
          const enquiryJsonEnd = enquiryText.lastIndexOf('}') + 1
          const enquiryJsonData = enquiryText.substring(enquiryJsonStart, enquiryJsonEnd)

          const enquiryData = JSON.parse(enquiryJsonData)

          if (enquiryData && enquiryData.table && enquiryData.table.rows) {
            enquiryData.table.rows.forEach(row => {
              // Column B is index 1 (enquiry number) and column AT is index 45 (quotation number)
              if (row.c &&
                row.c[1] &&
                row.c[1].v &&
                row.c[1].v.toString() === enquiryNo.toString() &&
                row.c[45] &&
                row.c[45].v) {
                matchingQuotations.push(row.c[45].v)
              }
            })
          }
        }

        setQuotationNumbers(matchingQuotations)

        // If we found matches and the form field is empty, auto-fill with the first match
        if (matchingQuotations.length > 0 && !formData.orderStatusQuotationNumber) {
          onFieldChange('orderStatusQuotationNumber', matchingQuotations[0])
        }
      } catch (error) {
        console.error("Error fetching quotation numbers:", error)
      } finally {
        setIsLoadingQuotations(false)
      }
    }

    fetchQuotationNumbers()
  }, [enquiryNo, formData.orderStatusQuotationNumber, onFieldChange])

  const handleChange = (e) => {
    const { name, value } = e.target
    onFieldChange(name, value)
  }

  const handleFileChange = (e) => {
    const { name } = e.target
    const file = e.target.files[0]

    if (name === "orderVideo" && !file) {
      setOrderVideoError("Order Video is mandatory")
    } else {
      setOrderVideoError("")
    }

    if (file) {
      onFieldChange(name, file)
    }
  }

  const handleStatusChange = (status) => {
    setOrderStatus(status)
    onFieldChange('orderStatus', status)
  }

  return (
    <div className="space-y-6 border p-4 rounded-md">
      <h3 className="text-lg font-medium">Order Status</h3>
      <hr className="border-gray-200" />

      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* <div className="space-y-2">
          <label htmlFor="orderStatusQuotationNumber" className="block text-sm font-medium text-gray-700">
            Quotation Number2
          </label>
          {isLoadingQuotations ? (
            <div className="flex items-center space-x-2">
              <input
                id="orderStatusQuotationNumber"
                name="orderStatusQuotationNumber"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Loading quotation numbers..."
                value={formData.orderStatusQuotationNumber || ""}
                onChange={handleChange}
                disabled
                required
              />
              <div className="text-sm text-gray-500">Loading...</div>
            </div>
          ) : (
            <input
              id="orderStatusQuotationNumber"
              name="orderStatusQuotationNumber"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter quotation number"
              value={formData.orderStatusQuotationNumber || ""}
              onChange={handleChange}
              required
            />
          )}
          {enquiryNo && quotationNumbers.length > 0 && !isLoadingQuotations && (
            <div className="text-xs text-green-600 mt-1">
              {quotationNumbers.length === 1
                ? "Found matching quotation"
                : `Found ${quotationNumbers.length} matching quotations`}
            </div>
          )}
          {enquiryNo && quotationNumbers.length === 0 && !isLoadingQuotations && (
            <div className="text-xs text-orange-500 mt-1">No matching quotations found for enquiry #{enquiryNo}</div>
          )}
        </div>
      </div> */}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Is Order Received? Status</label>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="order-yes"
              name="orderStatus"
              value="yes"
              checked={orderStatus === "yes"}
              onChange={() => handleStatusChange("yes")}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="order-yes" className="text-sm text-gray-700">
              YES
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="order-no"
              name="orderStatus"
              value="no"
              checked={orderStatus === "no"}
              onChange={() => handleStatusChange("no")}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="order-no" className="text-sm text-gray-700">
              NO
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="order-hold"
              name="orderStatus"
              value="hold"
              checked={orderStatus === "hold"}
              onChange={() => handleStatusChange("hold")}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="order-hold" className="text-sm text-gray-700">
              HOLD
            </label>
          </div>
        </div>
      </div>

      {orderStatus === "yes" && (
        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Order Received Details</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="acceptanceVia" className="block text-sm font-medium text-gray-700">
                Acceptance Via
              </label>
              <select
                id="acceptanceVia"
                name="acceptanceVia"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.acceptanceVia || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select method</option>
                {acceptanceViaOptions.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700">
                Payment Mode
              </label>
              <select
                id="paymentMode"
                name="paymentMode"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.paymentMode || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select mode</option>
                {paymentModeOptions.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>

            {/* <div className="space-y-2">
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                Destination
              </label>
              <input
                id="destination"
                name="destination"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter destination"
                value={formData.destination || ""}
                onChange={handleChange}
              />
            </div> */}

            {/* <div className="space-y-2">
              <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700">
                PO Number
              </label>
              <input
                id="poNumber"
                name="poNumber"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter PO number"
                value={formData.poNumber || ""}
                onChange={handleChange}
              />
            </div> */}

            <div className="space-y-2">
              <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700">
                Payment Terms
              </label>
              <select
                id="paymentTerms"
                name="paymentTerms"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.paymentTerms || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select payment terms</option>
                {paymentTermsOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="transportMode" className="block text-sm font-medium text-gray-700">
                Transport Mode
              </label>
              <select
                id="transportMode"
                name="transportMode"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.transportMode || ""}
                onChange={handleChange}
              >
                <option value="">Select transport mode</option>
                {transportModeOptions.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>

            {/* <div className="space-y-2">
  <label htmlFor="creditDays" className="block text-sm font-medium text-gray-700">
    Credit Days
  </label>
  <select
    id="creditDays"
    name="creditDays"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    value={formData.creditDays || ""}
    onChange={handleChange}
  >
    <option value="">Select credit days</option>
    {creditDaysOptions.map((option, index) => (
      <option key={index} value={option}>{option}</option>
    ))}
  </select>
</div>

<div className="space-y-2">
  <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700">
    Credit Limit
  </label>
  <select
    id="creditLimit"
    name="creditLimit"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    value={formData.creditLimit || ""}
    onChange={handleChange}
  >
    <option value="">Select credit limit</option>
    {creditLimitOptions.map((option, index) => (
      <option key={index} value={option}>{option}</option>
    ))}
  </select>
</div> */}

            {/* <div className="space-y-2">
              <label htmlFor="conveyedForRegistration" className="block text-sm font-medium text-gray-700">
                CONVEYED FOR REGISTRATION FORM
              </label>
              <select
                id="conveyedForRegistration"
                name="conveyedForRegistration"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.conveyedForRegistration || ""}
                onChange={handleChange}
              >
                <option value="">Select option</option>
                {conveyedOptions.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div> */}
          </div>

          {/* <div className="space-y-2">
  <label htmlFor="orderVideo" className="block text-sm font-medium text-gray-700">
    Offer No.
  </label>
  <select
    id="orderVideo"
    name="orderVideo"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    onChange={handleChange}
  >
    <option value="">Select an option</option>
    <option value="yes">Yes</option>
    <option value="no">No</option>
  </select>
</div> */}

          {/* <div className="space-y-2">
            <label htmlFor="acceptanceFile" className="block text-sm font-medium text-gray-700">
              Acceptance File Upload
            </label>
            <input
              id="acceptanceFile"
              name="acceptanceFile"
              type="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={handleFileChange}
            />
          </div> */}

          <div className="space-y-2">
            <label htmlFor="orderRemark" className="block text-sm font-medium text-gray-700">
              REMARK
            </label>
            <textarea
              id="orderRemark"
              name="orderRemark"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter remarks"
              value={formData.orderRemark || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {orderStatus === "no" && (
        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Order Lost Details</h4>

          {/* <div className="space-y-2">
            <label htmlFor="apologyVideo" className="block text-sm font-medium text-gray-700">
              Order Lost Apology Video
            </label>
            <input
              id="apologyVideo"
              name="apologyVideo"
              type="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={handleFileChange}
            />
          </div> */}

          <div className="space-y-2">
            <label htmlFor="reasonStatus" className="block text-sm font-medium text-gray-700">
              If No then get relevant reason Status
            </label>
            <select
              id="reasonStatus"
              name="reasonStatus"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.reasonStatus || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select reason</option>
              {reasonStatusOptions.map((option, index) => (
                <option key={index} value={option.toLowerCase()}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="reasonRemark" className="block text-sm font-medium text-gray-700">
              If No then get relevant reason Remark
            </label>
            <textarea
              id="reasonRemark"
              name="reasonRemark"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter reason remarks"
              value={formData.reasonRemark || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {orderStatus === "hold" && (
        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Order Hold Details</h4>

          <div className="space-y-2">
            <label htmlFor="holdReason" className="block text-sm font-medium text-gray-700">
              CUSTOMER ORDER HOLD REASON CATEGORY
            </label>
            <select
              id="holdReason"
              name="holdReason"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.holdReason || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select reason</option>
              {holdReasonOptions.map((option, index) => (
                <option key={index} value={option.toLowerCase()}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="holdingDate" className="block text-sm font-medium text-gray-700">
              HOLDING DATE
            </label>
            <input
              id="holdingDate"
              name="holdingDate"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.holdingDate || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="holdRemark" className="block text-sm font-medium text-gray-700">
              HOLD REMARK
            </label>
            <textarea
              id="holdRemark"
              name="holdRemark"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter hold remarks"
              value={formData.holdRemark || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderStatusForm