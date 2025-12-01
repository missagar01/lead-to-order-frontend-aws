"use client"

const QuotationDetails = ({
  quotationData,
  handleInputChange,
  isRevising,
  existingQuotations,
  selectedQuotation,
  handleQuotationSelect,
  isLoadingQuotation,
  preparedByOptions,
  stateOptions,
  dropdownData,
}) => {
  const handleStateChange = (e) => {
    const selectedState = e.target.value
    handleInputChange("consignorState", selectedState)

    console.log("Selected state:", selectedState); // Debug log
    console.log("Available dropdown data:", dropdownData); // Debug log

    // FIX: Use the actual data structure from your backend
    if (selectedState && dropdownData) {
      // Look for state details in various backend fields
      
      // FIXED: Properly parse bank details from consignor_bank_details
      if (dropdownData.consignor_bank_details && dropdownData.consignor_bank_details.length > 0) {
        // Find bank details that match the selected state
        const matchingBankDetail = dropdownData.consignor_bank_details.find(detail => {
          if (!detail) return false;
          
          // Check if the bank detail contains the state name or any relevant identifier
          const detailLower = detail.toLowerCase();
          const stateLower = selectedState.toLowerCase();
          
          // Look for state name in bank details or check by index
          return detailLower.includes(stateLower) || 
                 detailLower.includes("account no.") || // Ensure it's a bank detail entry
                 detailLower.includes("bank name");
        });

        console.log("Matching bank detail:", matchingBankDetail);

        if (matchingBankDetail) {
          // Parse the bank details from the text block
          const bankDetailsText = matchingBankDetail;
          
          // Enhanced parsing to handle different formats
          const accountNoMatch = bankDetailsText.match(/Account No\.?:?\s*([^\n,]+)/i);
          const bankNameMatch = bankDetailsText.match(/Bank Name:?\s*([^\n,]+)/i);
          const bankAddressMatch = bankDetailsText.match(/Bank Address:?\s*([^\n,]+)/i);
          const ifscMatch = bankDetailsText.match(/IFSC CODE:?\s*([^\n,]+)/i);
          const emailMatch = bankDetailsText.match(/Email:?\s*([^\n,@]+@[^\n,]+)/i);
          const websiteMatch = bankDetailsText.match(/Website:?\s*([^\n,]+)/i);

          console.log("Parsed bank details:", {
            accountNo: accountNoMatch ? accountNoMatch[1].trim() : null,
            bankName: bankNameMatch ? bankNameMatch[1].trim() : null,
            bankAddress: bankAddressMatch ? bankAddressMatch[1].trim() : null,
            ifscCode: ifscMatch ? ifscMatch[1].trim() : null,
            email: emailMatch ? emailMatch[1].trim() : null,
            website: websiteMatch ? websiteMatch[1].trim() : null,
          });

          if (accountNoMatch) handleInputChange("accountNo", accountNoMatch[1].trim());
          if (bankNameMatch) handleInputChange("bankName", bankNameMatch[1].trim());
          if (bankAddressMatch) handleInputChange("bankAddress", bankAddressMatch[1].trim());
          if (ifscMatch) handleInputChange("ifscCode", ifscMatch[1].trim());
          if (emailMatch) handleInputChange("email", emailMatch[1].trim());
          if (websiteMatch) handleInputChange("website", websiteMatch[1].trim());
        }
      }

      // FIXED: Find state code by matching state name index
      if (dropdownData.sp_state_code && dropdownData.sp_state) {
        const stateIndex = dropdownData.sp_state.indexOf(selectedState);
        console.log("State index:", stateIndex);
        
        if (stateIndex !== -1 && dropdownData.sp_state_code[stateIndex]) {
          handleInputChange("consignorStateCode", dropdownData.sp_state_code[stateIndex]);
        }
      }

      // FIXED: Find GSTIN by matching state name index
      if (dropdownData.consignor_gstin && dropdownData.sp_state) {
        const stateIndex = dropdownData.sp_state.indexOf(selectedState);
        if (stateIndex !== -1 && dropdownData.consignor_gstin[stateIndex]) {
          handleInputChange("consignorGSTIN", dropdownData.consignor_gstin[stateIndex]);
        }
      }

      // FIXED: Find MSME number by matching state name index
      if (dropdownData.consignor_msme_no && dropdownData.sp_state) {
        const stateIndex = dropdownData.sp_state.indexOf(selectedState);
        if (stateIndex !== -1 && dropdownData.consignor_msme_no[stateIndex]) {
          handleInputChange("msmeNumber", dropdownData.consignor_msme_no[stateIndex]);
        }
      }

      // FIXED: Find PAN by matching state name index
      if (dropdownData.sp_pan && dropdownData.sp_state) {
        const stateIndex = dropdownData.sp_state.indexOf(selectedState);
        if (stateIndex !== -1 && dropdownData.sp_pan[stateIndex]) {
          handleInputChange("pan", dropdownData.sp_pan[stateIndex]);
        }
      }

      // FIXED: Find consignor address by matching state name index
      if (dropdownData.consignor_billing_address && dropdownData.sp_state) {
        const stateIndex = dropdownData.sp_state.indexOf(selectedState);
        if (stateIndex !== -1 && dropdownData.consignor_billing_address[stateIndex]) {
          handleInputChange("consignorAddress", dropdownData.consignor_billing_address[stateIndex]);
        }
      }

    } else {
      console.log("No state details found for:", selectedState);
      // Clear fields if no state details found
      handleInputChange("accountNo", "")
      handleInputChange("bankName", "")
      handleInputChange("bankAddress", "")
      handleInputChange("ifscCode", "")
      handleInputChange("email", "")
      handleInputChange("website", "")
      handleInputChange("pan", "")
      handleInputChange("consignorAddress", "")
      handleInputChange("consignorStateCode", "")
      handleInputChange("consignorGSTIN", "")
      handleInputChange("msmeNumber", "")
    }
  }

  return (
    <>
       <h3 className="text-lg font-medium mb-4">Quotation Details</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Quotation No.</label>
            {isRevising ? (
              <div className="flex items-center">
                <select
                  value={selectedQuotation}
                  onChange={(e) => handleQuotationSelect(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={isLoadingQuotation}
                >
                  <option value="">Select Quotation to Revise</option>
                  {existingQuotations && existingQuotations.length > 0 ? (
                    existingQuotations.map((quotation) => (
                      <option key={quotation} value={quotation}>
                        {quotation}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {isLoadingQuotation ? "Loading..." : "No quotations found"}
                    </option>
                  )}
                </select>
                {isLoadingQuotation && (
                  <div className="ml-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={quotationData.quotationNo}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              value={quotationData.date.split("/").reverse().join("-")}
              onChange={(e) => {
                const dateValue = e.target.value
                if (dateValue) {
                  const [year, month, day] = dateValue.split("-")
                  handleInputChange("date", `${day}/${month}/${year}`)
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Prepared By</label>
          <input
            type="text"
            list="preparedByList"
            value={quotationData.preparedBy}
            onChange={(e) => handleInputChange("preparedBy", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter or select the name of the person preparing this quotation"
            required
          />
          <datalist id="preparedByList">
            {preparedByOptions.map((name, idx) => (
              <option key={idx} value={name} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">State *</label>
          <select
            value={quotationData.consignorState || ""}
            onChange={handleStateChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Select State</option>
            {stateOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Select state to auto-fill consignor and bank details
          </p>
        </div>
      </div>
    </>
  )
}

export default QuotationDetails