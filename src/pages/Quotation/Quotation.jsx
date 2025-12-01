"use client"

import { useState, useEffect } from "react"
import { DownloadIcon, SaveIcon, ShareIcon } from "../../components/Icons"
import image1 from "../../assests/WhatsApp Image 2025-05-14 at 4.11.43 PM.jpeg"
import imageform from "../../assests/WhatsApp Image 2025-05-14 at 4.11.54 PM.jpeg"
import QuotationHeader from "./quotation-header"
import QuotationForm from "./quotation-form"
import QuotationPreview from "./quotation-preview"
import { generatePDFFromData } from "./pdf-generator"
import { getNextQuotationNumber } from "./quotation-service" // SIMPLIFIED: Only import getNextQuotationNumber
import { useQuotationData } from "./use-quotation-data"
import { saveQuotationToBackend } from "./quotation-api";
import { uploadPDFToBackend, fetchQuotationDetails, fetchQuotationNumbers } from "./quotation-api"

function Quotation() {
  const [activeTab, setActiveTab] = useState("edit")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quotationLink, setQuotationLink] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")
  const [isRevising, setIsRevising] = useState(false)
  const [existingQuotations, setExistingQuotations] = useState([])
  const [selectedQuotation, setSelectedQuotation] = useState("")
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false)
  const [specialDiscount, setSpecialDiscount] = useState(0)
  const [selectedReferences, setSelectedReferences] = useState([])
  const [quotationOptions, setQuotationOptions] = useState(["Select Quotation"])
const [isLoadingQuotationDetails, setIsLoadingQuotationDetails] = useState(false)

  // NEW: Add hidden columns state
  const [hiddenColumns, setHiddenColumns] = useState({
    hideDisc: false,
    hideFlatDisc: false,
    hideTotalFlatDisc: false,
    hideSpecialDiscount: false,
  })

  // Check if we're in view mode
  const params = new URLSearchParams(window.location.search)
  const isViewMode = params.has("view")

  // Use the custom hook for quotation data
  const {
    quotationData,
    setQuotationData,
    handleInputChange,
    handleItemChange,
    handleFlatDiscountChange,
    handleSpecialDiscountChange,
    handleAddItem,
    handleNoteChange,
    addNote,
    removeNote,
    hiddenFields,
    toggleFieldVisibility,
    addSpecialOffer,
    removeSpecialOffer,
    handleSpecialOfferChange,
  } = useQuotationData(specialDiscount)

  const handleSpecialDiscountChangeWrapper = (value) => {
    const discount = Number(value) || 0
    setSpecialDiscount(discount)
    handleSpecialDiscountChange(discount)
  }

  // Fetch existing quotations from backend
  useEffect(() => {
    const fetchExistingQuotations = async () => {
      try {
        console.log("Fetching existing quotations from backend...")
        setIsLoadingQuotation(true)
        
        const quotationNumbers = await fetchQuotationNumbers()
        setExistingQuotations(quotationNumbers)
        
        console.log("Quotation numbers loaded:", quotationNumbers)
      } catch (error) {
        console.error("Error fetching quotation numbers:", error)
        setExistingQuotations([])
      } finally {
        setIsLoadingQuotation(false)
      }
    }

    if (isRevising) {
      fetchExistingQuotations()
    }
  }, [isRevising])

  // Updated handleQuotationSelect function
const handleQuotationSelect = async (quotationNo) => {
  if (!quotationNo) return;

  setIsLoadingQuotation(true);
  setSelectedQuotation(quotationNo);

  try {
    console.log("Loading quotation details for:", quotationNo);
    const result = await fetchQuotationDetails(quotationNo);
    console.log("RAW API RESPONSE:", result);
    
    // Check if result is undefined or null
    if (!result) {
      throw new Error("No data received from server");
    }

    const loadedData = result;
    console.log("Loaded quotation data:", loadedData);

    // Add null checks for all fields
    if (!loadedData) {
      throw new Error("Loaded data is undefined");
    }

    // Safe reference processing with null checks
    const references = loadedData.consignorName
      ? loadedData.consignorName
          .split(",")
          .map((r) => r.trim())
          .filter((r) => r)
      : [];
    setSelectedReferences(references);

    // Safe items processing
    let items = [];
    const specialDiscountFromItems = Number(loadedData.specialDiscount) || 0;

    if (loadedData.items && Array.isArray(loadedData.items) && loadedData.items.length > 0) {
      items = loadedData.items.map((item, index) => ({
        id: index + 1,
        code: item.code || "",
        name: item.name || "",
        description: item.description || "",
        gst: Number(item.gst) || 0,
        qty: Number(item.qty) || 0,
        units: item.units || "Nos",
        rate: Number(item.rate) || 0,
        discount: Number(item.discount) || 0,
        flatDiscount: Number(item.flatDiscount) || 0,
        amount: Number(item.amount) || 0
      }));
    }

    // Calculate financials with safe defaults
    const subtotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalFlatDiscount = Number(loadedData.totalFlatDiscount) || 0;
    const cgstRate = Number(loadedData.cgstRate) || 9;
    const sgstRate = Number(loadedData.sgstRate) || 9;
    const taxableAmount = Math.max(0, subtotal - totalFlatDiscount);
    const cgstAmount = Number((taxableAmount * (cgstRate / 100)).toFixed(2));
    const sgstAmount = Number((taxableAmount * (sgstRate / 100)).toFixed(2));
    const total = Number((taxableAmount + cgstAmount + sgstAmount - specialDiscountFromItems).toFixed(2));

    // Parse special offers
    let specialOffers = [""];
    if (loadedData.specialOffers) {
      if (typeof loadedData.specialOffers === "string") {
        specialOffers = loadedData.specialOffers.split("|").filter((offer) => offer.trim());
        if (specialOffers.length === 0) specialOffers = [""];
      } else if (Array.isArray(loadedData.specialOffers)) {
        specialOffers = loadedData.specialOffers;
      }
    }

    // Safe data setting with defaults for ALL fields
    const updatedQuotationData = {
      // Quotation basics
      quotationNo: loadedData.quotationNo || "",
      date: loadedData.date || new Date().toLocaleDateString('en-GB'),
      preparedBy: loadedData.preparedBy || "",
      
      // Consignor details
      consignorState: loadedData.consignorState || "",
      consignorName: loadedData.consignorName || "",
      consignorAddress: loadedData.consignorAddress || "",
      consignorMobile: loadedData.consignorMobile || "",
      consignorPhone: loadedData.consignorPhone || "",
      consignorGSTIN: loadedData.consignorGSTIN || "",
      consignorStateCode: loadedData.consignorStateCode || "",
      
      // Consignee details
      consigneeName: loadedData.consigneeName || "",
      consigneeAddress: loadedData.consigneeAddress || "",
      shipTo: loadedData.shipTo || "",
      consigneeState: loadedData.consigneeState || "",
      consigneeContactName: loadedData.consigneeContactName || "",
      consigneeContactNo: loadedData.consigneeContactNo || "",
      consigneeGSTIN: loadedData.consigneeGSTIN || "",
      consigneeStateCode: loadedData.consigneeStateCode || "",
      msmeNumber: loadedData.msmeNumber || "",
      
      // Terms
      validity: loadedData.validity || "",
      paymentTerms: loadedData.paymentTerms || "",
      delivery: loadedData.delivery || "",
      freight: loadedData.freight || "",
      insurance: loadedData.insurance || "",
      taxes: loadedData.taxes || "",
      
      // Bank details
      accountNo: loadedData.accountNo || "",
      bankName: loadedData.bankName || "",
      bankAddress: loadedData.bankAddress || "",
      ifscCode: loadedData.ifscCode || "",
      email: loadedData.email || "",
      website: loadedData.website || "",
      pan: loadedData.pan || "",
      
      // Items and financials
      items: items,
      subtotal: subtotal,
      totalFlatDiscount: totalFlatDiscount,
      cgstRate: cgstRate,
      sgstRate: sgstRate,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      total: total,
      
      // Special offers and notes
      specialOffers: specialOffers,
      notes: Array.isArray(loadedData.notes) ? loadedData.notes : loadedData.notes ? [loadedData.notes] : [""],
    };

    console.log("Final quotation data to set:", updatedQuotationData);
    setQuotationData(updatedQuotationData);
    setSpecialDiscount(specialDiscountFromItems);
    
  } catch (error) {
    console.error("Error fetching quotation data:", error);
    alert("Failed to load quotation data: " + error.message);
  } finally {
    setIsLoadingQuotation(false);
  }
};

  // SIMPLIFIED: Initialize quotation number - no company prefix needed
  useEffect(() => {
    const initializeQuotationNumber = async () => {
      try {
        const nextQuotationNumber = await getNextQuotationNumber()
        setQuotationData((prev) => ({
          ...prev,
          quotationNo: nextQuotationNumber,
        }))
      } catch (error) {
        console.error("Error initializing quotation number:", error)
      }
    }

    initializeQuotationNumber()
  }, [setQuotationData])


  

  // Load quotation data from URL if in view mode
  useEffect(() => {
    const viewId = params.get("view")

    if (viewId) {
      const savedQuotation = localStorage.getItem(viewId)

      if (savedQuotation) {
        try {
          const parsedData = JSON.parse(savedQuotation)
          setQuotationData(parsedData)
          setActiveTab("preview")
        } catch (error) {
          console.error("Error loading quotation data:", error)
        }
      }
    }
  }, [setQuotationData])

  const toggleRevising = () => {
    const newIsRevising = !isRevising
    setIsRevising(newIsRevising)

    if (newIsRevising) {
      setSelectedQuotation("")
    }
  }

  // const handleQuotationSelect = async (quotationNo) => {
  //   if (!quotationNo) return

  //   setIsLoadingQuotation(true)
  //   setSelectedQuotation(quotationNo)

  //   try {
  //     const scriptUrl =
  //       "https://script.google.com/macros/s/AKfycbyLTNpTAVKaVuGH_-GrVNxDOgXqbWiBYzdf8PQWWwIFhLiIz_1lT3qEQkl7BS1osfToGQ/exec"
  //     const response = await fetch(scriptUrl, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/x-www-form-urlencoded",
  //       },
  //       body: new URLSearchParams({
  //         sheetName: "Make Quotation",
  //         action: "getQuotationData",
  //         quotationNo: quotationNo,
  //       }),
  //     })

  //     const result = await response.json()
  //     console.log("Loaded quotation data:", result)

  //     if (result.success) {
  //       const loadedData = result.quotationData

  //       const references = loadedData.consignorName
  //         ? loadedData.consignorName
  //             .split(",")
  //             .map((r) => r.trim())
  //             .filter((r) => r)
  //         : []
  //       setSelectedReferences(references)

  //       let items = []
  //       const specialDiscountFromItems = loadedData.specialDiscount || 0

  //       if (loadedData.items && Array.isArray(loadedData.items) && loadedData.items.length > 0) {
  //         items = loadedData.items.map((item, index) => ({
  //           id: index + 1,
  //           ...item,
  //         }))
  //       }

  //       const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0)
  //       const totalFlatDiscount = Number(loadedData.totalFlatDiscount) || 0
  //       const cgstRate = Number(loadedData.cgstRate) || 9
  //       const sgstRate = Number(loadedData.sgstRate) || 9
  //       const taxableAmount = Math.max(0, subtotal - totalFlatDiscount)
  //       const cgstAmount = Number((taxableAmount * (cgstRate / 100)).toFixed(2))
  //       const sgstAmount = Number((taxableAmount * (sgstRate / 100)).toFixed(2))
  //       const total = Number((taxableAmount + cgstAmount + sgstAmount - specialDiscountFromItems).toFixed(2))

  //       // Parse special offers from loaded data
  //       let specialOffers = [""]
  //       if (loadedData.specialOffers) {
  //         if (typeof loadedData.specialOffers === "string") {
  //           // If it's a string, split by delimiter
  //           specialOffers = loadedData.specialOffers.split("|").filter((offer) => offer.trim())
  //           if (specialOffers.length === 0) specialOffers = [""]
  //         } else if (Array.isArray(loadedData.specialOffers)) {
  //           specialOffers = loadedData.specialOffers
  //         }
  //       }

  //       setQuotationData({
  //         ...loadedData,
  //         items,
  //         subtotal,
  //         totalFlatDiscount,
  //         cgstRate,
  //         sgstRate,
  //         cgstAmount,
  //         sgstAmount,
  //         total,
  //         accountNo: loadedData.accountNo || "",
  //         bankName: loadedData.bankName || "",
  //         bankAddress: loadedData.bankAddress || "",
  //         ifscCode: loadedData.ifscCode || "",
  //         email: loadedData.email || "",
  //         website: loadedData.website || "",
  //         pan: loadedData.pan || "",
  //         consignorState: loadedData.consignorState || "",
  //         consignorName: loadedData.consignorName || "",
  //         consignorAddress: loadedData.consignorAddress || "",
  //         consignorMobile: loadedData.consignorMobile || "",
  //         consignorPhone: loadedData.consignorPhone || "",
  //         consignorGSTIN: loadedData.consignorGSTIN || "",
  //         consignorStateCode: loadedData.consignorStateCode || "",
  //         consigneeName: loadedData.consigneeName || "",
  //         consigneeAddress: loadedData.consigneeAddress || "",
  //         shipTo: loadedData.shipTo || "",
  //         consigneeState: loadedData.consigneeState || "",
  //         consigneeContactName: loadedData.consigneeContactName || "",
  //         consigneeContactNo: loadedData.consigneeContactNo || "",
  //         consigneeGSTIN: loadedData.consigneeGSTIN || "",
  //         consigneeStateCode: loadedData.consigneeStateCode || "",
  //         msmeNumber: loadedData.msmeNumber || "",
  //         preparedBy: loadedData.preparedBy || "",
  //         specialOffers: specialOffers,
  //         notes: Array.isArray(loadedData.notes) ? loadedData.notes : loadedData.notes ? [loadedData.notes] : [""],
  //       })

  //       setSpecialDiscount(specialDiscountFromItems)
  //     }
  //   } catch (error) {
  //     console.error("Error fetching quotation data:", error)
  //     alert("Failed to load quotation data")
  //   } finally {
  //     setIsLoadingQuotation(false)
  //   }
  // }

const handleGeneratePDF = async () => {
  setIsGenerating(true);

  try {
    const base64Data = generatePDFFromData(
      quotationData,
      selectedReferences,
      specialDiscount,
      hiddenColumns
    );

    // Upload PDF to S3
    const uploaded = await uploadPDFToBackend(base64Data, quotationData.quotationNo);

    if (!uploaded.success) {
      alert("PDF upload failed");
      setIsGenerating(false);
      return;
    }

    setPdfUrl(uploaded.url);

    // Optional: auto-download from S3
    window.open(uploaded.url, "_blank");

    alert("PDF uploaded successfully!");
  } catch (error) {
    console.error("PDF gen error:", error);
    alert("Failed to generate PDF: " + error.message);
  }

  setIsGenerating(false);
};



const handleGenerateLink = async () => {
  setIsGenerating(true);

  try {
    // First generate the PDF
    const base64Data = generatePDFFromData(quotationData, selectedReferences, specialDiscount, hiddenColumns);

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });

    // Upload PDF to Google Drive (this creates a permanent copy)
    const scriptUrl = "https://script.google.com/macros/s/AKfycbyLTNpTAVKaVuGH_-GrVNxDOgXqbWiBYzdf8PQWWwIFhLiIz_1lT3qEQkl7BS1osfToGQ/exec";
    const pdfFileName = `Quotation_${quotationData.quotationNo}.pdf`;

    const pdfResponse = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        sheetName: "Send",
        action: "uploadPDF",
        pdfData: base64Data,
        fileName: pdfFileName,
      }),
    });

    const pdfResult = await pdfResponse.json();

    if (!pdfResult.success) {
      throw new Error("Failed to upload PDF");
    }

    const permanentPdfUrl = pdfResult.fileUrl;
    const permanentFileId = pdfResult.fileId; // NEW: Get the file ID

    // FIXED: Pass the permanent file ID instead of base64Data to avoid duplicate PDF creation
    const sendResponse = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        sheetName: "Send",
        action: "insertAndEmail",
        quotationNo: quotationData.quotationNo,
        consigneeContactName: quotationData.consigneeContactName,
        permanentFileId: permanentFileId, // FIXED: Pass file ID instead of pdfData
        fileName: pdfFileName,
        consigneeName: quotationData.consigneeName || quotationData.consigneeContactName,
      }),
    });

    const sendResult = await sendResponse.json();

    if (!sendResult.success) {
      throw new Error("Failed to save to Send sheet or send email: " + sendResult.error);
    }

    // Create local storage link (for your own reference)
    const quotationId = `quotation_${Date.now()}`;
    localStorage.setItem(quotationId, JSON.stringify(quotationData));
    const localLink = `${window.location.origin}${window.location.pathname}?view=${quotationId}`;

    // Set the permanent URL for your reference (not sent in email)
    setQuotationLink(localLink);
    setPdfUrl(permanentPdfUrl);
    setIsGenerating(false);
    
    if (sendResult.emailSent) {
      alert(
        `✅ Email sent successfully!\n\n` +
        `📧 Email sent to: ${sendResult.emailAddress}\n` +
        `📄 Temporary PDF URL sent (expires in 10 days)\n` +
        `⏰ PDF expires at: ${sendResult.pdfExpiresAt}\n\n` +
        `🔗 Your permanent reference link: ${localLink}\n` +
        `📎 Permanent PDF: ${permanentPdfUrl}`
      );
    } else {
      alert(
        `⚠️ Quotation link generated but email could not be sent.\n\n` +
        `Error: ${sendResult.emailError || "No email address provided"}\n\n` +
        `🔗 Your reference link: ${localLink}\n` +
        `📎 Permanent PDF: ${permanentPdfUrl}`
      );
    }
  } catch (error) {
    console.error("Error generating link:", error);
    alert("Failed to generate link: " + error.message);
    setIsGenerating(false);
  }
};

const convertToSQLDate = (dateString) => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split("/");
  return `${year}-${month}-${day}`;
};


const handleSaveQuotation = async () => {
  try {
    setIsSubmitting(true);

    // 1️⃣ Generate PDF from existing function
    const base64Data = generatePDFFromData(
      quotationData,
      selectedReferences,
      specialDiscount,
      hiddenColumns
    );

    // 2️⃣ Upload PDF to S3
    const uploaded = await uploadPDFToBackend(base64Data, quotationData.quotationNo);

    if (!uploaded.success) {
      alert("❌ PDF upload failed");
      setIsSubmitting(false);
      return;
    }

    // 3️⃣ Save S3 URL
    const s3PdfUrl = uploaded.url;
    setPdfUrl(s3PdfUrl);

    // 4️⃣ Calculate totals for backend
    const taxableAmount = Math.max(
      0,
      quotationData.subtotal - quotationData.totalFlatDiscount
    );
    const special = Number(specialDiscount) || 0;

    let grandTotal = 0;

    if (quotationData.isIGST) {
      const igstAmt = taxableAmount * (quotationData.igstRate / 100);
      grandTotal = taxableAmount + igstAmt - special;
    } else {
      const cgstAmt = taxableAmount * (quotationData.cgstRate / 100);
      const sgstAmt = taxableAmount * (quotationData.sgstRate / 100);
      grandTotal = taxableAmount + cgstAmt + sgstAmt - special;
    }

    const finalGrand = Number(grandTotal.toFixed(2));

    // 5️⃣ Prepare items JSON
    const formattedItems = quotationData.items.map((item) => ({
      code: item.code,
      name: item.name,
      description: item.description,
      gst: item.gst,
      qty: item.qty,
      units: item.units,
      rate: item.rate,
      discount: item.discount,
      flatDiscount: item.flatDiscount,
      amount: item.amount,
    }));

    // 6️⃣ Payload for backend save
    const payload = {
      quotationNo: quotationData.quotationNo,
      quotationDate: convertToSQLDate(quotationData.date),
      preparedBy: quotationData.preparedBy,

      consignerState: quotationData.consignorState,
      referenceName: quotationData.consignorName,
      consignerAddress: quotationData.consignorAddress,
      consignerMobile: quotationData.consignorMobile,
      consignerPhone: quotationData.consignorPhone,
      consignerGstin: quotationData.consignorGSTIN,
      consignerStateCode: quotationData.consignorStateCode,

      companyName: quotationData.consigneeName,
      consigneeAddress: quotationData.consigneeAddress,
      shipTo: quotationData.shipTo,
      consigneeState: quotationData.consigneeState,
      contactName: quotationData.consigneeContactName,
      contactNo: quotationData.consigneeContactNo,
      consigneeGstin: quotationData.consigneeGSTIN,
      consigneeStateCode: quotationData.consigneeStateCode,
      msmeNo: quotationData.msmeNumber,

      validity: quotationData.validity,
      paymentTerms: quotationData.paymentTerms,
      delivery: quotationData.delivery,
      freight: quotationData.freight,
      insurance: quotationData.insurance,
      taxes: quotationData.taxes,
      notes: quotationData.notes.join("|"),

      accountNo: quotationData.accountNo,
      bankName: quotationData.bankName,
      bankAddress: quotationData.bankAddress,
      ifscCode: quotationData.ifscCode,
      email: quotationData.email,
      website: quotationData.website,
      pan: quotationData.pan,

      items: formattedItems,
      pdfUrl: s3PdfUrl,   // 7️⃣ PDF URL stored in backend
      grandTotal: finalGrand,
    };

    // 8️⃣ Save to backend
    const result = await saveQuotationToBackend(payload);

    if (!result.success) {
      alert("❌ Error saving quotation to backend");
      return;
    }

    alert("✅ Quotation + PDF saved successfully!");

  } catch (error) {
    alert("❌ Error: " + error.message);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="container mx-auto py-6 px-4">
      <QuotationHeader image={image1} isRevising={isRevising} toggleRevising={toggleRevising} />

      <div className="bg-white rounded-lg shadow border">
        <div className="border-b">
          <div className="flex">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "edit"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-tl-lg"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("edit")}
              disabled={isViewMode}
            >
              Edit Quotation
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "preview" ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" : "text-gray-600"
              }`}
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="p-4">
          {activeTab === "edit" ? (
            <QuotationForm
            quotationData={quotationData}
            handleInputChange={handleInputChange}
            handleItemChange={handleItemChange}
            handleFlatDiscountChange={handleFlatDiscountChange}
            handleAddItem={handleAddItem}
            handleNoteChange={handleNoteChange}
            addNote={addNote}
            removeNote={removeNote}
            hiddenFields={hiddenFields}
            toggleFieldVisibility={toggleFieldVisibility}
            isRevising={isRevising}
            existingQuotations={existingQuotations}
            selectedQuotation={selectedQuotation}
            handleQuotationSelect={handleQuotationSelect}
            isLoadingQuotation={isLoadingQuotation}
            handleSpecialDiscountChange={handleSpecialDiscountChangeWrapper}
            specialDiscount={specialDiscount}
            setSpecialDiscount={setSpecialDiscount}
            selectedReferences={selectedReferences}
            setSelectedReferences={setSelectedReferences}
            imageform={imageform}
            addSpecialOffer={addSpecialOffer}
            removeSpecialOffer={removeSpecialOffer}
            handleSpecialOfferChange={handleSpecialOfferChange}
            setQuotationData={setQuotationData}
            hiddenColumns={hiddenColumns}
            setHiddenColumns={setHiddenColumns}
          />
          ) : (
            <QuotationPreview
              quotationData={quotationData}
              quotationLink={quotationLink}
              pdfUrl={pdfUrl}
              selectedReferences={selectedReferences}
              specialDiscount={specialDiscount}
              imageform={imageform}
              handleGenerateLink={handleGenerateLink}
              handleGeneratePDF={handleGeneratePDF}
              isGenerating={isGenerating}
              isSubmitting={isSubmitting}
              hiddenColumns={hiddenColumns}
            />
          )}
        </div>
      </div>

      {activeTab === "edit" && (
        <div className="flex justify-between mt-4">
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
            onClick={handleSaveQuotation}
            disabled={isSubmitting || isGenerating}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4 mr-2" />
                Save Quotation
              </>
            )}
          </button>
          <div className="space-x-2">
            {/* <button
              className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center inline-flex"
              onClick={handleGenerateLink}
              disabled={isGenerating || isSubmitting}
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Generate Link
            </button> */}
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center inline-flex"
              onClick={handleGeneratePDF}
              disabled={isGenerating || isSubmitting}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Quotation