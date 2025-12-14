// src/App.jsx
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Layout i globalne komponenty
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import ChatAssistant from "./components/ChatAssistant";

// Strażnicy Tras
import ProtectedRoute from "./components/routes/ProtectedRoute";
import OwnerRoute from "./components/routes/OwnerRoute";

// Strony Publiczne
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Contact from "./pages/Contact";
import Search from "./pages/Search";
import ProductCatalog from "./pages/ProductCatalog";
import CategoryCatalog from "./pages/CategoryCatalog";
import ProductDetail from "./pages/ProductDetail";
import Shipping from "./pages/Shipping";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AccountActivate from "./pages/AccountActivate";
import ResetPassword from "./pages/ResetPassword";

// Strony Chronione (Tylko dla zalogowanych)
import AccountLayout from "./pages/account/AccountLayout";
import ProfileDetails from "./pages/account/ProfileDetails";
import OrdersList from "./pages/account/OrdersList";
import OrderDetails from "./pages/account/OrderDetails";
import AddressesManagement from "./pages/account/AddressesManagement";
import SettingsPanel from "./pages/account/SettingsPanel";
import AdminDashboard from "./pages/account/AdminDashboard";


// Strony Chronione (Owner - admin/*)
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Orders from "./pages/admin/Orders";
import CategoryAdd from "./pages/admin/components/CategoryAdd";
import CategoryEdit from "./pages/admin/components/CategoryEdit";
import CategoryView from "./pages/admin/components/CategoryView";
import AttributeAdd from "./pages/admin/components/AttributeAdd";
import AttributeEdit from "./pages/admin/components/AttributeEdit";
import ProductAdd from "./pages/admin/components/ProductAdd";
import ProductEdit from "./pages/admin/components/ProductEdit";
import ProductView from "./pages/admin/components/ProductView";
import AdminOrderDetails from "./pages/admin/components/AdminOrderDetails";


function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-14">
          <Routes>
            {/* --- Trasy Publiczne --- */}
            {/* ... (trasy publiczne) ... */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/activate" element={<AccountActivate />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/search" element={<Search />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/products" element={<ProductCatalog />} />
            <Route path="/categories" element={<CategoryCatalog />} />
            <Route path="/category/:id" element={<ProductCatalog />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />


            {/* --- Trasy Chronione (tylko zalogowani) --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<Checkout />} />

              {/* ACCOUNT LAYOUT JAKO KONTENER DLA ZAKŁADEK */}
              <Route path="/account" element={<AccountLayout />}>
                <Route index element={<ProfileDetails />} />
                <Route path="profile" element={<ProfileDetails />} />
                <Route path="orders" element={<OrdersList />} />
                <Route path="addresses" element={<AddressesManagement />} />
                <Route path="settings" element={<SettingsPanel />} />
                <Route path="admin" element={<AdminDashboard />} />
              </Route>

              {/* --- ZMIANA: OrderDetails jest osobnym widokiem --- */}
              <Route path="/account/orders/:id" element={<OrderDetails />} />

            </Route>

            {/* --- Trasy Właściciela (ROLE_OWNER) --- */}
            <Route path="/admin" element={<OwnerRoute />}>
              <Route index element={<AdminDashboard />} />

              {/* Kategorie */}
              <Route path="categories" element={<Categories />} />
              <Route path="categories/add" element={<CategoryAdd />} />
              <Route path="categories/:id" element={<CategoryView />} />
              <Route path="categories/:id/edit" element={<CategoryEdit />} />
              <Route path="categories/:categoryId/attributes/add" element={<AttributeAdd />} />
              <Route path="categories/:categoryId/attributes/:attributeId/edit" element={<AttributeEdit />} />

              {/* Produkty */}
              <Route path="products" element={<Products />} />
              <Route path="products/add" element={<ProductAdd />} />
              <Route path="products/:id" element={<ProductView />} />
              <Route path="products/:id/edit" element={<ProductEdit />} />

              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<AdminOrderDetails />} />
            </Route>

          </Routes>
        </main>

        {/* Wirtualny Asystent: Renderowany tylko, jeśli użytkownik jest zalogowany */}
        {isAuthenticated && <ChatAssistant />}

        <Footer />
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}