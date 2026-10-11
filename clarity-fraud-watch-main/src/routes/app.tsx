import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export const Route = createFileRoute("/app")({
  component: DashboardLayout,
});
