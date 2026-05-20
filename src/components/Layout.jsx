import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderPlus, Menu, X, Users, ClipboardList, DollarSign, Tag, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import ScrapSummary from "./sidebar/ScrapSummary";
import AdminNotifications from "./AdminNotifications";

const adminNavItems = [
  { path: "/", label: "Panel", icon: LayoutDashboard },
  { path: "/nuevo", label: "Nuevo Proyecto", icon: FolderPlus },
  { path: "/pedidos", label: "Pedidos", icon: FileText },
  { path: "/tareas", label: "Tareas", icon: ClipboardList },
  { path: "/categorias", label: "Categorías", icon: Tag },
  { path: "/trabajadores", label: "Trabajadores", icon: Users },
  { path: "/precios", label: "Precios Unitarios", icon: DollarSign },
];

const liderNavItems = [
  { path: "/", label: "Panel", icon: LayoutDashboard },
  { path: "/nuevo", label: "Nuevo Proyecto", icon: FolderPlus },
];

const workerNavItems = [
  { path: "/mis-proyectos", label: "Mis Proyectos", icon: LayoutDashboard },
  { path: "/mis-tareas", label: "Mis Tareas", icon: ClipboardList },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navRole, setNavRole] = useState("admin"); // 'admin' | 'lider' | 'worker'

  useEffect(() => {
    async function detectRole() {
      try {
        const user = await base44.auth.me();
        if (user?.role === "worker") { setNavRole("worker"); return; }
        if (user?.role === "admin") { setNavRole("admin"); return; }
        // Check puesto in Worker entity
        const workers = await base44.entities.Worker.list("nombre");
        const match = workers.find(
          (w) => w.nombre?.trim().toLowerCase() === user?.full_name?.trim().toLowerCase()
        );
        const puesto = match?.puesto;
        if (puesto === "LIDER" || puesto === "GERENTE") setNavRole("lider");
        else setNavRole("admin");
      } catch { setNavRole("admin"); }
    }
    detectRole();
  }, []);

  const navItems = navRole === "worker" ? workerNavItems : navRole === "lider" ? liderNavItems : adminNavItems;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-lg font-bold tracking-tight">CSI CREATIVE</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border pt-2 pb-4">
          {navRole === "admin" && <AdminNotifications />}
          <ScrapSummary />
          <p className="text-xs text-sidebar-foreground/40 px-4 pt-3">v1.0 — Control de Proyectos</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar text-sidebar-foreground h-14 flex items-center px-4 justify-between">
        <h1 className="text-sm font-bold">CSI CREATIVE</h1>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="bg-sidebar text-sidebar-foreground w-64 h-full pt-16 p-4 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}