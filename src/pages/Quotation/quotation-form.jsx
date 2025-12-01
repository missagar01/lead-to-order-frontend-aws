"use client"

import { useState, useEffect } from "react"
import QuotationDetails from "./quotation-details"
import ConsignorDetails from "./consignor-details"
import ConsigneeDetails from "./consignee-details"
import ItemsTable from "./items-table"
import TermsAndConditions from "./terms and conditions"
import BankDetails from "./bank-details"
import NotesSection from "./notes-section"
import SpecialOfferSection from "./special-offer-section"
import { getNextQuotationNumber } from "./quotation-service" // SIMPLIFIED: Only import getNextQuotationNumber

const QuotationForm = ({
  quotationData,
  handleInputChange,
  handleItemChange,
  handleFlatDiscountChange,
  handleAddItem,
  handleNoteChange,
  addNote,
  removeNote,
  hiddenFields,
  toggleFieldVisibility,
  isRevising,
  existingQuotations,
  selectedQuotation,
  handleSpecialDiscountChange,
  handleQuotationSelect,
  isLoadingQuotation,
  specialDiscount,
  setSpecialDiscount,
  selectedReferences,
  setSelectedReferences,
  imageform,
  addSpecialOffer,
  removeSpecialOffer,
  handleSpecialOfferChange,
  setQuotationData,
  hiddenColumns,
  setHiddenColumns,
}) => {
  const [dropdownData, setDropdownData] = useState({})
  const [stateOptions, setStateOptions] = useState(["Select State"])
  const [companyOptions, setCompanyOptions] = useState(["Select Company"])
  const [referenceOptions, setReferenceOptions] = useState(["Select Reference"])
  const [preparedByOptions, setPreparedByOptions] = useState([""])
  const [productCodes, setProductCodes] = useState([])
  const [productNames, setProductNames] = useState([])
  const [productData, setProductData] = useState({})
  const [isItemsLoading, setIsItemsLoading] = useState(false);

  // NEW: Lead number states
  const [showLeadNoDropdown, setShowLeadNoDropdown] = useState(false)
  const [leadNoOptions, setLeadNoOptions] = useState(["Select Lead No."])
  const [leadNoData, setLeadNoData] = useState({})

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch dropdown data for states and corresponding details
// Update the useEffect that fetches dropdown data
useEffect(() => {
  const fetchBackendDropdowns = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/quotation-submit/dropdowns`);
      const json = await res.json();

      if (json.success) {
        console.log("Dropdown data received:", json.dropdowns); // Debug log
        
        // SET DROPDOWN LISTS - Use correct property names from your database
        setPreparedByOptions(json.dropdowns.prepared_by || []);
        setCompanyOptions(json.dropdowns.direct_company_name || []);
        
        // FIX: Use the correct state properties from your database
        const stateOptionsFromBackend = [
          ...(json.dropdowns.state || []),
          ...(json.dropdowns.sp_state || []),
          ...(json.dropdowns.consignee_state || []),
          ...(json.dropdowns.direct_state || [])
        ].filter(Boolean);
        
        setStateOptions([...new Set(stateOptionsFromBackend)]); // Remove duplicates
        
        setReferenceOptions(json.dropdowns.sp_name || []);

        // Create companies object for autofill
        const companies = {};
        if (json.dropdowns.direct_company_name && json.dropdowns.direct_company_name.length > 0) {
          json.dropdowns.direct_company_name.forEach((company, index) => {
            if (company && company !== "Select Company") {
              companies[company] = {
                address: (json.dropdowns.direct_billing_address && json.dropdowns.direct_billing_address[index]) || "",
                state: (json.dropdowns.direct_state && json.dropdowns.direct_state[index]) || "",
                contactName: (json.dropdowns.direct_client_name && json.dropdowns.direct_client_name[index]) || "",
                contactNo: (json.dropdowns.direct_client_contact_no && json.dropdowns.direct_client_contact_no[index]) || "",
                gstin: (json.dropdowns.consignee_gstin_uin && json.dropdowns.consignee_gstin_uin[index]) || "",
                stateCode: (json.dropdowns.consignee_state_code && json.dropdowns.consignee_state_code[index]) || "",
              };
            }
          });
        }

        // SAVE FULL OBJECT for autofill
        setDropdownData({
          ...json.dropdowns,
          companies: companies
        });
        
        console.log("Companies data for autofill:", companies); // Debug log
      }
    } catch (e) {
      console.error("Dropdown Load Error:", e);
    }
  };

  fetchBackendDropdowns();
}, []);


  // NEW: Fetch lead numbers from both sheets with filtering conditions
// NEW: Fetch lead numbers from backend instead of Google Sheets
useEffect(() => {
  const fetchLeadNumbers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/quotation-lead/lead-numbers`);
      const result = await response.json();
      
      if (result.success) {
        setLeadNoOptions(["Select Lead No.", ...result.leadNumbers]);
        setLeadNoData(result.leadData);
        console.log("Lead numbers loaded from backend:", result.leadNumbers);
      } else {
        console.error("Failed to fetch lead numbers:", result.message);
        setLeadNoOptions(["Select Lead No."]);
      }
    } catch (error) {
      console.error("Error fetching lead numbers from backend:", error);
      // Fallback to empty dropdown
      setLeadNoOptions(["Select Lead No."]);
    }
  };

  fetchLeadNumbers();
}, []);

  const handleSpecialDiscountChangeWrapper = (value) => {
    const discount = Number(value) || 0
    setSpecialDiscount(discount)
    handleSpecialDiscountChange(discount)
  }

useEffect(() => {
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      const json = await res.json();

      if (!json.success) return;

      const codes = ["Select Code"];
      const names = ["Select Product"];
      const dataMap = {};

      json.products.forEach((p) => {
        codes.push(p.item_code);
        names.push(p.item_name);

        // Map both ways for autofill
        dataMap[p.item_code] = {
          name: p.item_name,
          code: p.item_code,
          description: "",
          rate: 0,
        };
        dataMap[p.item_name] = {
          name: p.item_name,
          code: p.item_code,
          description: "",
          rate: 0,
        };
      });

      setProductCodes(codes);
      setProductNames(names);
      setProductData(dataMap);

      console.log("Product data loaded from Postgres:", dataMap);

    } catch (err) {
      console.error("Product fetch error:", err);
    }
  };

  fetchProducts();
}, []);


  // REMOVED: Function to handle quotation number updates - no longer needed
  // as we don't want to change quotation number when selecting company/lead

  // Helper function to safely convert value to string
  const safeToString = (value) => {
    if (value === null || value === undefined) return ""
    return String(value)
  }

  // NEW: Auto-fill items from lead data
const autoFillItemsFromLead = async (leadData, sheetType) => {
  try {
    const autoItems = [];
    
    // Parse item_qty JSON from database
    if (leadData.item_qty) {
      try {
        const itemData = JSON.parse(leadData.item_qty);
        if (Array.isArray(itemData)) {
          itemData.forEach((item) => {
            if (item.name && item.quantity !== undefined && item.quantity !== null) {
              const qty = isNaN(Number(item.quantity)) ? 1 : Number(item.quantity);
              autoItems.push({
                name: item.name,
                qty: qty,
              });
              console.log(`Added item from ${sheetType} lead: ${item.name}, qty: ${qty}`);
            }
          });
        }
      } catch (parseError) {
        console.error(`Error parsing item_qty from ${sheetType}:`, parseError);
      }
    }

    // Update items if found from lead data
    if (autoItems.length > 0) {
      console.log(`Creating ${autoItems.length} items from ${sheetType} lead data...`);
      
      const newItems = autoItems.map((item, index) => {
        // Auto-fill product code from productData with better matching
        let productInfo = null;
        let productCode = "";
        let productDescription = "";
        let productRate = 0;

        // Try exact match first
        if (productData[item.name]) {
          productInfo = productData[item.name];
        } else {
          // Try case-insensitive match
          const matchingKey = Object.keys(productData).find(key => 
            key.toLowerCase().trim() === item.name.toLowerCase().trim()
          );
          if (matchingKey) {
            productInfo = productData[matchingKey];
          }
        }

        if (productInfo) {
          productCode = productInfo.code || "";
          productDescription = productInfo.description || "";
          productRate = productInfo.rate || 0;
        }

        console.log(`Lead Item ${index + 1}: "${item.name}" -> code: "${productCode}", rate: ${productRate}`);
        
        // If no code found, try a partial match
        if (!productCode) {
          const partialMatch = Object.keys(productData).find(key => 
            key.toLowerCase().includes(item.name.toLowerCase().substring(0, 10)) ||
            item.name.toLowerCase().includes(key.toLowerCase().substring(0, 10))
          );
          if (partialMatch && productData[partialMatch]) {
            productCode = productData[partialMatch].code || "";
            productDescription = productData[partialMatch].description || "";
            productRate = productData[partialMatch].rate || 0;
            console.log(`Found partial match for "${item.name}": "${partialMatch}" -> code: "${productCode}"`);
          }
        }

        return {
          id: index + 1,
          code: productCode, // Auto-filled from productData
          name: item.name,
          description: productDescription, // Auto-filled from productData
          gst: 18,
          qty: item.qty,
          units: "Nos",
          rate: productRate, // Auto-filled from productData
          discount: 0,
          flatDiscount: 0,
          amount: item.qty * productRate, // Calculate initial amount
        };
      });

      handleInputChange("items", newItems);
      console.log("Items auto-filled from lead selection:", newItems);
    } else {
      console.log("No items found for this lead");
    }
    
  } catch (error) {
    console.error("Error auto-filling items from lead:", error);
  }
};

  // FIXED: Handle lead number selection and autofill - NO quotation number change
// FIXED: Handle lead number selection and autofill - NO quotation number change
// FIXED: Handle lead number selection using backend
// FIXED: Handle lead number selection using backend with correct field names
const handleLeadNoSelect = async (selectedLeadNo) => {
  if (!selectedLeadNo || selectedLeadNo === "Select Lead No.") {
    return;
  }

  setIsItemsLoading(true);

  try {
    // Fetch lead details from backend
    const response = await fetch(`${API_BASE_URL}/quotation-lead/lead-details/${selectedLeadNo}`);
    const result = await response.json();

    if (!result.success) {
      console.error("Failed to fetch lead details:", result.message);
      setIsItemsLoading(false);
      return;
    }

    const leadData = result.data;
    console.log("Selected lead data from backend:", leadData);

    // Fill consignee details based on sheet type with CORRECT FIELD NAMES
    if (result.sheet === "FMS") {
      handleInputChange("consigneeName", leadData.company_name || "");
      handleInputChange("consigneeAddress", leadData.address || "");
      handleInputChange("consigneeState", leadData.state || "");
      handleInputChange("consigneeContactName", leadData.salesperson_name || ""); // CORRECT FIELD
      handleInputChange("consigneeContactNo", leadData.phone_number || "");       // CORRECT FIELD
      handleInputChange("consigneeGSTIN", leadData.gstin || "");
      
      // Auto-fill items for FMS leads
      await autoFillItemsFromLead(leadData, "FMS");
      
    } else if (result.sheet === "ENQUIRY") {
      handleInputChange("consigneeName", leadData.company_name || "");
      handleInputChange("consigneeAddress", leadData.address || "");
      handleInputChange("consigneeState", leadData.state || "");
      handleInputChange("consigneeContactName", leadData.sales_person_name || ""); // CORRECT FIELD
      handleInputChange("consigneeContactNo", leadData.phone_number || "");        // CORRECT FIELD
      handleInputChange("consigneeGSTIN", leadData.gstin || "");
      
      // Auto-fill items for ENQUIRY leads
      await autoFillItemsFromLead(leadData, "ENQUIRY");
    }

    // IMPORTANT: Fill additional company details from dropdown data if available
    const companyName = leadData.company_name;
    if (companyName && dropdownData.companies && dropdownData.companies[companyName]) {
      const companyDetails = dropdownData.companies[companyName];
      
      // Fill additional company details if not already filled from lead data
      if (!leadData.address && companyDetails.address) {
        handleInputChange("consigneeAddress", companyDetails.address);
      }
      if (!leadData.state && companyDetails.state) {
        handleInputChange("consigneeState", companyDetails.state);
      }
      if (!leadData.salesperson_name && !leadData.sales_person_name && companyDetails.contactName) {
        handleInputChange("consigneeContactName", companyDetails.contactName);
      }
      if (!leadData.phone_number && companyDetails.contactNo) {
        handleInputChange("consigneeContactNo", companyDetails.contactNo);
      }
      if (!leadData.gstin && companyDetails.gstin) {
        handleInputChange("consigneeGSTIN", companyDetails.gstin);
      }
      if (companyDetails.stateCode) {
        handleInputChange("consigneeStateCode", companyDetails.stateCode);
      }
    }

  } catch (error) {
    console.error("Error fetching lead details:", error);
    alert("Failed to load lead details");
  } finally {
    setIsItemsLoading(false);
  }
};

  // FIXED: Function to auto-fill items based on company selection - NO quotation number change
  const handleAutoFillItems = async (companyName) => {
    if (!companyName || companyName === "Select Company") return

    try {
      console.log("Auto-filling items for company:", companyName)

      // First try FMS sheet
      const fmsUrl =
        "https://docs.google.com/spreadsheets/d/1bLTwtlHUmADSOyXJBxQJ2sxEy-dII8v2aGCDYuqppx4/gviz/tq?tqx=out:json&sheet=FMS"
      const fmsResponse = await fetch(fmsUrl)
      const fmsText = await fmsResponse.text()

      const fmsJsonStart = fmsText.indexOf("{")
      const fmsJsonEnd = fmsText.lastIndexOf("}") + 1
      const fmsJsonData = fmsText.substring(fmsJsonStart, fmsJsonEnd)
      const fmsData = JSON.parse(fmsJsonData)

      let itemsFound = false
      const autoItems = []

      // Check FMS sheet first
      if (fmsData && fmsData.table && fmsData.table.rows) {
        for (const row of fmsData.table.rows) {
          if (row.c && row.c[4]) {
            // Column E (index 4) - Project Name
            const rowCompanyName = safeToString(row.c[4].v)
            console.log("Checking company:", rowCompanyName)

            if (rowCompanyName && rowCompanyName.toLowerCase().trim() === companyName.toLowerCase().trim()) {
              // Check if BA (index 52) is not null and BI (index 60) is null
              const baValue = row.c[52] ? safeToString(row.c[52].v) : ""
              const biValue = row.c[60] ? safeToString(row.c[60].v) : ""

              console.log("BA Value:", baValue, "BI Value:", biValue)

              if (baValue !== "" && biValue === "") {
                console.log("Found matching company in FMS with conditions met")

                // FIRST: Extract items from regular columns (AN to AW)
                console.log("Extracting items from regular columns (AN to AW)")
                const itemColumns = [
                  { nameCol: 39, qtyCol: 40 }, // AN (Item Name1), AO (Quantity1)
                  { nameCol: 41, qtyCol: 42 }, // AP (Item Name2), AQ (Quantity2)
                  { nameCol: 43, qtyCol: 44 }, // AR (Item Name3), AS (Quantity3)
                  { nameCol: 45, qtyCol: 46 }, // AT (Item Name4), AU (Quantity4)
                  { nameCol: 47, qtyCol: 48 }, // AV (Item Name5), AW (Quantity5)
                ]

                for (const { nameCol, qtyCol } of itemColumns) {
                  const itemName = row.c[nameCol] ? safeToString(row.c[nameCol].v).trim() : ""
                  const itemQty = row.c[qtyCol] ? safeToString(row.c[qtyCol].v) : ""

                  console.log(`Column ${nameCol} (Item Name):`, itemName)
                  console.log(`Column ${qtyCol} (Quantity):`, itemQty)

                  if (itemName !== "" && itemQty !== "") {
                    // Fix: Preserve 0 quantities, only use fallback for invalid numbers
                    const qty = isNaN(Number(itemQty)) ? 1 : Number(itemQty)
                    autoItems.push({
                      name: itemName,
                      qty: qty,
                    })
                    console.log(`Added regular item: ${itemName}, qty: ${qty}`)
                  }
                }

                // SECOND: Also check for JSON data in CS column (index 96)
                console.log("Also checking for JSON data in CS column")
                const csValue = row.c[96] ? safeToString(row.c[96].v) : ""
                console.log("CS Value:", csValue)

                if (csValue !== "") {
                  try {
                    // Parse JSON data from CS column
                    const jsonData = JSON.parse(csValue)
                    console.log("Parsed JSON data:", jsonData)

                    if (Array.isArray(jsonData)) {
                      jsonData.forEach((item) => {
                        if (item.name && item.quantity !== undefined && item.quantity !== null) {
                          // Fix: Preserve 0 quantities, only use fallback for invalid numbers
                          const qty = isNaN(Number(item.quantity)) ? 1 : Number(item.quantity)
                          autoItems.push({
                            name: item.name,
                            qty: qty,
                          })
                          console.log(`Added JSON item: ${item.name}, qty: ${qty}`)
                        }
                      })
                    }
                  } catch (jsonError) {
                    console.error("Error parsing JSON from CS column:", jsonError)
                  }
                }

                itemsFound = true
                break
              }
            }
          }
        }
      }

      // If not found in FMS, try ENQUIRY TO ORDER sheet
      if (!itemsFound) {
        console.log("Not found in FMS, checking ENQUIRY TO ORDER sheet")

        const enquiryUrl =
          "https://docs.google.com/spreadsheets/d/1bLTwtlHUmADSOyXJBxQJ2sxEy-dII8v2aGCDYuqppx4/gviz/tq?tqx=out:json&sheet=ENQUIRY%20TO%20ORDER"
        const enquiryResponse = await fetch(enquiryUrl)
        const enquiryText = await enquiryResponse.text()

        const enquiryJsonStart = enquiryText.indexOf("{")
        const enquiryJsonEnd = enquiryText.lastIndexOf("}") + 1
        const enquiryJsonData = enquiryText.substring(enquiryJsonStart, enquiryJsonEnd)
        const enquiryData = JSON.parse(enquiryJsonData)

        if (enquiryData && enquiryData.table && enquiryData.table.rows) {
          for (const row of enquiryData.table.rows) {
            if (row.c && row.c[3]) {
              // Column D (index 3)
              const rowCompanyName = safeToString(row.c[3].v)
              if (rowCompanyName && rowCompanyName.toLowerCase().trim() === companyName.toLowerCase().trim()) {
                // Check if AL (index 37) is not null and AT (index 45) is null
                const alValue = row.c[37] ? safeToString(row.c[37].v) : ""
                const atValue = row.c[45] ? safeToString(row.c[45].v) : ""

                if (alValue !== "" && atValue === "") {
                  console.log("Found matching company in ENQUIRY TO ORDER with conditions met")

                  // Extract items from R to AK (columns 17-36)
                  const itemColumns = [
                    { nameCol: 17, qtyCol: 18 }, // R (Item Name1), S (Quantity1)
                    { nameCol: 19, qtyCol: 20 }, // T (Item Name2), U (Quantity2)
                    { nameCol: 21, qtyCol: 22 }, // V (Item Name3), W (Quantity3)
                    { nameCol: 23, qtyCol: 24 }, // X (Item Name4), Y (Quantity4)
                    { nameCol: 25, qtyCol: 26 }, // Z (Item Name5), AA (Quantity5)
                    { nameCol: 27, qtyCol: 28 }, // AB (Item Name6), AC (Quantity6)
                    { nameCol: 29, qtyCol: 30 }, // AD (Item Name7), AE (Quantity7)
                    { nameCol: 31, qtyCol: 32 }, // AF (Item Name8), AG (Quantity8)
                    { nameCol: 33, qtyCol: 34 }, // AH (Item Name9), AI (Quantity9)
                    { nameCol: 35, qtyCol: 36 }, // AJ (Item Name10), AK (Quantity10)
                  ]

                  for (const { nameCol, qtyCol } of itemColumns) {
                    const itemName = row.c[nameCol] ? safeToString(row.c[nameCol].v).trim() : ""
                    const itemQty = row.c[qtyCol] ? safeToString(row.c[qtyCol].v) : ""

                    if (itemName !== "" && itemQty !== "") {
                      // Fix: Preserve 0 quantities, only use fallback for invalid numbers
                      const qty = isNaN(Number(itemQty)) ? 1 : Number(itemQty)
                      autoItems.push({
                        name: itemName,
                        qty: qty,
                      })
                      console.log(`Added item: ${itemName}, qty: ${qty}`)
                    }
                  }

                  // ALSO: Check for JSON data in CB column (index 55) for ENQUIRY TO ORDER
                  console.log("Also checking for JSON data in CB column for ENQUIRY TO ORDER")
                  const cbValue = row.c[55] ? safeToString(row.c[55].v) : ""
                  console.log("CB Value:", cbValue)

                  if (cbValue !== "") {
                    try {
                      // Parse JSON data from CB column
                      const jsonData = JSON.parse(cbValue)
                      console.log("Parsed JSON data from CB:", jsonData)

                      if (Array.isArray(jsonData)) {
                        jsonData.forEach((item) => {
                          if (item.name && item.quantity !== undefined && item.quantity !== null) {
                            // Fix: Preserve 0 quantities, only use fallback for invalid numbers
                            const qty = isNaN(Number(item.quantity)) ? 1 : Number(item.quantity)
                            autoItems.push({
                              name: item.name,
                              qty: qty,
                            })
                            console.log(`Added JSON item from CB: ${item.name}, qty: ${qty}`)
                          }
                        })
                      }
                    } catch (jsonError) {
                      console.error("Error parsing JSON from CB column:", jsonError)
                    }
                  }

                  itemsFound = true
                  break
                }
              }
            }
          }
        }
      }

      // If items found, auto-fill the quotation table
      if (itemsFound && autoItems.length > 0) {
        console.log("Auto-filling combined items:", autoItems)
        console.log("Total items found:", autoItems.length)

        // Clear existing items and add new ones
        const newItems = autoItems.map((item, index) => {
          // Look up the product code from productData
          const productInfo = productData[item.name]
          const productCode = productInfo ? productInfo.code : ""

          return {
            id: index + 1,
            code: productCode, // Auto-fill the code from productData
            name: item.name,
            description: "",
            gst: 18,
            qty: item.qty,
            units: "Nos",
            rate: 0,
            discount: 0,
            flatDiscount: 0,
            amount: 0,
          }
        })

        // Update quotation data with new items
        handleInputChange("items", newItems)

        console.log("Items auto-filled successfully:", newItems)
      } else {
        console.log("No matching items found for auto-fill")
      }
    } catch (error) {
      console.error("Error auto-filling items:", error)
    } finally {
      setIsItemsLoading(false); // Stop loading regardless of success/failure
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <QuotationDetails
            quotationData={quotationData}
            handleInputChange={handleInputChange}
            isRevising={isRevising}
            existingQuotations={existingQuotations}
            selectedQuotation={selectedQuotation}
            handleQuotationSelect={handleQuotationSelect}
            isLoadingQuotation={isLoadingQuotation}
            preparedByOptions={preparedByOptions}
            stateOptions={stateOptions}
            dropdownData={dropdownData}
          />

          <ConsignorDetails
            quotationData={quotationData}
            handleInputChange={handleInputChange}
            referenceOptions={referenceOptions}
            selectedReferences={selectedReferences}
            setSelectedReferences={setSelectedReferences}
            dropdownData={dropdownData}
          />
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <ConsigneeDetails
            quotationData={quotationData}
            handleInputChange={handleInputChange}
            companyOptions={companyOptions}
            dropdownData={dropdownData}
            onAutoFillItems={handleAutoFillItems}
            showLeadNoDropdown={showLeadNoDropdown}
            setShowLeadNoDropdown={setShowLeadNoDropdown}
            leadNoOptions={leadNoOptions}
            handleLeadNoSelect={handleLeadNoSelect}
          />
        </div>
      </div>

      <ItemsTable
        quotationData={quotationData}
        handleItemChange={handleItemChange}
        handleAddItem={handleAddItem}
        handleSpecialDiscountChange={handleSpecialDiscountChangeWrapper}
        specialDiscount={specialDiscount}
        setSpecialDiscount={setSpecialDiscount}
        productCodes={productCodes}
        productNames={productNames}
        productData={productData}
        setQuotationData={setQuotationData}
        isLoading={isItemsLoading}
        hiddenColumns={hiddenColumns}
        setHiddenColumns={setHiddenColumns}
      />

      <TermsAndConditions
        quotationData={quotationData}
        handleInputChange={handleInputChange}
        hiddenFields={hiddenFields}
        toggleFieldVisibility={toggleFieldVisibility}
      />

      <NotesSection
        quotationData={quotationData}
        handleNoteChange={handleNoteChange}
        addNote={addNote}
        removeNote={removeNote}
      />

      <BankDetails quotationData={quotationData} handleInputChange={handleInputChange} imageform={imageform} />
    </div>
  )
}

export default QuotationForm