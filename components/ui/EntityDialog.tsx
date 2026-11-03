"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  Dialog,
  Button,
  Input,
  Textarea,
  Select,
  Label,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/components/LanguageProvider";

export type FieldDef = {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "date"
    | "datetime-local"
    | "number"
    | "select"
    | "checkbox";
  options?: { value: string; label: string }[];
  required?: boolean;
};

type Values = Record<string, string | number | boolean | null>;

export function EntityDialog({
  title,
  trigger,
  action,
  fields,
  values,
  onDelete,
  submitLabel,
  triggerClassName = "text-left",
  hiddenValues,
  extra,
}: {
  title: string;
  trigger: ReactNode;
  action: (fd: FormData) => void | Promise<void>;
  fields: FieldDef[];
  values?: Values;
  onDelete?: (id: number) => void | Promise<void>;
  submitLabel?: string;
  triggerClassName?: string;
  hiddenValues?: Record<string, string | number>;
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const { t } = useLanguage();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      await action(fd);
      setOpen(false);
      toast(t("common.saved"));
    });
  };

  const onDeleteClick = () => {
    if (values?.id == null) return;
    start(async () => {
      await onDelete?.(Number(values.id));
      setOpen(false);
      toast(t("common.deleted"));
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title}>
        <form onSubmit={onSubmit} className="space-y-3">
          {values?.id != null && (
            <input type="hidden" name="id" value={String(values.id)} />
          )}
          {hiddenValues &&
            Object.entries(hiddenValues).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={String(v)} />
            ))}
          {extra}
          {fields.map((f) => (
            <FieldRenderer key={f.name} field={f} value={values?.[f.name]} />
          ))}
          <div className="flex items-center justify-between pt-2">
            <div>
              {onDelete && values?.id != null && (
                <Button
                  type="button"
                  variant="danger"
                  disabled={pending}
                  onClick={onDeleteClick}
                >
                  {t("common.delete")}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {submitLabel ?? t("common.save")}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function FieldRenderer({
  field,
  value,
}: {
  field: FieldDef;
  value?: string | number | boolean | null;
}) {
  const id = field.name;

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" name={field.name} defaultChecked={!!value} />
        {field.label}
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <Label htmlFor={id}>{field.label}</Label>
        <Textarea
          id={id}
          name={field.name}
          defaultValue={value != null ? String(value) : ""}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        <Label htmlFor={id}>{field.label}</Label>
        <Select
          id={id}
          name={field.name}
          defaultValue={value != null ? String(value) : ""}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={id}>{field.label}</Label>
      <Input
        id={id}
        name={field.name}
        type={field.type ?? "text"}
        defaultValue={value != null ? String(value) : ""}
        required={field.required}
      />
    </div>
  );
}
