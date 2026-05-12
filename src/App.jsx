import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import WhatsAppBotConfig from './pages/WhatsAppBotConfig';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import GuestGallery from './pages/GuestGallery';
import GuestManagement from './pages/GuestManagement';
import MediaLibrary from './pages/MediaLibrary';
import ContactBookDemo from './pages/ContactBookDemo';
import Camera2CloudSetup from './pages/Camera2CloudSetup';
import AIPhotoEditing from './pages/AIPhotoEditing';
import BusinessSignup from './pages/BusinessSignup';
import WhiteLabelBranding from './pages/WhiteLabelBranding';
import Pricing from './pages/Pricing';
import FeaturesOverview from './pages/FeaturesOverview';
import Login from './pages/Login';
import AIFaceRecognitionHub from './pages/AIFaceRecognitionHub';
import Homepage from './pages/Homepage';
import EventHub from './pages/EventHub';
import Analytics from './pages/Analytics';
import AboutUs from './pages/AboutUs';
import InviteBuilder from './pages/InviteBuilder';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Homepage />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/featuresoverview" element={<FeaturesOverview />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/contactbookdemo" element={<ContactBookDemo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/businesssignup" element={<BusinessSignup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/createevent" element={<CreateEvent />} />
        <Route path="/eventhub" element={<EventHub />} />
        <Route path="/guestmanagement" element={<GuestManagement />} />
        <Route path="/medialibrary" element={<MediaLibrary />} />
        <Route path="/aifacerecognitionhub" element={<AIFaceRecognitionHub />} />
        <Route path="/aiphotoediting" element={<AIPhotoEditing />} />
        <Route path="/camera2cloudsetup" element={<Camera2CloudSetup />} />
        <Route path="/whatsappbotconfig" element={<WhatsAppBotConfig />} />
        <Route path="/guestgallery" element={<GuestGallery />} />
        <Route path="/invitebuilder" element={<InviteBuilder />} />
        <Route path="/whitelabelbranding" element={<WhiteLabelBranding />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
