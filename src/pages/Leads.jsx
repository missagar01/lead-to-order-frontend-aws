"use client"

import { useState, useEffect, useContext } from "react"
import { AuthContext } from "../App"

function Leads() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    receiverName: "",
    scName: "",
    source: "",
    companyName: "",
    phoneNumber: "",
    salespersonName: "",
    location: "",
    email: "",
    state: "",
    address: "",
    nob: "",
    notes: ""
  })
  const [receiverNames, setReceiverNames] = useState([])
  const [scNames, setScNames] = useState([])
  const [leadSources, setLeadSources] = useState([])
  const [companyOptions, setCompanyOptions] = useState([])
  const [companyDetailsMap, setCompanyDetailsMap] = useState({})
  const [nobOptions, setNobOptions] = useState([])
  const [stateOptions, setStateOptions] = useState([])
  const { showNotification } = useContext(AuthContext)
  
  // Script URL
  const scriptUrl = "https://script.google.com/macros/s/AKfycbyLTNpTAVKaVuGH_-GrVNxDOgXqbWiBYzdf8PQWWwIFhLiIz_1lT3qEQkl7BS1osfToGQ/exec"

  // Function to format date as dd/mm/yyyy
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const API_BASE_URL = import.meta.env.VITE_API_URL;

const fetchLeadDropdowns = async () => {
  try {
    // const res = await fetch("http://localhost:5050/api/lead-dropdown");
    const res = await fetch(`${API_BASE_URL}/lead-dropdown`);
    const result = await res.json();

    if (result.success) {
      const d = result.data || {};

      setReceiverNames(d.receiverNames || []);
      setScNames(d.scNames || []);
      setLeadSources(d.leadSources || []);
      setStateOptions(d.states || []);
      setNobOptions(d.nob || []);

      // SAFE VERSION (NO CRASH)
      const companyList = d.companyList || {};

      setCompanyOptions(Object.keys(companyList));
      setCompanyDetailsMap(companyList);
    }
  } catch (error) {
    console.error("Error fetching dropdowns:", error);
  }
};



  // Fetch dropdown data when component mounts
useEffect(() => {
  fetchLeadDropdowns();
}, []);


  // Function to fetch dropdown data from DROPDOWNSHEET
  const fetchDropdownData = async () => {
    try {
      const publicUrl = "https://docs.google.com/spreadsheets/d/1bLTwtlHUmADSOyXJBxQJ2sxEy-dII8v2aGCDYuqppx4/gviz/tq?tqx=out:json&sheet=DROPDOWN"
      
      const response = await fetch(publicUrl)
      const text = await response.text()
      
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}') + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      
      const data = JSON.parse(jsonData)
      
      if (data && data.table && data.table.rows) {
        const receivers = []
        const scNamesData = []
        const sources = []
        const states = []
        const nobs = []
        
        data.table.rows.slice(0).forEach(row => {
          // Column A (SC Names)
          if (row.c && row.c[36] && row.c[36].v) {
            scNamesData.push(row.c[36].v.toString())
          }
          
          // Column B (receivers) - moved from column A
          if (row.c && row.c[0] && row.c[0].v) {
            receivers.push(row.c[0].v.toString())
          }
          
          // Column C (sources) - moved from column B
          if (row.c && row.c[1] && row.c[1].v) {
            sources.push(row.c[1].v.toString())
          }
          
          // Column D (states) - moved from column C
          if (row.c && row.c[2] && row.c[2].v) {
            states.push(row.c[2].v.toString())
          }
          
          // Column AL (nature of business) - index 37
          if (row.c && row.c[37] && row.c[37].v) {
            nobs.push(row.c[37].v.toString())
          }
        })
        
        setScNames(scNamesData)
        setReceiverNames(receivers)
        setLeadSources(sources)
        setStateOptions(states)
        setNobOptions(nobs)
      }
    } catch (error) {
      console.error("Error fetching dropdown values:", error)
      // Fallback to default values
      setScNames(["SC-001", "SC-002", "SC-003"])
      setReceiverNames(["John Smith", "Sarah Johnson", "Michael Brown"])
      setLeadSources(["Indiamart", "Justdial", "Social Media", "Website", "Referral", "Other"])
      setStateOptions(["Andhra Pradesh", "Assam", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"])
      setNobOptions(["Manufacturing", "Trading", "Service", "Retail"])
    }
  }

  // Function to fetch company data from DROPDOWN sheet
  const fetchCompanyData = async () => {
    try {
      const publicUrl = "https://docs.google.com/spreadsheets/d/1bLTwtlHUmADSOyXJBxQJ2sxEy-dII8v2aGCDYuqppx4/gviz/tq?tqx=out:json&sheet=DROPDOWN"
      
      const response = await fetch(publicUrl)
      const text = await response.text()
      
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}') + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      
      const data = JSON.parse(jsonData)
      
      if (data && data.table && data.table.rows) {
        const companies = []
        const detailsMap = {}
        
        data.table.rows.slice(0).forEach(row => {
          if (row.c && row.c[40] && row.c[40].v !== null) {
            const companyName = row.c[40].v.toString()
            companies.push(companyName)
            
            detailsMap[companyName] = {
              salesPerson: (row.c[41] && row.c[41].v !== null) ? row.c[41].v.toString() : "", 
              phoneNumber: (row.c[42] && row.c[42].v !== null) ? row.c[42].v.toString() : "", 
              email: (row.c[43] && row.c[43].v !== null) ? row.c[43].v.toString() : "",
              location: (row.c[44] && row.c[44].v !== null) ? row.c[44].v.toString() : ""
            }
          }
        })
        
        setCompanyOptions(companies)
        setCompanyDetailsMap(detailsMap)
      }
    } catch (error) {
      console.error("Error fetching company data:", error)
      setCompanyOptions([])
      setCompanyDetailsMap({})
    }
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }))

    // Auto-fill related fields if company is selected
if (id === "companyName" && value) {
  const companyDetails = companyDetailsMap[value] || {};

  setFormData(prev => ({
    ...prev,
    companyName: value,
    phoneNumber: companyDetails.phoneNumber || "",
    salespersonName: companyDetails.salesPerson || "",
    location: companyDetails.location || "",
    email: companyDetails.email || ""
  }));
}

  }

  const generateLeadNumber = async () => {
    try {
      const publicUrl = "https://docs.google.com/spreadsheets/d/1bLTwtlHUmADSOyXJBxQJ2sxEy-dII8v2aGCDYuqppx4/gviz/tq?tqx=out:json&sheet=FMS"
      
      const response = await fetch(publicUrl)
      const text = await response.text()
      
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}') + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      
      const data = JSON.parse(jsonData)
      
      if (!data || !data.table || !data.table.rows || data.table.rows.length === 0) {
        return "LD-001"
      }
      
      let lastLeadNumber = null
      for (let i = data.table.rows.length - 1; i >= 0; i--) {
        const row = data.table.rows[i]
        if (row.c && row.c[1] && row.c[1].v) {
          const cellValue = row.c[1].v.toString()
          if (cellValue.startsWith("LD-")) {
            lastLeadNumber = cellValue
            break
          }
        }
      }
      
      if (!lastLeadNumber) {
        return "LD-001"
      }
      
      const match = lastLeadNumber.match(/LD-(\d+)/)
      if (match) {
        const lastNumber = parseInt(match[1], 10)
        const nextNumber = lastNumber + 1
        return `LD-${String(nextNumber).padStart(3, '0')}`
      } else {
        return "LD-001"
      }
    } catch (error) {
      console.error("Error generating lead number:", error)
      return "LD-001"
    }
  }

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const payload = {
      receiverName: formData.receiverName,
      scName: formData.scName,
      source: formData.source,
      companyName: formData.companyName,
      phoneNumber: formData.phoneNumber,
      salespersonName: formData.salespersonName,
      location: formData.location,
      email: formData.email,
      state: formData.state,
      address: formData.address,
      nob: formData.nob,
      notes: formData.notes,
    };

    // const response = await fetch("http://localhost:5050/api/leads", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(payload),
    // });

     const response = await fetch(`${API_BASE_URL}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      const leadNumber = result.data?.leadNo;
      showNotification(
        `Lead created successfully with Lead Number: ${leadNumber}`,
        "success"
      );

      // Reset form
      setFormData({
        receiverName: "",
        scName: "",
        source: "",
        companyName: "",
        phoneNumber: "",
        salespersonName: "",
        location: "",
        email: "",
        state: "",
        address: "",
        nob: "",
        notes: "",
      });
    } else {
      showNotification(
        "Error creating lead: " + (result.message || "Unknown error"),
        "error"
      );
    }
  } catch (error) {
    showNotification("Error submitting form: " + error.message, "error");
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Lead Management
          </h1>
          <p className="text-slate-600 mt-1">Enter the details of the new lead</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">New Lead</h2>
          <p className="text-sm text-slate-500">Fill in the lead information below</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="receiverName" className="block text-sm font-medium text-gray-700">
                  Lead Receiver Name
                </label>
                <select
                  id="receiverName"
                  value={formData.receiverName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select receiver</option>
                  {receiverNames.map((name, index) => (
                    <option key={index} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="scName" className="block text-sm font-medium text-gray-700">
                  SC Name
                </label>
                <select
                  id="scName"
                  value={formData.scName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select SC Name</option>
                  {scNames.map((name, index) => (
                    <option key={index} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Lead Source
                </label>
                <select
                  id="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select source</option>
                  {leadSources.map((source, index) => (
                    <option key={index} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  list="companyOptions"
                  id="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <datalist id="companyOptions">
                  {companyOptions.map((company, index) => (
                    <option key={index} value={company} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number will auto-fill"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="salespersonName" className="block text-sm font-medium text-gray-700">
                  Contact Person
                </label>
                <input
                  id="salespersonName"
                  value={formData.salespersonName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Salesperson name will auto-fill"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Location will auto-fill"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email will auto-fill"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select state</option>
                  {stateOptions.map((state, index) => (
                    <option key={index} value={state}>{state}</option>
                  ))}
                </select>
              </div>

             <div className="space-y-2">
  <label htmlFor="nob" className="block text-sm font-medium text-gray-700">
    Nature of Business (NOB)
  </label>
  <input
    list="nob-options"
    id="nob"
    name="nob"
    value={formData.nob}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="Select or type nature of business"
  />
  <datalist id="nob-options">
    {nobOptions.map((option, index) => (
      <option key={index} value={option} />
    ))}
  </datalist>
</div>

            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter complete address"
                rows="2"
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional information"
                rows="3"
              />
            </div>
          </div>
          
          <div className="p-6 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Leads
