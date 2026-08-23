import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Upload, X, Check, Trash2 } from "lucide-react";
import { getCookie } from "@/utility/getCookie";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

export default function ManageUserVerificationDocs() {
  const { authAxios } = useAuth();
  const [userId, setUserId] = useState(null);
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

  // Fetch user ID and documents
  useEffect(() => {
    (async () => {
      try {
        const userResponse = await authAxios.get("users/");
        const user = userResponse.data.results[0];
        setUserId(user.id);

        let newDocs = [];
        try {
          const docsResponse = await authAxios.get(`users/${user.id}/add-id-docs/`);
          console.log("Fetched documents:", docsResponse.data);
          newDocs = (docsResponse.data.id_docs || []).slice();
        } catch (err) {
          if (err.response?.status === 404) {
            console.log("No documents found, setting empty list");
            newDocs = [];
          } else {
            throw err;
          }
        }
        setDocuments(newDocs);
      } catch (err) {
        toast.error("Failed to load data");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authAxios]);

  // Handle selecting a document for editing
  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    setDocType(doc.doc_type);
    setFilePreviews(doc.upload_files.map(file => file.file));
    setOrientations(doc.upload_files.map(file => file.orientation));
    setNames(doc.upload_files.map(file => file.name || ""));
    setFiles([]);
    setRemovedFileIds([]);
    setViewMode("edit");
  };

  // Handle file input changes
  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be under 2MB");
        return;
      }
      if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
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
        newPreviews[index] = file.type === "application/pdf" ? null : URL.createObjectURL(file);
        return newPreviews;
      });
    }
  };

  // Handle orientation change
  const handleOrientationChange = (index, value) => {
    setOrientations((prev) => {
      const newOrientations = [...prev];
      newOrientations[index] = value;
      return newOrientations;
    });
  };

  // Handle name change
  const handleNameChange = (index, value) => {
    setNames((prev) => {
      const newNames = [...prev];
      newNames[index] = value;
      return newNames;
    });
  };

  // Add a new file input
  const addFileInput = () => {
    setFilePreviews((prev) => [...prev, null]);
    setOrientations((prev) => [...prev, "front"]);
    setNames((prev) => [...prev, ""]);
  };

  // Remove a file
  const removeFile = (index) => {
    if (viewMode === "edit" && index < selectedDoc.upload_files.length) {
      setRemovedFileIds((prev) => [...prev, selectedDoc.upload_files[index].id]);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    setOrientations((prev) => prev.filter((_, i) => i !== index));
    setNames((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission (add or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const csrfToken = getCookie("csrftoken");
      const formData = new FormData();
      formData.append("doc_type", docType);

      let hasFiles = false;

      // For edit mode, include existing files unless removed
      if (viewMode === "edit") {
        selectedDoc.upload_files.forEach((file, index) => {
          if (!removedFileIds.includes(file.id) && filePreviews[index]) {
            formData.append(`upload_files[${index}][id]`, file.id);
            formData.append(`upload_files[${index}][orientation]`, orientations[index]);
            formData.append(`upload_files[${index}][name]`, names[index] || "");
            hasFiles = true;
          }
        });
      }

      // Add new files
      files.forEach((file, index) => {
        const fileIndex = viewMode === "edit" ? selectedDoc.upload_files.length + index : index;
        formData.append(`upload_files[${fileIndex}][file]`, file);
        formData.append(`upload_files[${fileIndex}][orientation]`, orientations[index]);
        if (names[index]) {
          formData.append(`upload_files[${fileIndex}][name]`, names[index]);
        }
        hasFiles = true;
      });

      // Validate that at least one file is included
      if (!hasFiles) {
        toast.error("At least one file is required");
        setSubmitting(false);
        return;
      }

      // Log FormData for debugging
      console.log([...formData.entries()]);

      if (viewMode === "add") {
        await authAxios.post(`users/${userId}/add-id-docs/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRFToken": csrfToken,
          },
        });
        toast.success("Document added successfully!");
      } else {
        await authAxios.patch(`verification-documents/${selectedDoc.id}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRFToken": csrfToken,
          },
        });
        toast.success("Document updated successfully!");
      }

      // Refresh documents
      let newDocs = [];
      try {
        const { data } = await authAxios.get(`users/${userId}/add-id-docs/`);
        console.log("Fetched documents after submit:", data);
        newDocs = (data.id_docs || []).slice();
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("No documents remain after submit, setting empty list");
          newDocs = [];
        } else {
          throw err;
        }
      }
      setDocuments(newDocs);
      setViewMode("list");
      setSelectedDoc(null);
      setDocType("");
      setFiles([]);
      setFilePreviews([]);
      setOrientations([]);
      setNames([]);
      setRemovedFileIds([]);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        "Operation failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle document deletion
  const handleDelete = async (docId) => {
    setSubmitting(true);
    try {
      const csrfToken = getCookie("csrftoken");
      const deleteResponse = await authAxios.delete(`verification-documents/${docId}/`, {
        headers: { "X-CSRFToken": csrfToken },
      });
      console.log("Delete response:", deleteResponse);
      toast.success("Document deleted successfully!");
      let newDocs = [];
      try {
        const { data } = await authAxios.get(`users/${userId}/add-id-docs/`);
        console.log("Fetched documents after delete:", data);
        newDocs = (data.id_docs || []).slice();
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("No documents remain after deletion, setting empty list");
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

  // Open modal for deletion confirmation
  const openDeleteModal = (docId, docType) => {
    setDeleteDocId(docId);
    setDeleteDocType(docType);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6 grid md:grid-cols-3 gap-8">
      {/* Sidebar */}
      <div className="md:col-span-1">
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-medium mb-3">User Verification Documents</h3>
          <p className="text-sm text-gray-600">
            Manage your identity verification documents.
          </p>
          {viewMode === "list" && (
            <button
              onClick={() => {
                setViewMode("add");
                setDocType("ghana card");
                setFilePreviews([null]);
                setOrientations(["front"]);
                setNames([""]);
              }}
              className="mt-4 bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
            >
              Add New Document
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="md:col-span-2 space-y-6">
        {viewMode === "list" ? (
          <div>
            <h2 className="text-lg font-medium mb-4">Documents List</h2>
            {documents.length === 0 ? (
              <p className="text-gray-500">No documents found.</p>
            ) : (
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-gray-50 p-4 rounded-lg border flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{doc.doc_type.toUpperCase()}</p>
                      <p className="text-sm text-gray-600">
                        Files: {doc.upload_files.map(f => f.name || "Unnamed").join(", ")}
                      </p>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectDoc(doc)}
                        className="bg-black text-white py-1 px-3 rounded hover:bg-gray-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(doc.id, doc.doc_type)}
                        className="text-red-600 hover:text-red-800"
                        disabled={submitting}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-lg font-medium mb-4">
              {viewMode === "add" ? "Add Verification Document" : "Edit Verification Document"}
            </h2>

            {/* Document Type */}
            <div>
              <label className="block mb-1">Document Type *</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                required
                className="w-full border rounded p-2"
              >
                <option value="ghana card">Ghana Card</option>
                <option value="voters card">Voters Card</option>
                {/* Add more options when provided */}
              </select>
            </div>

            {/* File Uploads */}
            <div>
              <h3 className="font-medium mb-3">Upload Files</h3>
              <div className="mb-4 bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium mb-3">Upload Guidelines</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    <span>Files must be under 2MB</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    <span>Acceptable formats: JPG, PNG, PDF</span>
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filePreviews.map((preview, index) => (
                  <div key={index} className="space-y-2">
                    <label className="block mb-1">File {index + 1}</label>
                    <div className="flex items-center">
                      <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 p-4 w-full hover:bg-gray-100">
                        {preview ? (
                          preview.includes(".pdf") ? (
                            <span className="text-sm text-gray-600">PDF File</span>
                          ) : (
                            <img
                              src={preview}
                              alt={`File preview ${index + 1}`}
                              className="h-20 w-20 object-contain"
                            />
                          )
                        ) : (
                          <div className="text-center">
                            <Upload className="w-6 h-6 mb-2 text-gray-500" />
                            <span className="text-xs text-gray-600">Click to upload</span>
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
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div>
                      <label className="block mb-1">Orientation *</label>
                      <select
                        value={orientations[index] || "front"}
                        onChange={(e) => handleOrientationChange(index, e.target.value)}
                        className="w-full border rounded p-2"
                      >
                        <option value="front">Front</option>
                        <option value="back">Back</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1">Name (Optional)</label>
                      <input
                        type="text"
                        value={names[index] || ""}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="Enter file name"
                      />
                    </div>
                  </div>
                ))}
                <div>
                  <button
                    type="button"
                    onClick={addFileInput}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
                  >
                    Add File
                  </button>
                </div>
              </div>
            </div>

            {/* Submit and Cancel */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setViewMode("list");
                  setSelectedDoc(null);
                  setDocType("");
                  setFiles([]);
                  setFilePreviews([]);
                  setOrientations([]);
                  setNames([]);
                  setRemovedFileIds([]);
                }}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !docType || (!files.length && removedFileIds.length === selectedDoc?.upload_files.length)}
                className="bg-black text-white py-2 px-6 rounded flex items-center disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
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
    </div>
  );
}