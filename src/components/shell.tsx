"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  LayoutDashboard,
  ArrowLeftRight,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/inicio", label: "Inicio", Icon: LayoutDashboard },
  { href: "/movimientos", label: "Movimientos", Icon: ArrowLeftRight },
];

export default function Shell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const isActive = (href: string) => path === href || path.startsWith(href + "/");
  const [error, setError] = useState("");
  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.push("/login");
      router.refresh();
    } catch {
      setError("No pudimos cerrar sesión. Reintentá.");
    }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/inicio">
          <span className="brand-mark">
            <ArrowUpRight />
          </span>
          GranaBank
        </Link>
        <span className="nav-caption">MI ESPACIO</span>
        <nav>
          {links.map(({ href, label, Icon }) => (
            <Link
              key={href}
              className={isActive(href) ? "active" : ""}
              aria-current={isActive(href) ? "page" : undefined}
              href={href}
            >
              <Icon size={20} /> {label} <ChevronRight size={15} />
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-message">
            <div className="little-flower" aria-hidden="true">
              ✳
            </div>
            <strong>
              Lo que viene,
              <br />
              lo hacés vos.
            </strong>
            <p>Nosotros te acompañamos.</p>
          </div>
          <div className="sidebar-security">
            <ShieldCheck size={16} /> Entorno de demostración
          </div>
          <button className="logout" onClick={logout}>
            <LogOut size={18} /> Cerrar sesión
          </button>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <span>
            Personas <ChevronRight size={13} />
            <strong>Home banking</strong>
          </span>
          <div className="user-badge">
            <span className="online-dot" /> Mi cuenta{" "}
            <div className="avatar">
              {name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </div>
          </div>
        </header>
        {children}
        <footer className="app-footer">
          <span>
            GranaBank <span>Tu banco, a tu ritmo.</span>
          </span>
          <span>Proyecto de demostración · Sin dinero real</span>
        </footer>
      </div>
    </div>
  );
}
