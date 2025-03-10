import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import Dashboard from "@/pages/dashboard";
import Goals from "@/pages/goals";
import Analytics from "@/pages/analytics";
import Achievements from "@/pages/achievements";
import Settings from "@/pages/settings";
import Debug from "@/pages/debug";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <SidebarLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/goals" component={Goals} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/settings" component={Settings} />
        <Route path="/debug" component={Debug} />
        <Route component={NotFound} />
      </Switch>
    </SidebarLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
