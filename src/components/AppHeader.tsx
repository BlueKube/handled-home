import logo from "@/assets/handled-home-logo.png";

export function AppHeader() {
  return (
    <header className="h-12 bg-card border-b border-border flex items-center justify-center px-4 safe-top">
      <img src={logo} alt="Handled Home" className="h-7 w-auto" />
    </header>
  );
}
