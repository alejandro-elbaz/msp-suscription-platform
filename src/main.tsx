import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { DashboardPage } from '@/pages/HomePage'
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientsPage } from "@/pages/ClientsPage";
import { ServicesPage } from "@/pages/ServicesPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import ReportsPage from "@/pages/ReportsPage";
import { IntegrationsPage } from "@/pages/IntegrationsPage";
import { IntegrationDetailPage } from "@/pages/IntegrationDetailPage";
import SettingsPage from "@/pages/SettingsPage";
import InternalSubscriptionsPage from "@/pages/InternalSubscriptionsPage";
import LicensePoolsPage from "@/pages/LicensePoolsPage";
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "/",
        element: <DashboardPage />,
      },
      {
        path: "/clients",
        element: <ClientsPage />,
      },
      {
        path: "/clients/:clientId",
        element: <ClientDetailPage />,
      },
      {
        path: "/services",
        element: <ServicesPage />,
      },
      {
        path: "/internal-subscriptions",
        element: <InternalSubscriptionsPage />,
      },
      {
        path: "/license-pools",
        element: <LicensePoolsPage />,
      },
      {
        path: "/reports",
        element: <ReportsPage />,
      },
      {
        path: "/integrations",
        element: <IntegrationsPage />,
      },
      {
        path: "/integrations/:integrationId",
        element: <IntegrationDetailPage />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      }
    ]
  },
]);
// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)