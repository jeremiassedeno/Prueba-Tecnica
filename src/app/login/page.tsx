"use client";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Solo se guarda el email, nunca la contraseña, y únicamente en este navegador.
const REMEMBERED_EMAIL = "granabank:email";

export default function Login() {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBERED_EMAIL);
      if (!saved) return;
      setEmail(saved);
      setRemember(true);
      passwordRef.current?.focus();
    } catch {
      // Sin acceso a localStorage (modo privado, cookies bloqueadas): el formulario arranca vacío.
    }
  }, []);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const password = new FormData(event.currentTarget).get("password");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      try {
        if (remember) localStorage.setItem(REMEMBERED_EMAIL, email.trim().toLowerCase());
        else localStorage.removeItem(REMEMBERED_EMAIL);
      } catch {}
      router.push("/inicio");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos conectarnos. Intentá nuevamente.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <a className="brand" href="/login">
          <span className="brand-mark">
            <ArrowUpRight />
          </span>
          GranaBank
        </a>
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
            Suma orgulloso granate.
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
          <form onSubmit={submit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="vos@ejemplo.com"
              autoComplete="username"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="password">Contraseña</label>
            <div className="password-input">
              <input
                ref={passwordRef}
                id="password"
                type={visible ? "text" : "password"}
                name="password"
                placeholder="Ingresá tu contraseña"
                autoComplete="current-password"
                required
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {visible ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            <label className="remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Recuérdame
            </label>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <button className="primary login-submit" disabled={pending}>
              {pending ? (
                <>
                  <LoaderCircle className="spin" size={18} /> Ingresando...
                </>
              ) : (
                <>
                  Ingresar a mi cuenta <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>
        </div>
        <div className="login-bottom">
          <ShieldCheck size={17} />
          <p>Nunca compartas tu contraseña ni tus códigos de acceso.</p>
        </div>
      </section>
    </main>
  );
}
