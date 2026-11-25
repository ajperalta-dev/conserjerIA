"use client";
import { useActionState } from "react";
import { inviteResident } from "@/app/cuenta/invite";
export function InviteForm() {
  const [message, action, pending] = useActionState(inviteResident, "");
  return (
    <form className="account-form" action={action}>
      <h2>Invitar residente</h2>
      <p>Requiere permiso de administración en el consorcio y MFA.</p>
      <label>
        Organización (UUID)
        <input name="organization_id" required />
      </label>
      <label>
        Consorcio (UUID)
        <input name="consortium_id" required />
      </label>
      <label>
        Email
        <input name="email" type="email" required />
      </label>
      <label>
        Rol
        <select name="role">
          {["OWNER", "TENANT", "ACCOUNTANT", "BOARD_MEMBER", "MAINTENANCE"].map(
            (role) => (
              <option key={role}>{role}</option>
            ),
          )}
        </select>
      </label>
      <button className="primary" disabled={pending}>
        Crear invitación
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
