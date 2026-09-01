import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  X,
  Check,
  Trash2,
  FileCheck2,
  Plus,
  Pencil,
  ArrowLeft,
  RefreshCw,
  Save,
} from "lucide-react";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { storage } from "@/services/lib/storage";

const labelClass = "mb-1 block text-sm font-medium text-foreground";
const DRAFT_KEY = "addBusinessDocsFormValues";

// Mapping of docType to allowed orientation values.
const orientationOptions = {
  business: ["document"],
  "tax certificate": ["document"],
  "registration certificate": ["document"],
  "ghana card": ["front", "back"],
};

const validateStoredData = (data, expectedKeys) => {
  if (!data || typeof data !== "object") return false;
  return expectedKeys.every((key) =>
    Object.prototype.hasOwnProperty.call(data, key),
  );
};

export default function AddBusinessDocs() {
  const { authAxios, companyId, transporterId, jobTitle } = useAuth();
  const [entityId, setEntityId] = useState(null);
  const [entityType, setEntityType] = useState(null); // "company" or "transporter"
  const [documents, setDocuments] = useState([]);
  const [viewMode, setViewMode] = useState("list"); // "list", "add", "edit"
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docType, setDocType] = useState("");
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [orientations, setOrientations] = useState([]);
  const [names, setNames] = useState([]);
  const [removedFileIds, setRemovedFileIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState(null);
  const [deleteDocType, setDeleteDocType] = useState("");

  // Load form data from storage on mount.
  useEffect(() => {
    const parsedValues = storage.getJSON(DRAFT_KEY);
    if (
      parsedValues &&
      validateStoredData(parsedValues, [
        "docType",
        "viewMode",
        "orientations",
        "names",
        "filePreviews",
      ])
    ) {
      setDocType(parsedValues.docType);
      setViewMode(parsedValues.viewMode);
      setOrientations(parsedValues.orientations);
      setNames(parsedValues.names);
      setFilePreviews(parsedValues.filePreviews.map(() => null));
      toast.info("Form data restored from previous session.");
    }
  }, []);

  useEffect(() => {
    if (jobTitle === "logistics manager") {
      setEntityType("transporter");
      setEntityId(transporterId);
    } else if (["lead buyer", "sales manager"].includes(jobTitle) && companyId) {
      setEntityType("company");
      setEntityId(companyId);
    } else {
      toast.error("No associated company or transporter found");
      setLoading(false);
    }
  }, [jobTitle, transporterId, companyId]);

  useEffect(() => {
    if (entityId && entityType) {
      (async () => {
        try {
          const endpoint = `${
            entityType === "company" ? "companies" : `${entityType}s`
          }/${entityId}/add-business-docs/`;
          let newDocs = [];
          try {
            const docsResponse = await authAxios.get(endpoint);
            newDocs = (
              entityType === "transporter"
                ? docsResponse.data.id_docs || []
                : docsResponse.data.biz_docs || []
            ).slice();
          } catch (err) {
            if (err.response?.status === 404) {
              newDocs = [];
            } else {
              toast.error(
                "Failed to load business documents: " +
                  (err.response?.statusText || err.message),
              );
              console.error("Fetch error:", err);
            }
          }
          setDocuments(newDocs);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [authAxios, entityId, entityType]);

  const persist = (patch) => {
    storage.setJSON(DRAFT_KEY, {
      docType,
      viewMode,
      orientations,
      names,
      filePreviews: filePreviews.map((p) => p || null),
      ...patch,
    });
  };

  const handleDocTypeChange = (value) => {
    setDocType(value);
    const newOrientations = filePreviews.map(() =>
      orientationOptions[value]?.includes("document") ? "document" : "front",
    );
    setOrientations(newOrientations);
    persist({ docType: value, orientations: newOrientations });
  };

  const handleOrientationChange = (index, value) => {
    const allowedOrientations = orientationOptions[docType] || ["front", "back"];
    if (allowedOrientations.includes(value)) {
      setOrientations((prev) => {
        const newOrientations = [...prev];
        newOrientations[index] = value;
        persist({ orientations: newOrientations });
        return newOrientations;
      });
    }
  };

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be under 2MB");
        return;
      }
      if (
        !["image/jpeg", "image/png", "application/pdf"].includes(file.type)
      ) {
        toast.error("Only JPG, PNG, or PDF formats are accepted");
        return;
      }
      setFiles((prev) => {
        const newFiles = [...prev];
        newFiles[index] = file;
        return newFiles;
      });
      setFilePreviews((prev) => {
        const newPreviews = [...prev];
        newPreviews[index] =
          file.type === "application/pdf" ? null : URL.createObjectURL(file);
        persist({ filePreviews: newPreviews.map((p) => p || null) });
        return newPreviews;
      });
    }
  };

  const handleNameChange = (index, value) => {
    setNames((prev) => {
      const newNames = [...prev];
      newNames[index] = value;
      persist({ names: newNames });
      return newNames;
    });
  };

  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    setDocType(doc.doc_type);
    setFilePreviews(doc.upload_files.map((file) => file.file));
    const allowedOrientations = orientationOptions[doc.doc_type] || [
      "front",
      "back",
    ];
    const nextOrientations = doc.upload_files.map((file) =>
      allowedOrientations.includes("document")
        ? "document"
        : allowedOrientations.includes(file.orientation)
          ? file.orientation
          : "front",
    );
    const nextNames = doc.upload_files.map((file) => file.name || "");
    setOrientations(nextOrientations);
    setNames(nextNames);
    setFiles([]);
    setRemovedFileIds([]);
    setViewMode("edit");
    storage.setJSON(DRAFT_KEY, {
      docType: doc.doc_type,
      viewMode: "edit",
      orientations: nextOrientations,
      names: nextNames,
      filePreviews: doc.upload_files.map((file) => file.file),
    });
  };

  const addFileInput = () => {
    const nextOrientation = orientationOptions[docType]?.includes("document")
      ? "document"
      : "front";
    setFilePreviews((prev) => [...prev, null]);
    setOrientations((prev) => [...prev, nextOrientation]);
    setNames((prev) => [...prev, ""]);
    persist({
      orientations: [...orientations, nextOrientation],
      names: [...names, ""],
      filePreviews: [...filePreviews, null],
    });
  };

  const removeFile = (index) => {
    if (viewMode === "edit" && index < selectedDoc.upload_files.length) {
      setRemovedFileIds((prev) => [...prev, selectedDoc.upload_files[index].id]);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      persist({
        orientations: orientations.filter((_, i) => i !== index),
        names: names.filter((_, i) => i !== index),
        filePreviews: newPreviews.map((p) => p || null),
      });
      return newPreviews;
    });
    setOrientations((prev) => prev.filter((_, i) => i !== index));
    setNames((prev) => prev.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    setDocType("");
    setViewMode("list");
    setSelectedDoc(null);
    setFiles([]);
    setFilePreviews([]);
    setOrientations([]);
    setNames([]);
    setRemovedFileIds([]);
  };

  const handleReset = () => {
    clearForm();
    storage.remove(DRAFT_KEY);
    toast.success("Form reset successfully.");
  };

  const startAdd = () => {
    setViewMode("add");
    setDocType("business");
    setFilePreviews([null]);
    setOrientations(["document"]);
    setNames([""]);
    storage.setJSON(DRAFT_KEY, {
      docType: "business",
      viewMode: "add",
      orientations: ["document"],
      names: [""],
      filePreviews: [null],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isBusinessDoc = [
        "business",
        "tax certificate",
        "registration certificate",
      ].includes(docType);
      for (let i = 0; i < orientations.length; i++) {
        if (isBusinessDoc && orientations[i] !== "document") {
          toast.error(
            `${docType.toUpperCase()} documents must have 'document' orientation`,
          );
          setSubmitting(false);
          return;
        }
        if (
          docType === "ghana card" &&
          !["front", "back"].includes(orientations[i])
        ) {
          toast.error("Ghana Card must have 'front' or 'back' orientation");
          setSubmitting(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append("doc_type", docType);
      let hasFiles = false;

      if (viewMode === "edit") {
        selectedDoc.upload_files.forEach((file, index) => {
          if (!removedFileIds.includes(file.id) && filePreviews[index]) {
            formData.append(`upload_files[${index}][id]`, file.id);
            formData.append(
              `upload_files[${index}][orientation]`,
              isBusinessDoc ? "document" : orientations[index],
            );
            formData.append(`upload_files[${index}][name]`, names[index] || "");
            hasFiles = true;
          }
        });
      }

      files.forEach((file, index) => {
        const fileIndex =
          viewMode === "edit"
            ? selectedDoc.upload_files.length + index
            : index;
        formData.append(`upload_files[${fileIndex}][file]`, file);
        formData.append(
          `upload_files[${fileIndex}][orientation]`,
          isBusinessDoc ? "document" : orientations[index],
        );
        if (names[index]) {
          formData.append(`upload_files[${fileIndex}][name]`, names[index]);
        }
        hasFiles = true;
      });

      if (!hasFiles) {
        toast.error("At least one file is required");
        setSubmitting(false);
        return;
      }

      const endpoint = `${
        entityType === "company" ? "companies" : `${entityType}s`
      }/${entityId}/add-business-docs/`;
      if (viewMode === "add") {
        await authAxios.post(endpoint, formData);
        toast.success("Business document added successfully!");
      } else {
        await authAxios.patch(
          `verification-documents/${selectedDoc.id}/`,
          formData,
        );
        toast.success("Business document updated successfully!");
      }

      let newDocs = [];
      try {
        const { data } = await authAxios.get(endpoint);
        newDocs = (
          entityType === "company" ? data.biz_docs || [] : data.id_docs || []
        ).slice();
      } catch (err) {
        if (err.response?.status === 404) {
          newDocs = [];
        } else {
          throw err;
        }
      }
      setDocuments(newDocs);
      clearForm();
      storage.remove(DRAFT_KEY);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(
        err.response?.data?.orientation?.[0] ||
          err.response?.data?.upload_files?.[0]?.file?.[0] ||
          err.response?.data?.doc_type?.[0] ||
          err.response?.data?.non_field_errors?.[0] ||
          err.response?.data?.detail ||
          "Operation failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (docId) => {
    setSubmitting(true);
    try {
      await authAxios.delete(`verification-documents/${docId}/`);
      toast.success("Business document deleted successfully!");
      const endpoint = `${
        entityType === "company" ? "companies" : `${entityType}s`
      }/${entityId}/add-business-docs/?t=${new Date().getTime()}`;
      let newDocs = [];
      try {
        const { data } = await authAxios.get(endpoint);
        newDocs = (
          entityType === "company" ? data.biz_docs || [] : data.id_docs || []
        ).slice();
      } catch (err) {
        if (err.response?.status === 404) {
          newDocs = [];
        } else {
          throw err;
        }
      }
      setDocuments(newDocs);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.detail || "Deletion failed");
    } finally {
      setSubmitting(false);
      setIsModalOpen(false);
    }
  };

  const openDeleteModal = (docId, type) => {
    setDeleteDocId(docId);
    setDeleteDocType(type);
    setIsModalOpen(true);
  };

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => {
        if (preview && preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [filePreviews]);

  if (loading || !entityId || !entityType) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const isGhanaCard = docType === "ghana card";

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <FileCheck2 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold">
                Business documents
              </h1>
              <p className="mt-1 text-sm text-white/85">
                Manage verification documents for your{" "}
                {entityType === "company" ? "company" : "transporter"}.
              </p>
            </div>
          </div>
          {viewMode === "list" && (
            <Button
              onClick={startAdd}
              className="bg-white text-brand hover:bg-white/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add document
            </Button>
          )}
          {viewMode !== "list" && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to list
            </Button>
          )}
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card p-6">
          <h2 className="mb-4 font-display text-base font-semibold">
            Uploaded documents
          </h2>
          {documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
                <FileCheck2 className="h-6 w-6 text-brand" />
              </div>
              <p className="font-medium">No business documents yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your verification documents to complete your profile.
              </p>
              <Button
                className="mt-5 bg-brand-gradient text-brand-foreground hover:opacity-90"
                onClick={startAdd}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add document
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <FileCheck2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium capitalize">{doc.doc_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.upload_files
                          .map((f) => f.name || "Unnamed")
                          .join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectDoc(doc)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                    <button
                      type="button"
                      onClick={() => openDeleteModal(doc.id, doc.doc_type)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      disabled={submitting}
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-border/70 bg-card p-6"
        >
          <h2 className="font-display text-base font-semibold">
            {viewMode === "add" ? "Add business document" : "Edit business document"}
          </h2>

          {/* Document Type */}
          <div className="max-w-sm">
            <label className={labelClass}>
              Document type <span className="text-destructive">*</span>
            </label>
            <Select value={docType} onValueChange={handleDocTypeChange}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select a document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="ghana card">Ghana Card</SelectItem>
                <SelectItem value="tax certificate">Tax Certificate</SelectItem>
                <SelectItem value="registration certificate">
                  Registration Certificate
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Guidelines */}
          <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
            <h4 className="mb-3 text-sm font-semibold">Upload guidelines</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-emerald-500" /> Files must
                be under 2MB
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-emerald-500" /> Acceptable
                formats: JPG, PNG, PDF
              </li>
              {orientationOptions[docType]?.includes("document") && (
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-500" /> This
                  document uses &lsquo;document&rsquo; orientation
                </li>
              )}
            </ul>
          </div>

          {/* File uploads */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Upload files</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {filePreviews.map((preview, index) => (
                <div key={index} className="space-y-2">
                  <label className={labelClass}>File {index + 1}</label>
                  <div className="flex items-center gap-2">
                    <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/70 bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                      {preview ? (
                        preview.includes(".pdf") ? (
                          <span className="text-sm text-muted-foreground">
                            PDF file
                          </span>
                        ) : (
                          <img
                            src={preview}
                            alt={`File preview ${index + 1}`}
                            className="h-20 w-20 object-contain"
                          />
                        )
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Click to upload
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        name={`file_${index}`}
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleFileChange(e, index)}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Remove file"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  {isGhanaCard && (
                    <div>
                      <label className={labelClass}>
                        Orientation <span className="text-destructive">*</span>
                      </label>
                      <Select
                        value={orientations[index] || "front"}
                        onValueChange={(v) => handleOrientationChange(index, v)}
                      >
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orientationOptions[docType].map((option) => (
                            <SelectItem key={option} value={option}>
                              {option.charAt(0).toUpperCase() + option.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Name (optional)</label>
                    <Input
                      value={names[index] || ""}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      placeholder="Enter file name"
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addFileInput}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add file
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={submitting}
            >
              <RefreshCw className="mr-1.5 h-4 w-4" /> Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearForm}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                !docType ||
                (!files.length &&
                  viewMode === "edit" &&
                  removedFileIds.length === selectedDoc?.upload_files.length)
              }
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save changes
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => handleDelete(deleteDocId)}
        docType={deleteDocType}
        docId={deleteDocId}
      />
    </div>
  );
}
