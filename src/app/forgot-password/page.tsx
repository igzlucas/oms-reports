"use client"

import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { sendPasswordResetEmail } from "firebase/auth"
import { useAuth } from "@/firebase"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Store,
  LoaderCircle,
  ArrowRight,
  ArrowLeft,
  Mail,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Clock,
  Sparkles,
} from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El servicio no está disponible. Por favor, recarga la página.",
      });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (error) {
      console.error("Error al enviar el correo de recuperación:", error);
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: "No se pudo enviar el correo. Verifica el correo e inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">

      {/* ── LEFT PANEL (decorative) — mirrors login style ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0f0d0b] overflow-hidden flex-col items-center justify-center p-16">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-600/10 blur-[100px]" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-orange-700/8 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-md">
          {/* Brand mark */}


          <h2 className="text-4xl font-black text-white leading-tight tracking-tight mb-6">
            Recupera tu{" "}
            <span className="gradient-text-animated">acceso</span>
          </h2>
          <p className="text-white/40 text-lg leading-relaxed mb-14 font-light">
            Te enviaremos un enlace seguro para que puedas crear una nueva contraseña desde tu correo.
          </p>

          {/* Steps */}
          <div className="space-y-6">
            {[
              {
                icon: Mail,
                step: "01",
                title: "Ingresa tu correo",
                desc: "El mismo con el que te registraste en MiBazar",
              },
              {
                icon: CheckCircle2,
                step: "02",
                title: "Revisa tu bandeja",
                desc: "Recibirás un correo con el enlace de recuperación",
              },
              {
                icon: KeyRound,
                step: "03",
                title: "Crea una nueva contraseña",
                desc: "Sigue el enlace y establece tu nueva contraseña segura",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mb-0.5">
                    Paso {item.step}
                  </p>
                  <p className="text-white/80 text-sm font-semibold leading-tight">{item.title}</p>
                  <p className="text-white/30 text-xs mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Expiry note */}
          <div className="mt-12 flex items-center gap-2 text-white/25 text-xs">
            <Clock className="h-3.5 w-3.5" />
            El enlace de recuperación expira en 1 hora
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-amber-50/30 to-white">
        <div className="w-full max-w-sm">
          {/* Back link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Volver al inicio de sesión
          </Link>

          {!sent ? (
            /* ── FORM STATE ── */
            <>
              <div className="mb-10">
                <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3.5 py-1.5 mb-5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-amber-700 text-xs font-semibold">Recuperación segura</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                  ¿Olvidaste tu contraseña?
                </h1>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                  Ingresa tu correo y te enviaremos un enlace para restablecerla
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 h-12 rounded-2xl border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-400 focus:ring-amber-100 transition-all text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold border-0 shadow-md shadow-amber-200 hover:shadow-lg hover:shadow-amber-200 transition-all duration-200 text-base"
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Enviar Enlace de Recuperación
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-8 text-center text-xs text-gray-300">
                ¿Recordaste tu contraseña?{" "}
                <Link href="/login" className="text-amber-600 hover:text-amber-700 font-semibold transition-colors">
                  Iniciar Sesión
                </Link>
              </p>
            </>
          ) : (
            /* ── SUCCESS STATE ── */
            <div className="text-center">
              {/* Success icon */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>

              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3.5 py-1.5 mb-5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-emerald-700 text-xs font-semibold">Correo enviado</span>
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                ¡Revisa tu correo!
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">
                Enviamos un enlace de recuperación a:
              </p>
              <p className="text-amber-700 font-bold text-sm mb-8 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 break-all">
                {email}
              </p>

              {/* Steps */}
              <div className="space-y-3 text-left mb-10">
                {[
                  "Abre el correo de MiBazar en tu bandeja",
                  "Haz clic en el enlace de recuperación",
                  "Crea tu nueva contraseña segura",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                      <span className="text-amber-700 text-[10px] font-black">{i + 1}</span>
                    </div>
                    <p className="text-gray-500 text-sm">{step}</p>
                  </div>
                ))}
              </div>

              {/* Note */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs text-gray-400 mb-8">
                <Clock className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                El enlace expira en 1 hora. Si no ves el correo, revisa tu carpeta de spam.
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setSent(false)}
                  variant="outline"
                  className="w-full h-11 rounded-2xl border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold transition-all"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar a otro correo
                </Button>
                <Link href="/login">
                  <Button className="w-full h-11 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold border-0 shadow-sm transition-all">
                    Volver al Inicio de Sesión
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
