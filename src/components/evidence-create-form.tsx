"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Field, SectionCard, inputClass, textareaClass } from "@/components/ui";
import { evidenceStatusLabels, evidenceTypeLabels } from "@/lib/labels";

type ClientOption = {
  id: string;
  organizationName: string;
};

type IndicatorOption = {
  id: string;
  number: number;
  title: string;
};

type TrainingOption = {
  id: string;
  title: string;
};

function cleanFileName(fileName: string) {
  const baseName = fileName.split(/[\\/]/).pop() || "preuve";
  return baseName.replace(/[^\w.\- ()]/g, "_").slice(0, 140) || "preuve";
}

export function EvidenceCreateForm({
  action,
  clients,
  indicators,
  trainingPrograms,
  defaultClientId,
  useBlobUpload,
  uploadPrefix,
}: {
  action: (formData: FormData) => void | Promise<void>;
  clients: ClientOption[];
  indicators: IndicatorOption[];
  trainingPrograms: TrainingOption[];
  defaultClientId?: string | null;
  useBlobUpload: boolean;
  uploadPrefix: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadedPathnameRef = useRef<HTMLInputElement>(null);
  const uploadedFileNameRef = useRef<HTMLInputElement>(null);
  const uploadedFileMimeTypeRef = useRef<HTMLInputElement>(null);
  const uploadedFileSizeBytesRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!useBlobUpload || uploaded) return;
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    event.preventDefault();
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const safeName = cleanFileName(file.name);
      const pathname = `${uploadPrefix}/${crypto.randomUUID()}-${safeName}`;
      const blob = await upload(pathname, file, {
        access: "private",
        contentType: file.type || "application/octet-stream",
        handleUploadUrl: "/api/blob/evidence",
        multipart: file.size > 4 * 1024 * 1024,
        clientPayload: JSON.stringify({
          fileName: safeName,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });

      if (uploadedPathnameRef.current) uploadedPathnameRef.current.value = blob.pathname;
      if (uploadedFileNameRef.current) uploadedFileNameRef.current.value = safeName;
      if (uploadedFileMimeTypeRef.current) uploadedFileMimeTypeRef.current.value = blob.contentType || file.type || "application/octet-stream";
      if (uploadedFileSizeBytesRef.current) uploadedFileSizeBytesRef.current.value = String(file.size);
      setUploaded(true);
      formRef.current?.requestSubmit();
    } catch (uploadError) {
      setUploading(false);
      setUploaded(false);
      setError(uploadError instanceof Error ? uploadError.message : "Upload de la preuve impossible.");
    }
  }

  return (
    <SectionCard>
      <h2 className="mb-5 font-bold text-slate-900">Ajouter une preuve</h2>
      <form ref={formRef} action={action} onSubmit={handleSubmit} className="grid gap-4">
        <input type="hidden" name="returnTo" value={defaultClientId ? `/app/preuves?clientId=${defaultClientId}` : "/app/preuves"} />
        <input ref={uploadedPathnameRef} type="hidden" name="uploadedBlobPathname" />
        <input ref={uploadedFileNameRef} type="hidden" name="uploadedFileName" />
        <input ref={uploadedFileMimeTypeRef} type="hidden" name="uploadedFileMimeType" />
        <input ref={uploadedFileSizeBytesRef} type="hidden" name="uploadedFileSizeBytes" />

        <Field label="Titre" required>
          <input className={inputClass} name="title" required placeholder="Ex. : Procedure accueil apprenant" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Type">
            <select className={inputClass} name="type" defaultValue="OTHER">
              {Object.entries(evidenceTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut">
            <select className={inputClass} name="status" defaultValue="ACTIVE">
              {Object.entries(evidenceStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {clients.length > 0 ? (
          <Field label="Client cabinet">
            <select className={inputClass} name="clientId" defaultValue={defaultClientId ?? ""}>
              <option value="">Aucun client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.organizationName}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label="Description">
          <textarea className={textareaClass} name="description" placeholder="Description courte, contexte, contenu..." />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Fichier preuve"
            hint={useBlobUpload ? "Upload direct vers Vercel Blob avec progression." : "Stockage local en developpement."}
          >
            <input ref={fileRef} className={inputClass} name={useBlobUpload ? "clientFile" : "file"} type="file" />
          </Field>
          <Field label="URL externe" hint="Drive, SharePoint, URL locale...">
            <input className={inputClass} name="externalUrl" placeholder="https://..." />
          </Field>
        </div>

        {uploading ? (
          <div className="rounded-lg border border-border bg-surface-subtle p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground-muted">
              <span>Upload de la preuve</span>
              <span>{progress} %</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date de validite">
            <input className={inputClass} name="validityDate" type="date" />
          </Field>
          <Field label="Responsable">
            <input className={inputClass} name="responsible" placeholder="Nom du responsable" />
          </Field>
        </div>
        <Field label="Indicateurs lies" hint="Ctrl/Cmd + clic pour selection multiple.">
          <select className={inputClass} name="indicatorIds" multiple size={5}>
            {indicators.map((indicator) => (
              <option key={indicator.id} value={indicator.id}>
                #{indicator.number} {indicator.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Formations liees" hint="Ctrl/Cmd + clic pour selection multiple.">
          <select className={inputClass} name="trainingProgramIds" multiple size={3}>
            {trainingPrograms.map((program) => (
              <option key={program.id} value={program.id}>
                {program.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes internes">
          <textarea className={textareaClass} name="notes" placeholder="Notes de gestion, references, remarques..." />
        </Field>
        <button
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={uploading}
        >
          {uploading ? "Upload en cours..." : "Ajouter la preuve"}
        </button>
      </form>
    </SectionCard>
  );
}
