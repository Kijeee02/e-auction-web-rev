import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import AdminUsersPage from "@/pages/admin-users-page";
import HomePage from "@/pages/home-page";
import AuctionsPage from "@/pages/auctions-page";
import AuthPage from "@/pages/auth-page";
import AuctionDetail from "@/pages/auction-detail";
import UserDashboard from "@/pages/user-dashboard";
import AdminPanel from "@/pages/admin-panel";
import NotFound from "@/pages/not-found";
import EditAuctionPage from "@/pages/EditAuctionPage";
import AccountSettings from "./pages/account-settings";


function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/auctions" component={AuctionsPage} />
      <Route path="/auction/:id" component={AuctionDetail} />
      <AdminRoute path="/admin" component={AdminPanel} />
      <AdminRoute path="/admin/edit-auction/:id" component={EditAuctionPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/auction/:id" component={AuctionDetail} />
      <ProtectedRoute path="/dashboard" component={UserDashboard} />
      <AdminRoute path="/admin" component={AdminPanel} />
      <AdminRoute path="/admin/users" component={AdminUsersPage} />
      <Route path="/account-settings" component={AccountSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;