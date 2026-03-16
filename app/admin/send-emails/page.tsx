"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  ShieldCheck,
  Search,
  Send,
  Paperclip,
  Mail,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Partner = {
  _id: string;
  email: string;
  createdAt: string;
  role: string;
  referralCode?: string;
  totalReferrals?: number;
};

export default function AdminPartnerView() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [sendMode, setSendMode] = useState<"all" | "manual">("all");
  const [manualEmails, setManualEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const router = useRouter();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin/partners", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch partners");
      }

      const data = (await res.json()) as Partner[];
      setPartners(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Unauthorized or server error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return partners.filter(
      (p) =>
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.referralCode?.toLowerCase().includes(search.toLowerCase())
    );
  }, [partners, search]);

  const recipientCount = useMemo(() => {
    if (sendMode === "all") return partners.length;

    return manualEmails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean).length;
  }, [sendMode, manualEmails, partners.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendEmails = async () => {
    if (!subject.trim()) {
      toast.error("Please enter an email subject");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter your email message");
      return;
    }

    if (sendMode === "manual" && !manualEmails.trim()) {
      toast.error("Please enter at least one recipient email");
      return;
    }

    try {
      setSending(true);

      const formData = new FormData();
      formData.append("mode", sendMode);
      formData.append("subject", subject);
      formData.append("message", message);

      if (sendMode === "manual") {
        formData.append("emails", manualEmails);
      }

      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/admin/send-emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to send emails");
      }

      toast.success(data?.message || "Emails sent successfully");

      setSubject("");
      setMessage("");
      setManualEmails("");
      setFiles([]);
      setSendMode("all");
    } catch (error: any) {
      toast.error(error.message || "Failed to send emails");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8 bg-[#09090b] min-h-screen text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-indigo-500" />
              Admin: Send Emails
            </h1>
            <p className="text-zinc-500">
              Send emails to all users or selected recipients
            </p>
          </div>

          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search email or code..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold">Compose Email</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSendMode("all")}
              className={`rounded-xl border p-4 text-left transition ${
                sendMode === "all"
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold">Send to All</span>
              </div>
              <p className="text-sm text-zinc-400">
                Send this email to all available users.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSendMode("manual")}
              className={`rounded-xl border p-4 text-left transition ${
                sendMode === "manual"
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold">Send to Specific Emails</span>
              </div>
              <p className="text-sm text-zinc-400">
                Enter one or more recipient emails separated by commas.
              </p>
            </button>
          </div>

          {sendMode === "manual" && (
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Recipient Emails</label>
              <textarea
                rows={3}
                value={manualEmails}
                onChange={(e) => setManualEmails(e.target.value)}
                placeholder="example1@email.com, example2@email.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Message</label>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your email message here..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm text-zinc-300">Attachments</label>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-zinc-700 cursor-pointer transition">
              <Paperclip className="w-4 h-4" />
              <span className="text-sm">Choose Files</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate">{file.name}</p>
                      <p className="text-xs text-zinc-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
            <div className="text-sm text-zinc-400">
              Recipients:{" "}
              <span className="text-white font-semibold">{recipientCount}</span>
            </div>

            <button
              type="button"
              onClick={handleSendEmails}
              disabled={sending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3 font-semibold transition"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Partner / Affiliate</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Ref Code</th>
                <th className="px-6 py-4 font-semibold text-center">
                  Referrals
                </th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-zinc-500"
                  >
                    Loading partners...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-zinc-500"
                  >
                    No partners found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium">{p.email}</p>
                      <p className="text-[10px] text-zinc-500">
                        Joined {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          p.role === "partner"
                            ? "bg-indigo-500/10 text-indigo-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                      {p.referralCode || "-"}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-lg">
                      {p.totalReferrals ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400"
                        onClick={() =>
                          router.push(`/admin/partner-dashbaord/${p._id}`)
                        }
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}