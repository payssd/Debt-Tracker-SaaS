import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import ReferralsPage from "./pages/Referrals";
import AddCustomer from "./pages/AddCustomer";
import CustomerDetail from "./pages/CustomerDetail";
import Invoices from "./pages/Invoices";
import AddInvoice from "./pages/AddInvoice";
import Statements from "./pages/Statements";
import Reminders from "./pages/Reminders";
import Pricing from "./pages/Pricing";
import Subscription from "./pages/Subscription";
import SubscriptionCallback from "./pages/SubscriptionCallback";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <SubscriptionProvider>
              <DataProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/signup" element={<Auth />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/subscription/callback" element={<SubscriptionCallback />} />
                  <Route path="/dashboard" element={<ProtectedRoute><SubscriptionGuard><Dashboard /></SubscriptionGuard></ProtectedRoute>} />
                  <Route path="/referrals" element={<ProtectedRoute><SubscriptionGuard><ReferralsPage /></SubscriptionGuard></ProtectedRoute>} />
                  <Route path="/customers" element={<ProtectedRoute><SubscriptionGuard><Customers /></SubscriptionGuard></ProtectedRoute>} />
                  <Route path="/customers/new" element={<ProtectedRoute><SubscriptionGuard><AddCustomer /></SubscriptionGuard></ProtectedRoute>} />
                  <Route path="/customers/:id" element={<ProtectedRoute><SubscriptionGuard><CustomerDetail /></SubscriptionGuard></ProtectedRoute>} />
                  <Route path="/invoices" element={<ProtectedRoute><SubscriptionGuard><Invoices /></SubscriptionGuard></ProtectedRoute>} />
                  <Route path="/invoices/new" element={<ProtectedRoute><SubscriptionGuard><AddInvoice /></SubscriptionGuard></ProtectedRoute>} />
                  <Route path="/statements" element={<ProtectedRoute><SubscriptionGuard><Statements /></SubscriptionGuard></ProtectedRoute>} />
                  <Route path="/reminders" element={<ProtectedRoute><SubscriptionGuard><Reminders /></SubscriptionGuard></ProtectedRoute>} />
                  <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DataProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
