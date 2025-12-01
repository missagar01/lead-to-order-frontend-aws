// DashboardCharts.jsx - Updated for backend
import { useState, useEffect, useContext } from "react"
import { AuthContext } from "../../App"
import { fetchDashboardCharts } from "./dashboard-api.js" // Import the API function
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Fallback data
const fallbackData = {
  overview: [
    { month: "Jan", leads: 45, enquiries: 30, orders: 12 },
    { month: "Feb", leads: 52, enquiries: 35, orders: 15 },
    { month: "Mar", leads: 48, enquiries: 32, orders: 14 },
    { month: "Apr", leads: 70, enquiries: 45, orders: 20 },
    { month: "May", leads: 65, enquiries: 40, orders: 18 },
    { month: "Jun", leads: 58, enquiries: 38, orders: 16 },
  ],
  conversion: [
    { name: "Leads", value: 124, color: "#4f46e5" },
    { name: "Enquiries", value: 82, color: "#8b5cf6" },
    { name: "Quotations", value: 56, color: "#d946ef" },
    { name: "Orders", value: 27, color: "#ec4899" },
  ],
  sources: [
    { name: "Indiamart", value: 45, color: "#06b6d4" },
    { name: "Justdial", value: 28, color: "#0ea5e9" },
    { name: "Social Media", value: 20, color: "#3b82f6" },
    { name: "Website", value: 15, color: "#6366f1" },
    { name: "Referrals", value: 12, color: "#8b5cf6" },
  ]
}

function DashboardCharts() {
  const { currentUser, isAdmin } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState("overview")
  const [chartData, setChartData] = useState(fallbackData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Use the backend API instead of Google Sheets
        const data = await fetchDashboardCharts(
          currentUser?.username || currentUser?.id, 
          isAdmin()
        )
        
        setChartData(data)
        
      } catch (error) {
        console.error("Error fetching chart data:", error)
        setError(error.message)
        // Fallback data is already set
      } finally {
        setIsLoading(false)
      }
    }
    
    if (currentUser) {
      fetchData()
    }
  }, [currentUser, isAdmin])

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Sales Analytics ( Lead To Order )</h3>
        {isAdmin() && <p className="text-green-600 font-semibold">Admin View: Showing all data</p>}
      </div>

      {/* Rest of the component remains the same, just use chartData instead of separate state variables */}
      <div className="mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              activeTab === "overview" ? "bg-slate-100 text-slate-900" : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("conversion")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "conversion" ? "bg-slate-100 text-slate-900" : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Conversion
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              activeTab === "sources" ? "bg-slate-100 text-slate-900" : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Lead Sources
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[350px] flex items-center justify-center">
          <p className="text-slate-500">Loading chart data...</p>
        </div>
      ) : error ? (
        <div className="h-[350px] flex items-center justify-center">
          <p className="text-red-500">Error loading data. Using fallback data.</p>
        </div>
      ) : (
        <div className="h-[350px]">
          {activeTab === "overview" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.overview} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" name="Leads" fill="#4f46e5" />
                <Bar dataKey="enquiries" name="Enquiries" fill="#8b5cf6" />
                <Bar dataKey="orders" name="Orders" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === "conversion" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              <div className="h-full w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData.conversion}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.conversion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col justify-center overflow-y-auto max-h-[350px]">
                <h4 className="text-lg font-medium mb-4">Conversion Funnel</h4>
                <div className="space-y-4">
                  {chartData.conversion.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full"
                          style={{
                            width: `${(item.value / (chartData.conversion[0].value || 1)) * 100}%`,
                            backgroundColor: item.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "sources" && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.sources}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}

export default DashboardCharts