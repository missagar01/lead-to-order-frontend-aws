"use client"

const ConsignorDetails = ({
  quotationData,
  handleInputChange,
  referenceOptions,
  selectedReferences,
  setSelectedReferences,
  dropdownData,
}) => {
  
  // FIX: Create references object from backend data
  const createReferencesObject = () => {
    const references = {};
    if (dropdownData.sp_name && dropdownData.sp_name.length > 0) {
      dropdownData.sp_name.forEach((name, index) => {
        if (name && name !== "Select Reference") {
          references[name] = {
            mobile: dropdownData.reference_contact_no1 ? dropdownData.reference_contact_no1[index] : "",
            phone: dropdownData.reference_phone_no_2 ? dropdownData.reference_phone_no_2[index] : "",
            address: dropdownData.consignor_billing_address ? dropdownData.consignor_billing_address[index] : "",
            gstin: dropdownData.consignor_gstin ? dropdownData.consignor_gstin[index] : "",
            stateCode: dropdownData.sp_state_code ? dropdownData.sp_state_code[index] : "",
          };
        }
      });
    }
    return references;
  };

  const references = createReferencesObject();

  const handleReferenceSelect = (selectedRef) => {
    if (selectedRef && !selectedReferences.includes(selectedRef)) {
      const updated = [...selectedReferences, selectedRef];
      setSelectedReferences(updated);
      handleInputChange("consignorName", updated.join(", "));

      // Auto-fill reference details
      if (references[selectedRef]) {
        const refDetails = references[selectedRef];
        
        // Auto-fill mobile and phone
        const mobileNumbers = updated.map(ref => references[ref]?.mobile).filter(Boolean);
        const phoneNumbers = updated.map(ref => references[ref]?.phone).filter(Boolean);
        
        handleInputChange("consignorMobile", mobileNumbers.join(", "));
        handleInputChange("consignorPhone", phoneNumbers.join(", "));

        // Auto-fill address for the first reference
        if (updated.length === 1 && refDetails.address) {
          handleInputChange("consignorAddress", refDetails.address);
        }

        // Auto-fill GSTIN for the first reference
        if (updated.length === 1 && refDetails.gstin) {
          handleInputChange("consignorGSTIN", refDetails.gstin);
        }

        // Auto-fill state code for the first reference
        if (updated.length === 1 && refDetails.stateCode) {
          handleInputChange("consignorStateCode", refDetails.stateCode);
        }
      }
    }
  };

  const removeReference = (refToRemove) => {
    const updated = selectedReferences.filter((r) => r !== refToRemove);
    setSelectedReferences(updated);
    handleInputChange("consignorName", updated.join(", "));

    if (updated.length > 0) {
      const mobileNumbers = updated.map(r => references[r]?.mobile).filter(Boolean);
      const phoneNumbers = updated.map(r => references[r]?.phone).filter(Boolean);
      handleInputChange("consignorMobile", mobileNumbers.join(", "));
      handleInputChange("consignorPhone", phoneNumbers.join(", "));
    } else {
      handleInputChange("consignorMobile", "");
      handleInputChange("consignorPhone", "");
    }
  };

  return (
    <>
      <h3 className="text-lg font-medium mt-6 mb-4">Consignor Details</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Reference Name</label>

          <div className="flex flex-wrap gap-2 mb-2">
            {selectedReferences.map((ref) => (
              <div key={ref} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                {ref}
                <button
                  type="button"
                  onClick={() => removeReference(ref)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <select
            value=""
            onChange={(e) => handleReferenceSelect(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Reference</option>
            {referenceOptions
              .filter((option) => option !== "Select Reference" && !selectedReferences.includes(option))
              .map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
          </select>
          <p className="text-xs text-gray-500">
            Select references to auto-fill contact details
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Address</label>
          <textarea
            value={quotationData.consignorAddress || ""}
            onChange={(e) => handleInputChange("consignorAddress", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="Consignor address"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Mobile</label>
            <input
              type="text"
              value={quotationData.consignorMobile || ""}
              onChange={(e) => handleInputChange("consignorMobile", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Mobile numbers"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Phone</label>
            <input
              type="text"
              value={quotationData.consignorPhone || ""}
              onChange={(e) => handleInputChange("consignorPhone", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Phone numbers"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">GSTIN</label>
            <input
              type="text"
              value={quotationData.consignorGSTIN || ""}
              onChange={(e) => handleInputChange("consignorGSTIN", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="GSTIN number"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">State Code</label>
            <input
              type="text"
              value={quotationData.consignorStateCode || ""}
              onChange={(e) => handleInputChange("consignorStateCode", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="State code"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">MSME No.</label>
          <input
            type="text"
            value={quotationData.msmeNumber || ""}
            onChange={(e) => handleInputChange("msmeNumber", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="MSME registration number"
          />
        </div>
      </div>
    </>
  )
}

export default ConsignorDetails