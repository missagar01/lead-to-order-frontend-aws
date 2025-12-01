"use client"

import { useState, useEffect, createContext } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Leads from "./pages/Leads"
import FollowUp from "./pages/FollowUp"
import NewFollowUp from "./pages/NewFollowUp"
import CallTracker from "./pages/CallTracker"
import NewCallTracker from "./pages/NewCallTracker"
import Quotation from "./pages/Quotation/Quotation"
import MainNav from "./components/MainNav"
import Footer from "./components/Footer"
import Notification from "./components/Notification"

// Create auth context
export const AuthContext = createContext(null)
// Create data context to manage data access based on user type
export const DataContext = createContext(null)

// API base URL - change this to match your backend
// const API_BASE_URL = "http://localhost:5050/api" // Your backend port
const API_BASE_URL = import.meta.env.VITE_API_URL;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [notification, setNotification] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [userType, setUserType] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Check if user is already logged in on app load
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("currentUser")
    
    if (token && storedUser) {
      try {
        // Verify token with backend
        const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setIsAuthenticated(true)
            const parsedUser = JSON.parse(storedUser)
            setCurrentUser(parsedUser)
            setUserType(parsedUser.userType)
            // Fetch user data
            fetchUserData()
          } else {
            // Token is invalid, clear storage
            clearAuthData()
          }
        } else {
          // Token verification failed, clear storage
          clearAuthData()
        }
      } catch (error) {
        console.error("Auth check error:", error)
        clearAuthData()
      }
    }
    setAuthChecked(true)
  }

  const clearAuthData = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("userType")
    setIsAuthenticated(false)
    setCurrentUser(null)
    setUserType(null)
    setUserData(null)
  }

  // Function to fetch data from PostgreSQL backend
  const fetchUserData = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/data`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()
      
      if (data.success) {
        setUserData(data.data)
      } else {
        showNotification(data.message || "Failed to fetch data", "error")
      }
    } catch (error) {
      console.error("Data fetching error:", error)
      showNotification("An error occurred while fetching data", "error")
    } finally {
      setIsLoading(false)
    }
  }

const login = async (username, password) => {
  setIsLoading(true)
  try {
    console.log("Attempting login for:", username);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    console.log("Login response status:", response.status);
    
    // Get the response text to see what the backend is sending
    const responseText = await response.text();
    console.log("Login response text:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse response:", parseError);
      showNotification("Server returned invalid response", "error");
      return false;
    }
    
    if (response.ok && data.success) {
      // Store token and user info
      localStorage.setItem("token", data.token)
      localStorage.setItem("currentUser", JSON.stringify(data.user))
      localStorage.setItem("userType", data.user.userType)
      
      setIsAuthenticated(true)
      setCurrentUser(data.user)
      setUserType(data.user.userType)
      
      // Fetch user data
      await fetchUserData()
      
      showNotification(`Welcome, ${username}! (${data.user.userType})`, "success")
      return true
    } else {
      showNotification(data.message || "Invalid credentials", "error")
      return false
    }
  } catch (error) {
    console.error("Login error:", error)
    showNotification("An error occurred during login", "error")
    return false
  } finally {
    setIsLoading(false)
  }
}

  const logout = () => {
    clearAuthData()
    showNotification("Logged out successfully", "success")
  }

  const showNotification = (message, type = "info") => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }
  
  // Check if user has admin privileges
  const isAdmin = () => {
    return userType === "admin"
  }

  // Protected route component
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!authChecked) {
      return <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />
    }
    
    // If admin-only route and user is not admin, redirect to dashboard
    if (adminOnly && !isAdmin()) {
      showNotification("You don't have permission to access this page", "error")
      return <Navigate to="/" />
    }
    
    return children
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      showNotification, 
      currentUser, 
      userType, 
      isAdmin: isAdmin,
      isLoading,
      fetchUserData
    }}>
      <DataContext.Provider value={{ userData, fetchUserData }}>
        <Router>
          <div className="min-h-screen flex flex-col bg-white text-gray-900">
            {isAuthenticated && <MainNav logout={logout} userType={userType} username={currentUser?.username} />}
            <main className="flex-1">
              <Routes>
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leads"
                  element={
                    <ProtectedRoute>
                      <Leads />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/follow-up"
                  element={
                    <ProtectedRoute>
                      <FollowUp />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/follow-up/new"
                  element={
                    <ProtectedRoute>
                      <NewFollowUp />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/call-tracker"
                  element={
                    <ProtectedRoute>
                      <CallTracker />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/call-tracker/new"
                  element={
                    <ProtectedRoute>
                      <NewCallTracker />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quotation"
                  element={
                    <ProtectedRoute>
                      <Quotation />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            {isAuthenticated && <Footer />}
            {notification && <Notification message={notification.message} type={notification.type} />}
          </div>
        </Router>
      </DataContext.Provider>
    </AuthContext.Provider>
  )
}

export default App