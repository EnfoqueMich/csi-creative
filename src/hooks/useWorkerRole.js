import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Returns the worker's puesto (DISEÑADOR, LIDER, GERENTE) for the current user
// based on matching full_name with Worker.nombre
export function useWorkerRole() {
  const [puesto, setPuesto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const user = await base44.auth.me();
        if (user?.role === "admin") {
          setPuesto("admin");
          setLoading(false);
          return;
        }
        // Match by full_name
        const workers = await base44.entities.Worker.list("nombre");
        const match = workers.find(
          (w) => w.nombre?.trim().toLowerCase() === user?.full_name?.trim().toLowerCase()
        );
        setPuesto(match?.puesto || null);
      } catch {
        setPuesto(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isDesigner = puesto === "DISEÑADOR";
  const isLider = puesto === "LIDER";
  const isGerente = puesto === "GERENTE";
  const isAdmin = puesto === "admin";
  const canFullEdit = isAdmin || isGerente || isLider;

  return { puesto, loading, isDesigner, isLider, isGerente, isAdmin, canFullEdit };
}