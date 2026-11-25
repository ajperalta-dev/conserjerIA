import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function Access() {
  return (
    <main className="gate">
      <h1>Acceso al área privada</h1>
      <AuthForm />
      <Link className="outline" href="/vista-previa">
        Recorrer la vista previa
      </Link>
    </main>
  );
}
