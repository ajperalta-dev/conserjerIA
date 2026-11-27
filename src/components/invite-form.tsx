"use client";
import { useActionState } from "react";
import { inviteResident } from "@/app/cuenta/invite";
export function InviteForm({
  resident,
}: {
  resident?: {
    id: string;
    email: string;
    organizationId: string;
    consortiumId: string;
  };
} = {}) {
  const [message, action, pending] = useActionState(inviteResident, "");
  return (
    <form className="account-form" action={action}>
      <h2>Invitar residente</h2>
      <p>Requiere permiso de administración en el consorcio y MFA.</p>
      {resident ? (
        <>
          <input type="hidden" name="resident_id" value={resident.id} />
          <input type="hidden" name="email" value={resident.email} />
          <input
            type="hidden"
            name="organization_id"
            value={resident.organizationId}
          />
          <input
            type="hidden"
            name="consortium_id"
            value={resident.consortiumId}
          />
          <p>{resident.email}</p>
        </>
      ) : (
        <>
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
        </>
      )}
      <label>
        Rol
        <select name="role">
          {(resident
            ? ["OWNER", "TENANT"]
            : ["OWNER", "TENANT", "ACCOUNTANT", "BOARD_MEMBER", "MAINTENANCE"]
          ).map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
      </label>
      <button className="primary" disabled={pending}>
        Crear invitación
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
