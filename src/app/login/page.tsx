import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-story">
        <Link className="brand" href="/login">
          <span className="brand-mark">
            <ArrowUpRight />
          </span>
          GranaBank
        </Link>
        <div className="story-content">
          <span className="eyebrow">MÁS SIMPLE. MÁS LANÚS.</span>
          <h1>
            Tu plata. <br />
            Tus planes.
            <br />
            <em>Tu próximo paso.</em>
          </h1>
          <p>
            Con toda compra.
            <br />
            Sumá orgullo granate.
          </p>
          <div className="card-art" aria-hidden="true">
            <div className="art-orbit" />
            <div className="bank-card">
              <span>GranaBank</span>
              <div className="chip" />
              <p>•••• &nbsp; •••• &nbsp; •••• &nbsp; 2048</p>
              <small>VOS ELEGÍS EL RUMBO</small>
              <b>VISA</b>
            </div>
            <div className="float-tag">
              <ShieldCheck size={18} /> Siempre con vos
            </div>
          </div>
        </div>
        <footer>
          <span>© {new Date().getFullYear()} GranaBank</span>
        </footer>
      </section>
      <section className="login-form-side">
        <div className="login-top">
          HOME BANKING{" "}
          <span className="secure">
            <ShieldCheck size={14} /> Acceso seguro
          </span>
        </div>
        <div className="login-form-wrap">
          <span className="mini-label">QUÉ BUENO VERTE</span>
          <h2>
            Hola de nuevo<span>.</span>
          </h2>
          <p>Ingresá a tu cuenta y seguí con tus planes.</p>
          <LoginForm />
        </div>
        <div className="login-bottom">
          <ShieldCheck size={17} />
          <p>Nunca compartas tu contraseña ni tus códigos de acceso.</p>
        </div>
      </section>
    </main>
  );
}
