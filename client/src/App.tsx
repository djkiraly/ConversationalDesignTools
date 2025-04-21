import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Transcripts from "@/pages/Transcripts";
import TranscriptDetail from "@/pages/TranscriptDetail";
import JourneyMaps from "@/pages/JourneyMaps";
import JourneyMapDetail from "@/pages/JourneyMapDetail";
import TranscriptToJourneyMap from "@/pages/TranscriptToJourneyMap";
import AppLayout from "@/components/AppLayout";

function Router() {
  return (
    <AppLayout>
      <Switch>
        {/* Original Routes */}
        <Route path="/" component={Home} />
        <Route path="/use-case/:id" component={Home} />
        
        {/* Transcript Routes */}
        <Route path="/transcripts" component={Transcripts} />
        <Route path="/transcript/:id" component={TranscriptDetail} />
        
        {/* Journey Map Routes */}
        <Route path="/journey-maps" component={JourneyMaps} />
        <Route path="/journey-map/:id" component={JourneyMapDetail} />
        <Route path="/journey-map/from-transcript/:transcriptId" component={TranscriptToJourneyMap} />
        
        {/* 404 Route */}
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
