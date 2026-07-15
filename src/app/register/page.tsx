import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { registerAction } from "@/app/actions";
import { getSessionUser } from "@/lib/auth";

export default async function RegisterPage({
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
            <UserPlus size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Crear cuenta</h1>
            <p className="text-sm text-zinc-500">Rol usuario por defecto</p>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error === "exists" ? "Ese correo ya esta registrado." : "Revisa nombre, correo y contrasena."}
          </p>
        ) : null}

        <form action={registerAction} className="space-y-4">
          <label className="block text-sm font-medium">
            Nombre
            <input name="name" autoComplete="name" className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm" required />
          </label>
          <label className="block text-sm font-medium">
            Correo
            <input name="email" type="email" autoComplete="email" className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm" required />
          </label>
          <label className="block text-sm font-medium">
            Contrasena
            <input name="password" type="password" minLength={8} autoComplete="new-password" className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm" required />
          </label>
          <button type="submit" className="h-11 w-full rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">
            Crear cuenta
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-emerald-800">
            Inicia sesion
          </Link>
        </p>
      </section>
    </main>
  );
}
