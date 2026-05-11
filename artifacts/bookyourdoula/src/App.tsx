import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import DoulasList from "@/pages/doulas-list";
import DoulaProfile from "@/pages/doula-profile";
import BookingForm from "@/pages/booking-form";
import DoulaForm from "@/pages/doula-form";
import DoulaDashboard from "@/pages/doula-dashboard";
import BookingsList from "@/pages/bookings-list";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/doulas" component={DoulasList} />
        <Route path="/doulas/new" component={DoulaForm} />
        <Route path="/doulas/:id/book" component={BookingForm} />
        <Route path="/doulas/:id/edit">
          {(params) => <DoulaForm key={params.id} />}
        </Route>
        <Route path="/doulas/:id/dashboard" component={DoulaDashboard} />
        <Route path="/doulas/:id" component={DoulaProfile} />
        <Route path="/bookings" component={BookingsList} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
