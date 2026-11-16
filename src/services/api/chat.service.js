// In-app messaging (org-to-org chat).
//
//   GET    conversations/                         list my conversations
//   GET    conversations/<id>/                    one conversation
//   POST   conversations/                         get-or-create (counterparty
//                                                 + optional document context)
//   POST   conversations/<id>/mark-read/          mark conversation read
//   POST   conversations/<id>/block/  / unblock/  block counterpart org
//   GET    messages/?conversation=<id>            message thread
//   POST   messages/                              send message (multipart)
//   POST   messages/<id>/report/                  report a message
import http from "@/services/lib/http";
import { apiErrorMessage } from "@/services/lib/api-error";

export async function listConversations() {
  const { data } = await http.get("conversations/");
  return Array.isArray(data) ? data : data?.results || [];
}

export async function getConversation(id) {
  const { data } = await http.get(`conversations/${encodeURIComponent(id)}/`);
  return data;
}

export async function openConversation({
  counterpartType,
  counterpartId,
  documentType,
  documentId,
  subject,
}) {
  const { data } = await http.post("conversations/", {
    counterpart_type: counterpartType,
    counterpart_id: String(counterpartId),
    ...(documentType ? { document_type: documentType } : {}),
    ...(documentId ? { document_id: String(documentId) } : {}),
    ...(subject ? { subject } : {}),
  });
  return data;
}

export async function markConversationRead(id) {
  const { data } = await http.post(
    `conversations/${encodeURIComponent(id)}/mark-read/`,
  );
  return data;
}

export async function blockConversation(id) {
  const { data } = await http.post(
    `conversations/${encodeURIComponent(id)}/block/`,
  );
  return data;
}

export async function unblockConversation(id) {
  const { data } = await http.post(
    `conversations/${encodeURIComponent(id)}/unblock/`,
  );
  return data;
}

export async function listMessages(conversationId) {
  const { data } = await http.get("messages/", {
    params: { conversation: String(conversationId) },
  });
  return Array.isArray(data) ? data : data?.results || [];
}

export async function sendMessage({ conversationId, body, attachments }) {
  const fd = new FormData();
  fd.append("conversation", String(conversationId));
  fd.append("body", body || "");
  (attachments || []).forEach((f) => fd.append("attachments", f));
  const { data } = await http.post("messages/", fd);
  return data;
}

export async function reportMessage(messageId, { reason, details }) {
  const { data } = await http.post(
    `messages/${encodeURIComponent(messageId)}/report/`,
    { reason, details },
  );
  return data;
}

export function chatErrorMessage(err, fallback) {
  return apiErrorMessage(err, fallback);
}
