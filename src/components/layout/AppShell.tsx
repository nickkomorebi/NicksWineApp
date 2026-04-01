import { BottomNav } from "./BottomNav";
import AppSwitcher from "./AppSwitcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-3 right-3 z-50">
        <AppSwitcher />
      </div>
      <main className="flex-1 max-w-lg mx-auto w-full pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
