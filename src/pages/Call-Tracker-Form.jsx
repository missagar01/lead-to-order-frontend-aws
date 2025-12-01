"use client"

import { useState, useEffect, useRef } from "react"

const CallTrackerForm = ({ onClose = () => window.history.back() }) => {
  const [leadSources, setLeadSources] = useState([])
  const [enquiryApproachOptions, setEnquiryApproachOptions] = useState([])
  const [receiverOptions, setReceiverOptions] = useState([])
  const [scNames, setScNames] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemNameOptions, setItemNameOptions] = useState([])
  const [companyOptions, setCompanyOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  // const [companyLocationMap, setCompanyLocationMap] = useState({}); // 👈 mapping ke liye
  const [manualCompany, setManualCompany] = useState(""); // manual input ke liye
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationDropdownRef = useRef(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [directCompanyDetails, setDirectCompanyDetails] = useState({});
  const companyDropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    scName: "",
    leadSource: "",
    companyName: "",
    phoneNumber: "",
    salesPersonName: "",
    location: "",
    emailAddress: "",
    enquiryReceiverName: "",
    enquiryDate: "",
    enquiryApproach: ""
  })

  const [items, setItems] = useState([{ id: "1", name: "", quantity: "" }])

  // Fetch dropdown data when component mounts
  useEffect(() => {
    fetchDropdownData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredCompanies = companyOptions.filter(company =>
    company.toLowerCase().includes(formData.companyName.toLowerCase())
  );

  const addNewLocationToSheet = async (locationName) => {
    try {
      // Prepare row data for DROPDOWN sheet - location goes in column 55 (index 54)
      const rowData = Array(55).fill(""); // Create empty array for 55 columns
      rowData[54] = locationName.trim(); // Set location in column 55 (index 54)

      const scriptUrl = "https://script.google.com/macros/s/AKfycbyLTNpTAVKaVuGH_-GrVNxDOgXqbWiBYzdf8PQWWwIFhLiIz_1lT3qEQkl7BS1osfToGQ/exec"

      const params = {
        sheetName: "DROPDOWN",
        action: "insert",
        rowData: JSON.stringify(rowData)
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

      if (!result.success) {
        throw new Error(result.error || "Failed to add location")
      }

      await fetchDropdownData(); // Refresh the dropdown options
      return true;
    } catch (error) {
      console.error("Error adding location:", error);
      alert(`Failed to add location: ${error.message}`);
      return false;
    }
  };

  const handleAddNewLocation = async () => {
    if (formData.location && formData.location.trim() !== "" &&
      !locationOptions.includes(formData.location.trim())) {
      setIsAddingLocation(true);
      const success = await addNewLocationToSheet(formData.location.trim());
      if (success) {
        // Refresh location options and keep the selected value
        await fetchDropdownData();
        setFormData(prev => ({ ...prev, location: formData.location.trim() }));
        alert(`Location "${formData.location.trim()}" added successfully!`);
      }
      setIsAddingLocation(false);
    }
  };

  // Function to fetch dropdown data from DROPDOWN sheet
const fetchDropdownData = async () => {
  try {
        const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5050";
    // const res = await fetch("http://localhost:5050/api/direct-enquiry-form-dropdown");
    const res = await fetch(`${baseURL}/direct-enquiry-form-dropdown`);
    const json = await res.json();

    if (!json.success) return;

    const data = json.data;

    setLeadSources(data.leadSources);
    setEnquiryApproachOptions(data.enquiryApproaches);
    setScNames(data.scNames);
    setReceiverOptions(data.receiverNames);
    setCompanyOptions(data.directCompanyNames);

    setItemNameOptions(data.itemNames);

    // ⭐ ADD THIS LINE HERE
    setDirectCompanyDetails(data.directCompanyDetails);
    setLocationOptions(data.locations);

  } catch (error) {
    console.error("Dropdown fetch error:", error);
  }
};






  // Function to handle adding a new item
  const addItem = () => {
    const newId = (items.length + 1).toString()
    setItems([...items, { id: newId, name: "", quantity: "" }])
  }

  // Function to handle removing an item
  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  // Function to update an item
  const updateItem = (id, field, value) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }


  const formatDateToDDMMYYYY = (dateValue) => {
    if (!dateValue) return ""

    try {
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
      }
      return dateValue
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateValue // Return the original value if formatting fails
    }
  }

  // Function to handle form submission
const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
     const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5050";
    const payload = {
      scName: formData.scName,
      leadSource: formData.leadSource,
      companyName: formData.companyName,
      phoneNumber: formData.phoneNumber,
      salesPersonName: formData.salesPersonName,
      location: formData.location,
      emailAddress: formData.emailAddress,
      enquiryReceiverName: formData.enquiryReceiverName,
      enquiryDate: formData.enquiryDate,
      enquiryApproach: formData.enquiryApproach,
      items
    };

    const res = await fetch(`${baseURL}/direct-enquiry-form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (json.success) {
      alert("Saved Successfully!");
      onClose();
    } else {
      alert("Error: " + json.error);
    }

  } catch (error) {
    alert("Submit failed: " + error.message);
  }

  setIsSubmitting(false);
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">New Call Tracker</h2>
            <button
              type="button"
              onClick={() => {
                try {
                  onClose();
                } catch (error) {
                  console.error("Error closing form:", error);
                  const modal = document.querySelector('.fixed.inset-0');
                  if (modal) {
                    modal.style.display = 'none';
                  }
                }
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="scName" className="block text-sm font-medium text-gray-700">
                SC Name
              </label>
              <select
                id="scName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.scName}
                onChange={(e) => setFormData({ ...formData, scName: e.target.value })}
                required
              >
                <option value="">Select SC Name</option>
                {scNames.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="leadSource" className="block text-sm font-medium text-gray-700">
                Lead Source
              </label>
              <select
                id="leadSource"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.leadSource}
                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                required
              >
                <option value="">Select source</option>
                {leadSources.map((source, index) => (
                  <option key={index} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 relative" ref={companyDropdownRef}>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>

              {/* Custom dropdown input */}
              <div className="relative">
                <input
                  id="companyName"
                  type="text"
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                  value={formData.companyName}
                 onChange={(e) => {
  const selectedCompany = e.target.value;

  const details = directCompanyDetails[selectedCompany] || {};

  setFormData({
    ...formData,
    companyName: selectedCompany,
    phoneNumber: details.phone || "",
    salesPersonName: details.contactPerson || "",
    location: details.billingAddress || "",
    // emailAddress: details.email || "",
  });

  setShowCompanyDropdown(true);
}}

                  onFocus={() => setShowCompanyDropdown(true)}
                  placeholder="Select or type company name"
                  required
                />

                {/* Dropdown toggle button */}
                <button
                  type="button"
                  onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Custom dropdown list */}
              {showCompanyDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredCompanies.map((company, index) => (
                    <div
                      key={index}
                    onClick={() => {
  const details = directCompanyDetails[company] || {};

  setFormData({
    ...formData,
    companyName: company,
    phoneNumber: details.phone || "",
    salesPersonName: details.contactPerson || "",
    location: details.billingAddress || "",
  });

  setShowCompanyDropdown(false);
}}

                      className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 touch-manipulation"
                    >
                      <span className="text-sm text-gray-700">{company}</span>
                    </div>
                  ))}

                  {/* Show message when no options match */}
                  {filteredCompanies.length === 0 && (
                    <div className="px-4 py-3 text-center text-gray-500 text-sm">
                      No companies found
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="salesPersonName" className="block text-sm font-medium text-gray-700">
                Contact Person
              </label>
              <input
                id="salesPersonName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.salesPersonName}
                onChange={(e) => setFormData({ ...formData, salesPersonName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2 relative" ref={locationDropdownRef}>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>

              {/* Custom dropdown input */}
              <div className="relative">
                <input
                  id="location"
                  type="text"
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    setShowLocationDropdown(true);
                  }}
                  onFocus={() => setShowLocationDropdown(true)}
                  placeholder="Select or type location"
                  required
                />

                {/* Dropdown toggle button */}
                <button
                  type="button"
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Custom dropdown list - shows all options */}
              {showLocationDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {/* Filtered options based on search */}
                  {locationOptions
                    .filter(loc =>
                      loc.toLowerCase().includes(formData.location.toLowerCase())
                    )
                    .map((loc, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setFormData({ ...formData, location: loc });
                          setShowLocationDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 touch-manipulation"
                        onTouchStart={(e) => e.currentTarget.classList.add('bg-gray-50')}
                        onTouchEnd={(e) => e.currentTarget.classList.remove('bg-gray-50')}
                      >
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm text-gray-700">{loc}</span>
                        </div>
                      </div>
                    ))
                  }

                  {/* Add new location option - shows when no exact match found */}
                  {formData.location && formData.location.trim() !== "" &&
                    !locationOptions.includes(formData.location.trim()) && (
                      <div
                        onClick={handleAddNewLocation}
                        className="px-4 py-3 hover:bg-blue-50 active:bg-blue-100 cursor-pointer text-blue-600 border-t border-gray-200 flex items-center touch-manipulation"
                        onTouchStart={(e) => e.currentTarget.classList.add('bg-blue-50')}
                        onTouchEnd={(e) => e.currentTarget.classList.remove('bg-blue-50')}
                      >
                        {isAddingLocation ? (
                          <div className="flex items-center justify-center w-full py-2">
                            <svg className="animate-spin mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm font-medium">Adding Location...</span>
                          </div>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">Add "{formData.location.trim()}"</p>
                              <p className="text-xs text-blue-500 mt-1">Create new location</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                  {/* Show message when no options match */}
                  {locationOptions.filter(loc =>
                    loc.toLowerCase().includes(formData.location.toLowerCase())
                  ).length === 0 && formData.location && (
                      <div className="px-4 py-3 text-center text-gray-500 text-sm">
                        No locations found
                      </div>
                    )}
                </div>
              )}
            </div>


            <div className="space-y-2">
              <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="emailAddress"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.emailAddress}
                onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="enquiryReceiverName" className="block text-sm font-medium text-gray-700">
                Enquiry Receiver Name
              </label>
              <select
                id="enquiryReceiverName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.enquiryReceiverName}
                onChange={(e) => setFormData({ ...formData, enquiryReceiverName: e.target.value })}
              >
                <option value="">Select receiver</option>
                {receiverOptions.map((receiver, index) => (
                  <option key={index} value={receiver}>
                    {receiver}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="enquiryDate" className="block text-sm font-medium text-gray-700">
                Enquiry Date
              </label>
              <input
                id="enquiryDate"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.enquiryDate}
                onChange={(e) => setFormData({ ...formData, enquiryDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="enquiryApproach" className="block text-sm font-medium text-gray-700">
                Enquiry Approach
              </label>
              <select
                id="enquiryApproach"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.enquiryApproach}
                onChange={(e) => setFormData({ ...formData, enquiryApproach: e.target.value })}
                required
              >
                <option value="">Select approach</option>
                {enquiryApproachOptions.map((approach, index) => (
                  <option key={index} value={approach}>
                    {approach}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items section */}
          <div className="space-y-4 border p-4 rounded-md">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Items</h4>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1 text-xs border border-purple-200 text-purple-600 hover:bg-purple-50 rounded-md"
              >
                + Add Item
              </button>
            </div>

            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5 space-y-2">
                  <label htmlFor={`itemName-${item.id}`} className="block text-sm font-medium text-gray-700">
                    Item Name
                  </label>
                  <input
                    id={`itemName-${item.id}`}
                    list={`itemNameList-${item.id}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                    required
                  />
                  <datalist id={`itemNameList-${item.id}`}>
                    {itemNameOptions.map((itemName, index) => (
                      <option key={index} value={itemName} />
                    ))}
                  </datalist>
                </div>

                <div className="md:col-span-5 space-y-2">
                  <label htmlFor={`quantity-${item.id}`} className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    id={`quantity-${item.id}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter quantity"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="p-2 text-slate-500 hover:text-slate-700 disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t flex justify-between">
          <button
            type="button"
            onClick={() => {
              try {
                onClose();
              } catch (error) {
                console.error("Error closing form:", error);
                const modal = document.querySelector('.fixed.inset-0');
                if (modal) {
                  modal.style.display = 'none';
                }
              }
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CallTrackerForm
