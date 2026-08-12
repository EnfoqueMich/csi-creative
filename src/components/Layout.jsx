import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderPlus, Menu, X, Users, ClipboardList, FileText, UserCircle2, LogIn, LogOut } from "lucide-react";
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
  { path: "/trabajadores", label: "Trabajadores", icon: Users },
  { path: "/clientes", label: "Clientes", icon: UserCircle2 },
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
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function detectRole() {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user || null);
        // Admin siempre ve todo
        if (!user || user?.role === "admin") { setNavRole("admin"); return; }
        // Cualquier usuario no-admin: buscar en Worker por nombre
        const workers = await base44.entities.Worker.list("nombre");
        const match = workers.find(
          (w) => w.nombre?.trim().toLowerCase() === user?.full_name?.trim().toLowerCase()
        );
        const puesto = match?.puesto;
        if (puesto === "LIDER" || puesto === "GERENTE") {
          setNavRole("lider");
        } else {
          // DISEÑADOR, sin match, o role "worker" → vista de trabajador
          setNavRole("worker");
        }
      } catch {
        // En caso de error, asumir admin para no bloquear acceso
        setCurrentUser(null);
        setNavRole("admin");
      }
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
          <div className="px-3 pt-2">
            {currentUser ? (
              <button
                onClick={() => base44.auth.logout(window.location.href)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
              >
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            ) : (
              <button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-sidebar-accent text-sidebar-accent-foreground hover:opacity-90 transition-all"
              >
                <LogIn className="w-4 h-4" /> Iniciar sesión como admin
              </button>
            )}
          </div>
          <p className="text-xs text-sidebar-foreground/40 px-4 pt-3">v1.0 — Control de Proyectos</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar text-sidebar-foreground h-14 flex items-center px-4 justify-between">
        <h1 className="text-sm font-bold">CSI CREATIVE</h1>
        <div className="flex items-center gap-1">
          {currentUser ? (
            <button onClick={() => base44.auth.logout(window.location.href)} className="p-2" title="Cerrar sesión">
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="p-2" title="Iniciar sesión como admin">
              <LogIn className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
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
        <div className="p-4 md:p-8 mx-auto" style={{ maxWidth: '1400px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}