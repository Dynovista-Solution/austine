import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { ContentProvider } from './context/ContentContext.jsx'
import { AdminProvider } from './admin/AdminContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AdminProvider>
        <ContentProvider>
          <CartProvider>
            <WishlistProvider>
              <UserProvider>
                <App />
              </UserProvider>
            </WishlistProvider>
          </CartProvider>
        </ContentProvider>
      </AdminProvider>
    </BrowserRouter>
  </ErrorBoundary>,
)
