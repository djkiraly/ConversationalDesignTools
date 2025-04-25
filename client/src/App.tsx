import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import HomePage from "@/pages/HomePage";
import CustomerJourney from "@/pages/CustomerJourney";
import Customers from "@/pages/Customers";
import Settings from "@/pages/Settings";
import ActionPlan from "@/pages/ActionPlan";
import UseCase from "@/pages/UseCase";
import AppLayout from "@/components/AppLayout";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/home" component={HomePage} />
        <Route path="/happy-path" component={Home} />
        <Route path="/use-case" component={UseCase} />
        <Route path="/use-case/:id" component={Home} />
        <Route path="/customer-journey" component={CustomerJourney} />
        <Route path="/customers" component={Customers} />
        <Route path="/action-plan" component={ActionPlan} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
