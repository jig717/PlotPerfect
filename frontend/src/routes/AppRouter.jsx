import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../Components/ui/Spinner'

// Pages
import Home from '../pages/Home'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import PropertyListPage from '../pages/property/PropertyListPage'
import PropertyDetailPage from '../pages/property/PropertyDetailPage'
import PostPropertyPage from '../pages/property/PostPropertyPage'
import BuyerDashboard from '../pages/dashboard/BuyerDashboard'
import AgentDashboard from '../pages/dashboard/AgentDashboard'
import AdminDashboard from '../pages/dashboard/AdminDashboard'
import SupportDashboard from '../pages/dashboard/SupportDashboard'
import OwnerDashboard from '../pages/dashboard/OwnerDashboard'
import CreateTicket from '../Support/ticketcreate'
import SavedProperties from "../pages/property/SavedProperties"

/* ── Guards ── */
function PrivateRoute({ children, roles = [] }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  )
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

const router = createBrowserRouter([
  /* Public */
  { path: '/', element: <Home /> },
  { path: '/properties', element: <PropertyListPage /> },
  { path: '/property/:id', element: <PropertyDetailPage /> },

  /* Auth — redirect if already logged in */
  {
    path: '/', element: <PublicRoute />, children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ]
  },

  /* Protected — agent & owner */
  {
    path: "/protected/agent",
    element: (
      <PrivateRoute roles={['agent', 'owner']}>
        <PostPropertyPage />
      </PrivateRoute>
    )
  },

  /* Protected — owner */
  {
    path: "/dashboard/owner",
    element: (
      <PrivateRoute roles={['owner']}>
        <OwnerDashboard />
      </PrivateRoute>
    ) 
    },

  /* Protected — buyer */
  {
    path: "/dashboard/buyer",
    element: (
      <PrivateRoute roles={['buyer']}>
        <BuyerDashboard />
      </PrivateRoute>
    )
  },

  /* Protected — saved properties (any logged‑in user) */
  {
    path: "/property/saved",
    element: (
      <PrivateRoute>
        <SavedProperties />
      </PrivateRoute>
    )
  },

  /* Protected — agent dashboard */
  {
    path: "/dashboard/agent",
    element: (
      <PrivateRoute roles={['agent']}>
        <AgentDashboard />
      </PrivateRoute>
    )
  },

  /* Protected — admin only */
  {
    path: "/admin",
    element: (
      <PrivateRoute roles={['admin']}>
        <AdminDashboard />
      </PrivateRoute>
    )
  },

  /* Protected — support only */
  {
    path: "/support",
    element: (
      <PrivateRoute roles={['support']}>
        <SupportDashboard />
      </PrivateRoute>
    )
  },

  {
    path: "/support/create",
    element: (
      <PrivateRoute>
        <CreateTicket />
      </PrivateRoute>
    )
  },

  /* 404 */
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}