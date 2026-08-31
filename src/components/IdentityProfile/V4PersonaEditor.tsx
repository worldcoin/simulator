import Button from "@/components/Button";
import { Input } from "@/components/Input";
import {
  getIdentityProfile,
  normalizeV4Persona,
  V4_DOCUMENT_TYPE_LABELS,
  V4_DOCUMENT_TYPES,
} from "@/lib/identity-persona";
import type { Identity, V4DocumentType, V4IdentityPersona } from "@/types";
import { useEffect, useId, useMemo, useState } from "react";
import toast from "react-hot-toast";

type Props = {
  identity: Identity | null;
  onSave: (identity: Identity) => void;
};

function personaToForm(persona: V4IdentityPersona) {
  return {
    ...persona,
    age: String(persona.age),
  };
}

export function V4PersonaEditor({ identity, onSave }: Props) {
  const idPrefix = useId();
  const profile = useMemo(
    () => (identity ? getIdentityProfile(identity) : null),
    [identity],
  );
  const [form, setForm] = useState(() =>
    personaToForm(profile?.v4Persona ?? normalizeV4Persona(null)),
  );

  useEffect(() => {
    if (!profile) return;
    setForm(personaToForm(profile.v4Persona));
  }, [profile]);

  if (!identity || !profile) return null;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const save = () => {
    const age = Number(form.age);
    const normalizedPersona = normalizeV4Persona({
      ...form,
      age: form.age.trim() === "" || !Number.isFinite(age) ? undefined : age,
    });

    onSave({
      ...identity,
      profile: {
        ...profile,
        v4Persona: normalizedPersona,
      },
    });
    toast.success("Saved identity persona");
  };

  return (
    <div className="mt-3 rounded-16 bg-gray-50 p-4">
      <div className="mb-4">
        <h3 className="text-s3">Identity Check persona</h3>
        <p className="mt-1 text-b4 text-gray-500">
          Used for v4 Passport and MNC attribute requests.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label
          className="flex flex-col gap-1"
          htmlFor={`${idPrefix}-document-type`}
        >
          <span className="text-b4 text-gray-500">Document type</span>
          <select
            id={`${idPrefix}-document-type`}
            className="h-11 rounded-12 border-2 border-gray-100 bg-white px-3 text-14 outline-none"
            value={form.documentType}
            onChange={(event) =>
              updateField("documentType", event.target.value as V4DocumentType)
            }
          >
            {V4_DOCUMENT_TYPES.map((type) => (
              <option
                key={type}
                value={type}
              >
                {V4_DOCUMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        <label
          className="flex flex-col gap-1"
          htmlFor={`${idPrefix}-document-number`}
        >
          <span className="text-b4 text-gray-500">Document number</span>
          <Input
            id={`${idPrefix}-document-number`}
            value={form.documentNumber}
            placeholder=""
            onChange={(event) =>
              updateField("documentNumber", event.target.value)
            }
          />
        </label>

        <label
          className="flex flex-col gap-1"
          htmlFor={`${idPrefix}-issuing-country`}
        >
          <span className="text-b4 text-gray-500">Issuing country</span>
          <Input
            id={`${idPrefix}-issuing-country`}
            value={form.issuingCountry}
            placeholder=""
            maxLength={3}
            onChange={(event) =>
              updateField("issuingCountry", event.target.value)
            }
          />
        </label>

        <label
          className="flex flex-col gap-1"
          htmlFor={`${idPrefix}-full-name`}
        >
          <span className="text-b4 text-gray-500">Full name</span>
          <Input
            id={`${idPrefix}-full-name`}
            value={form.fullName}
            placeholder=""
            onChange={(event) => updateField("fullName", event.target.value)}
          />
        </label>

        <label
          className="flex flex-col gap-1"
          htmlFor={`${idPrefix}-age`}
        >
          <span className="text-b4 text-gray-500">Age</span>
          <Input
            id={`${idPrefix}-age`}
            type="number"
            min={0}
            value={form.age}
            placeholder=""
            onChange={(event) => updateField("age", event.target.value)}
          />
        </label>

        <label
          className="flex flex-col gap-1"
          htmlFor={`${idPrefix}-nationality`}
        >
          <span className="text-b4 text-gray-500">Nationality</span>
          <Input
            id={`${idPrefix}-nationality`}
            value={form.nationality}
            placeholder=""
            maxLength={3}
            onChange={(event) => updateField("nationality", event.target.value)}
          />
        </label>
      </div>

      <Button
        className="mt-4 h-12 w-full bg-gray-900 font-sora text-15 font-semibold text-white"
        onClick={save}
      >
        Save persona
      </Button>
    </div>
  );
}
