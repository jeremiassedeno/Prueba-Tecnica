"use client";
import { useState, useSyncExternalStore, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

// Solo se guarda el email, nunca la contraseña, y únicamente en este navegador.
const REMEMBERED_EMAIL = "granabank:email";

function readRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL) ?? "";
  } catch {
    // Sin acceso a localStorage (modo privado, cookies bloqueadas): el formulario arranca vacío.
    return "";
  }
}

function saveRememberedEmail(email: string | null) {
  try {
    if (email) localStorage.setItem(REMEMBERED_EMAIL, email);
    else localStorage.removeItem(REMEMBERED_EMAIL);
  } catch {}
}

// El email guardado solo cambia al iniciar sesión, cuando se sale de esta página.
const subscribe = () => () => {};

export default function LoginForm() {
  const router = useRouter();
  // En el servidor no hay localStorage: el formulario se muestra vacío y se completa al hidratar.
  const rememberedEmail = useSyncExternalStore(subscribe, readRememberedEmail, () => "");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).toLowerCase();
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: data.get("password") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      saveRememberedEmail(data.has("remember") ? email : null);
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
    // La key vuelve a montar el formulario cuando aparece el email guardado tras hidratar.
    <form key={rememberedEmail} onSubmit={submit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        name="email"
        placeholder="vos@ejemplo.com"
        autoComplete="username"
        required
        maxLength={254}
        defaultValue={rememberedEmail}
      />
      <label htmlFor="password">Contraseña</label>
      <div className="password-input">
        <input
          id="password"
          type={visible ? "text" : "password"}
          name="password"
          placeholder="Ingresá tu contraseña"
          autoComplete="current-password"
          required
          maxLength={128}
          autoFocus={Boolean(rememberedEmail)}
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
          name="remember"
          defaultChecked={Boolean(rememberedEmail)}
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
  );
}
