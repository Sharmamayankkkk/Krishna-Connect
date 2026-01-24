import { Separator } from "@/components/ui/separator"
import { SettingsSidebar } from "./components/settings-sidebar"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="container max-w-4xl mx-auto py-6 px-4 md:px-8">
            <div className="space-y-0.5 mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5 overflow-x-auto lg:overflow-visible">
                    <SettingsSidebar />
                </aside>
                <div className="flex-1 lg:max-w-2xl">{children}</div>
            </div>
        </div>
    )
}
