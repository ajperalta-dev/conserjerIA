"use client";
import { useActionState } from "react";
import { saveAccount, acceptInvitation } from "@/app/cuenta/actions";
export function AccountForm({ name }: { name: string }) {
  const [message, action, pending] = useActionState(saveAccount, "");
  const [inviteMessage, inviteAction, invitePending] = useActionState(
    acceptInvitation,
    "",
  );
  return (
    <>
      <form action={action} className="account-form">
        <label>
          Nombre
          <input name="name" defaultValue={name} maxLength={120} />
        </label>
        <label>
          Nueva contraseña
          <input
            name="password"
            type="password"
            minLength={12}
            autoComplete="new-password"
          />
        </label>
        <button disabled={pending} className="primary">
          Guardar
        </button>
        <p role="status">{message}</p>
      </form>
      <form action={inviteAction} className="account-form">
        <label>
          Código de invitación
          <input name="invitation" required />
        </label>
        <button disabled={invitePending} className="outline">
          Aceptar invitación
        </button>
        <p role="status">{inviteMessage}</p>
      </form>
    </>
  );
}
