import Link from "next/link";
import { redirect } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { loginAction } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/");

  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-emerald-700 text-white">
            <LifeBuoy size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Mesa de Ayuda</h1>
            <p className="text-sm text-zinc-500">Acceso para usuarios y equipo tecnico</p>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Credenciales invalidas. Revisa el correo y la contrasena.
          </p>
        ) : null}

        <form action={loginAction} className="space-y-4">
          <label className="block text-sm font-medium">
            Correo
            <input
              name="email"
              type="email"
              autoComplete="email"
              defaultValue="admin@demo.com"
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-700"
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Contrasena
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              defaultValue="Demo1234!"
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-700"
              required
            />
          </label>
          <button type="submit" className="h-11 w-full rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">
            Iniciar sesion
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500">
          No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-emerald-800">
            Registrate
          </Link>
        </p>
      </section>
    </main>
  );
}
