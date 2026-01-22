import Header from './components/Header'
import Hero from './components/Hero'
import ProductsRow from './components/ProductsRow'
import ProductDetail from './pages/ProductDetail'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmation from './pages/OrderConfirmation'
import WishlistPage from './pages/WishlistPage'
import ProfilePage from './pages/ProfilePage'
import LoginSignupPage from './pages/LoginSignupPage'
import CartPage from './pages/CartPage'
import { Routes, Route, useLocation } from 'react-router-dom'
import CategoriesSection from './components/CategoriesSection'
import Footer from './components/Footer'
import FooterBanner from './components/FooterBanner'
import ScrollToTop from './components/ScrollToTop'
import AdminLoginPage from './admin/AdminLoginPage'
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import AdminProductsPage from './admin/AdminProductsPage'
import AdminOrdersPage from './admin/AdminOrdersPage'
import AdminOrderDetailPage from './admin/AdminOrderDetailPage'
import AdminUsersPage from './admin/AdminUsersPage'
import AdminUserEditPage from './admin/AdminUserEditPage'
import AdminContentPage from './admin/AdminContentPage'
import AdminProductForm from './admin/AdminProductForm'
import AdminLookbookPage from './admin/AdminLookbookPage'
import AdminLookbookForm from './admin/AdminLookbookForm'
import AdminLookbookDetail from './admin/AdminLookbookDetail'
import AdminProductInventory from './admin/AdminProductInventory'
import AdminTotalProductsInventory from './admin/AdminTotalProductsInventory'
import SearchPage from './pages/SearchPage'
import CategoryPage from './pages/CategoryPage'
import LookbookPage from './pages/LookbookPage'
import LookbookDetail from './pages/LookbookDetail'
import TermsAndConditions from './pages/TermsAndConditions'
import PrivacyPolicy from './pages/PrivacyPolicy'
import ShippingPolicy from './pages/ShippingPolicy'
import RefundExchangePolicy from './pages/RefundExchangePolicy'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'

function App() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      {!isAdminRoute && <Header />}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <div className="my-16">
                  <CategoriesSection />
                </div>
                <ProductsRow />
              </>
            }
          />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/lookbook" element={<LookbookPage />} />
          <Route path="/lookbook/:id" element={<LookbookDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/login" element={<LoginSignupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/refund-exchange-policy" element={<RefundExchangePolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/products" element={<AdminLayout><AdminProductsPage /></AdminLayout>} />
          <Route path="/admin/products/inventory" element={<AdminLayout><AdminTotalProductsInventory /></AdminLayout>} />
          <Route path="/admin/products/new" element={<AdminLayout><AdminProductForm mode="create" /></AdminLayout>} />
          <Route path="/admin/products/:id/edit" element={<AdminLayout><AdminProductForm mode="edit" /></AdminLayout>} />
          <Route path="/admin/products/:id/inventory" element={<AdminLayout><AdminProductInventory /></AdminLayout>} />
          <Route path="/admin/orders" element={<AdminLayout><AdminOrdersPage /></AdminLayout>} />
          <Route path="/admin/orders/:id" element={<AdminLayout><AdminOrderDetailPage /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUsersPage /></AdminLayout>} />
          <Route path="/admin/users/:id/edit" element={<AdminLayout><AdminUserEditPage /></AdminLayout>} />
          <Route path="/admin/content" element={<AdminLayout><AdminContentPage /></AdminLayout>} />
          <Route path="/admin/lookbook" element={<AdminLayout><AdminLookbookPage /></AdminLayout>} />
          <Route path="/admin/lookbook/new" element={<AdminLayout><AdminLookbookForm /></AdminLayout>} />
          <Route path="/admin/lookbook/:id/edit" element={<AdminLayout><AdminLookbookForm /></AdminLayout>} />
          <Route path="/admin/lookbook/:id/view" element={<AdminLayout><AdminLookbookDetail /></AdminLayout>} />
        </Routes>
      </main>
      {!isAdminRoute && <FooterBanner />}
      {!isAdminRoute && <Footer />}
    </div>
  )
}

export default App
