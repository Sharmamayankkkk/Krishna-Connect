import { Metadata } from 'next';
import MaintenanceContent from './maintenance-content';

export const metadata: Metadata = {
    title: "Maintenance",
    description: "Krishna Connect is currently under maintenance. We'll be back soon.",
};

export default function MaintenancePage() {
  return <MaintenanceContent />;
}
