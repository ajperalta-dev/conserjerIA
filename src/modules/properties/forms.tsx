"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "./actions";
import { saveProperty } from "./actions";
import {
  displayChoice,
  tables,
  type PropertyRow,
  type PropertyTable,
} from "./fields";

type Operation = (state: ActionResult, data: FormData) => Promise<ActionResult>;
export function OperationForm({
  action = saveProperty,
  hidden,
  children,
  submit = "Guardar",
  outline = false,
}: {
  action?: Operation;
  hidden?: Record<string, string>;
  children?: React.ReactNode;
  submit?: string;
  outline?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();
  useEffect(() => {
    if (state.href) router.push(state.href);
  }, [router, state.href]);
  return (
    <form action={formAction} className="property-form">
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      <button className={outline ? "outline" : "primary"} disabled={pending}>
        {pending ? "Guardando…" : submit}
      </button>
      {state.error && (
        <p className="property-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && <p role="status">{state.message}</p>}
    </form>
  );
}
export function RecordForm({
  table,
  entry,
  unitId,
  options,
  editKeys,
}: {
  table: PropertyTable;
  entry?: PropertyRow;
  unitId?: string;
  options: Record<string, { id: string; label: string }[]>;
  editKeys?: string[];
}) {
  const fields = tables[table].fields.filter(
    (spec) => !editKeys || editKeys.includes(spec.key),
  );
  return (
    <OperationForm
      hidden={{
        entity: table,
        operation: "save",
        id: String(entry?.id ?? ""),
        existing: entry ? "yes" : "no",
        unit_id: unitId ?? "",
      }}
    >
      <div className="property-fields">
        {fields.map((spec) => {
          const value = String(entry?.[spec.key] ?? "");
          const choices = spec.relation
            ? (options[spec.relation] ?? [])
            : spec.choices?.map((id) => ({ id, label: displayChoice(id) }));
          return (
            <label key={spec.key}>
              {spec.label}
              {choices ? (
                <select
                  name={spec.key}
                  required={spec.required}
                  defaultValue={value}
                >
                  <option value="">Seleccionar</option>
                  {choices.map((choice) => (
                    <option key={choice.id} value={choice.id}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              ) : spec.input === "textarea" ? (
                <textarea
                  name={spec.key}
                  defaultValue={value}
                  maxLength={4000}
                />
              ) : (
                <input
                  name={spec.key}
                  type={
                    spec.input === "number" ? "text" : (spec.input ?? "text")
                  }
                  inputMode={spec.input === "number" ? "decimal" : undefined}
                  required={spec.required}
                  defaultValue={value}
                />
              )}
            </label>
          );
        })}
      </div>
    </OperationForm>
  );
}
export function Disclosure({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="property-disclosure">
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}
