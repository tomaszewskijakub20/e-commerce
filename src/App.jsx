import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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
import Shipping from "./pages/Shipping";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";

// Strony Chronione (Użytkownik)
import Account from "./pages/Account";

// Strony Chronione (Owner)
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import CategoryAdd from "./pages/admin/components/CategoryAdd";
import CategoryEdit from "./pages/admin/components/CategoryEdit";
import CategoryView from "./pages/admin/components/CategoryView";
import AttributeAdd from "./pages/admin/components/AttributeAdd";
import AttributeEdit from "./pages/admin/components/AttributeEdit";
import ProductView from "./pages/admin/components/ProductView";
import ProductAdd from "./pages/admin/components/ProductAdd";
import ProductEdit from "./pages/admin/components/ProductEdit";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Navbar />
          <main className="flex-grow pt-14">
            <Routes>
              {/* --- Trasy Publiczne --- */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
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

              {/* --- Trasy Chronione (tylko zalogowani) --- */}
              <Route element={<ProtectedRoute />}>
                <Route path="/account" element={<Account />} />
              </Route>

              {/* --- Trasy Właściciela --- */}
              <Route path="/admin" element={<OwnerRoute />}>
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
              </Route>

            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}