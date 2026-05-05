"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  signInWithEmailAndPassword, AuthError, GoogleAuthProvider,
  signInWithPopup, getAdditionalUserInfo, User
} from "firebase/auth"
import { useFirebase, useUser, setDocumentNonBlocking } from "@/firebase"
import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { doc, getDoc, setDoc } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoaderCircle, ArrowRight, ShieldCheck, Star, Store, Sparkles } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px" {...props}>
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.651-3.356-11.303-8H24v-8H42v8H43.611c.138-1.25.25-2.503.25-3.764C43.862,21.35,44,22.659,44,24c0,11.045-8.955,20-20,20Z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,35.091,44,29.861,44,24c0-1.341-0.138-2.65-0.389-3.917Z" />
  </svg>
);

const authorizedSellers = ["isaac.glucas@outlook.com", "grlpwrbazarmx@gmail.com"];

const trustFeatures = [
  { icon: ShieldCheck, text: "Transacciones seguras y protegidas" },
  { icon: Star, text: "Vendedores verificados con reputación" },
  { icon: Store, text: "Miles de productos únicos locales" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { firestore, auth } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const handleLoginSuccess = useCallback(async (loggedInUser: User) => {
    if (!firestore || !loggedInUser) return;
    const userDocRef = doc(firestore, 'users', loggedInUser.uid);
    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        router.push(userDoc.data().role === 'seller' ? '/dashboard' : '/catalogo');
      } else {
        const isSeller = authorizedSellers.includes(loggedInUser.email ?? '');
        const userData = {
          id: loggedInUser.uid, email: loggedInUser.email,
          displayName: loggedInUser.displayName ?? (isSeller ? 'Vendedor' : 'Comprador'),
          role: isSeller ? 'seller' : 'buyer', favorites: [], favoriteStores: [], storeId: '',
        };
        await setDoc(userDocRef, userData);
        router.push(isSeller ? '/dashboard' : '/catalogo');
      }
    } catch (e) {
      console.error("Error fetching user role", e);
      router.push('/catalogo');
    }
  }, [firestore, router]);

  useEffect(() => {
    if (!isUserLoading && user) { handleLoginSuccess(user); return; }
    if (!isUserLoading && !user) { setIsLoading(false); }
  }, [user, isUserLoading, handleLoginSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) { toast({ variant: "destructive", title: "Error", description: "Servicio no disponible." }); return; }
    setIsLoading(true);
    if (!authorizedSellers.includes(email)) {
      toast({ variant: "destructive", title: "Acceso Denegado", description: "Este correo no está autorizado como vendedor." });
      setIsLoading(false); return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const authError = error as AuthError;
      const description = ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(authError.code)
        ? "Credenciales inválidas. Revisa tu correo y contraseña."
        : "Ocurrió un error desconocido.";
      toast({ variant: "destructive", title: "Inicio de Sesión Fallido", description });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) { toast({ variant: "destructive", title: "Error", description: "Servicio no disponible." }); return; }
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);
      if (additionalInfo?.isNewUser) {
        const userDocRef = doc(firestore, 'users', result.user.uid);
        setDocumentNonBlocking(userDocRef, {
          id: result.user.uid, email: result.user.email, displayName: result.user.displayName,
          role: 'buyer', favorites: [], favoriteStores: []
        }, { merge: true });
      }
    } catch (error) {
      const authError = error as AuthError;
      const description = authError.code === 'auth/unauthorized-domain'
        ? 'Dominio no autorizado. Contacta al administrador.'
        : authError.code === 'auth/popup-closed-by-user'
          ? 'La ventana fue cerrada. Inténtalo de nuevo.'
          : 'Ocurrió un error desconocido.';
      toast({ variant: "destructive", title: "Error con Google", description });
    } finally { setIsLoading(false); }
  };

  if (isLoading || isUserLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0f0d0b]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <LoaderCircle className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-white/40 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full">

      {/* ── LEFT PANEL (decorative) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0f0d0b] overflow-hidden flex-col items-center justify-center p-16">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-600/10 blur-[100px]" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-orange-700/8 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)",
              backgroundSize: "56px 56px"
            }}
          />
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-black text-white leading-tight tracking-tight mb-6">
            Tu mercado local,{" "}
            <span className="gradient-text-animated">en línea</span>
          </h2>
          <p className="text-white/40 text-lg leading-relaxed mb-14 font-light">
            La plataforma que conecta compradores y vendedores de toda la república mexicana.
          </p>

          {/* Trust features */}
          <div className="space-y-5">
            {trustFeatures.map((feature) => (
              <div key={feature.text} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <feature.icon className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-white/60 text-sm font-medium">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4">
            {[
              { value: "10K+", label: "Productos" },
              { value: "5K+", label: "Vendedores" },
              { value: "4.9★", label: "Calificación" },
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-2xl bg-white/4 border border-white/8">
                <p className="text-amber-400 font-black text-lg">{s.value}</p>
                <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-amber-50/30 to-white">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3.5 py-1.5 mb-5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-amber-700 text-xs font-semibold">Acceso seguro</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight font-headline">Bienvenido de vuelta</h1>
            <p className="text-gray-400 mt-2 text-sm">Inicia sesión para gestionar tu tienda o explorar el catálogo</p>
          </div>

          {/* Seller form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="vendedor@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11 rounded-2xl border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-400 focus:ring-amber-100 transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Contraseña</Label>
                <Link href="/forgot-password" className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 rounded-2xl border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-400 focus:ring-amber-100 transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold border-0 shadow-md shadow-amber-200 hover:shadow-lg hover:shadow-amber-200 transition-all duration-200 text-base mt-2"
            >
              {isLoading
                ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                : <ArrowRight className="mr-2 h-4 w-4" />
              }
              Iniciar Sesión como Vendedor
            </Button>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-gray-400 text-xs font-medium">¿Eres comprador?</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Google sign in */}
          <div className="space-y-3">
            <p className="text-center text-xs text-gray-400">
              Crea una cuenta o inicia sesión con Google para guardar favoritos y hacer pedidos
            </p>
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold shadow-sm transition-all duration-200 gap-3"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <GoogleIcon />
              Continuar con Google
            </Button>
          </div>

          <p className="mt-8 text-center text-xs text-gray-300">
            Al continuar, aceptas nuestros{" "}
            <Link href="#" className="underline hover:text-gray-500">Términos de servicio</Link>
            {" "}y{" "}
            <Link href="#" className="underline hover:text-gray-500">Política de privacidad</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
