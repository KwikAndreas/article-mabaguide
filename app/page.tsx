"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

const FACULTIES = ["General", "FTD", "FISH"];
const PRODI_BY_FACULTY: Record<string, string[]> = {
  General: ["General"],
  FTD: ["General", "Artificial Intelligence", "Data Science", "Desain Interaktif", "Desain Komunikasi Visual", "Informatika", "Sistem Informasi"],
  FISH: ["General", "Akuntansi", "Bahasa Inggris", "Bahasa Mandarin", "Bisnis Digital", "Hospitaliti dan Pariwisata", "Ilmu Komunikasi", "Manajemen", "Psikologi"]
};

export default function GeneratorPage() {
  const [formData, setFormData] = useState({
    title: "",
    category: "Birokrasi",
    faculty: "General",
    program: "General",
    content: "",
  });

  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate the final Markdown string based on AGENTS.md rules
  const generateFinalMarkdown = () => {
    return `---
title: "${formData.title || "Untitled"}"
category: "${formData.category}"
faculty: "${formData.faculty || "General"}"
program: "${formData.program || "General"}"
---

${formData.content}
`;
  };

  const finalMarkdown = generateFinalMarkdown();

  // Generate slug for downloading or saving
  const generateSlug = (title: string) => {
    if (!title) return "untitled";
    return title
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "faculty") {
        newData.program = "General"; // Reset program to General when faculty changes
      }
      return newData;
    });
  };

  const insertMarkdown = (snippet: string) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const currentContent = formData.content;

    const newContent = currentContent.substring(0, start) + snippet + currentContent.substring(end);
    
    setFormData((prev) => ({ ...prev, content: newContent }));

    // Move cursor after insertion
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + snippet.length, start + snippet.length);
      }
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/articles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat artikel.");
      }

      setMessage({ type: "success", text: `Sukses! Artikel tersimpan sebagai ${data.slug}.md di proyek mabaguide.` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(finalMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const slug = generateSlug(formData.title);
    const blob = new Blob([finalMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans selection:bg-white/20 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-black/50 backdrop-blur-md border-b border-white/[0.08] px-6 py-4">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-wide">MabaGuide <span className="text-[#a1a1aa] font-normal">Generator</span></h1>
          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !formData.title || !formData.content}
              className="bg-white text-black text-sm font-medium px-5 py-2 rounded-md hover:bg-white/[0.8] hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? "Menyimpan..." : "Save to Project"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content: 2 Columns */}
      <main className="flex-1 overflow-hidden p-6">
        <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col md:flex-row gap-6">
          
          {/* LEFT COLUMN: Meta Inputs (50%) */}
          <div className="w-full md:w-1/2 flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Metadata Artikel</h2>
              <p className="text-[#a1a1aa] text-sm">Isi atribut frontmatter dari artikel panduan di sini.</p>
            </div>

            {message && (
              <div className={`p-4 rounded-lg border text-sm ${message.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                {message.text}
              </div>
            )}

            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="title" className="text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">Judul Artikel</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Contoh: Cara Mengisi KRS di Portal Mahasiswa"
                  className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-[#3f3f46]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="category" className="text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">Kategori</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all appearance-none"
                >
                  <option value="Birokrasi">Birokrasi</option>
                  <option value="Fasilitas">Fasilitas</option>
                  <option value="Organisasi">Organisasi</option>
                  <option value="Kamus">Kamus</option>
                  <option value="Akademik">Akademik</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="faculty" className="text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">Fakultas Sasaran</label>
                <select
                  id="faculty"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all appearance-none"
                >
                  {FACULTIES.map((fac) => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="program" className="text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">Prodi Sasaran</label>
                <select
                  id="program"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-md px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all appearance-none"
                >
                  {PRODI_BY_FACULTY[formData.faculty]?.map((prodi) => (
                    <option key={prodi} value={prodi}>{prodi}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Editor & Preview (50%) */}
          <div className="w-full md:w-1/2 flex flex-col h-full border border-white/[0.08] rounded-xl bg-[#0a0a0a] overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/[0.08]">
              <button
                onClick={() => setActiveTab("write")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "write" ? "bg-white/[0.05] text-white" : "text-[#a1a1aa] hover:bg-white/[0.02] hover:text-white"
                }`}
              >
                Isi Artikel (Markdown)
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "preview" ? "bg-white/[0.05] text-white" : "text-[#a1a1aa] hover:bg-white/[0.02] hover:text-white"
                }`}
              >
                Preview Output
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 relative flex flex-col overflow-hidden">
              {activeTab === "write" ? (
                <>
                  {/* Toolbar */}
                  <div className="flex gap-2 p-3 border-b border-white/[0.08] bg-black/20 overflow-x-auto custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => insertMarkdown("## Pengantar\nTulis pengantar di sini...\n\n")}
                      className="whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[#ededed] hover:bg-white/[0.1] transition-colors"
                    >
                      + Pengantar
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("### Langkah-langkah\n1. Langkah pertama\n2. Langkah kedua\n3. Langkah ketiga\n\n")}
                      className="whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[#ededed] hover:bg-white/[0.1] transition-colors"
                    >
                      + Langkah-langkah
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("- Item pertama\n- Item kedua\n- Item ketiga\n\n")}
                      className="whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[#ededed] hover:bg-white/[0.1] transition-colors"
                    >
                      + List
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("![Deskripsi Gambar](/images/contoh.jpg)\n\n")}
                      className="whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[#ededed] hover:bg-white/[0.1] transition-colors"
                    >
                      + Gambar
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("> **Catatan Penting**: Tulis catatan di sini...\n\n")}
                      className="whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[#ededed] hover:bg-white/[0.1] transition-colors"
                    >
                      + Catatan
                    </button>
                  </div>
                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Mulai menulis konten Markdown di sini..."
                    className="flex-1 w-full bg-transparent p-5 text-sm font-mono focus:outline-none resize-none placeholder:text-[#3f3f46]"
                  ></textarea>
                </>
              ) : (
                <div className="h-full flex flex-col relative overflow-hidden bg-black/40">
                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button
                      onClick={handleCopy}
                      className="bg-black/50 backdrop-blur-md border border-white/[0.08] text-[#ededed] text-xs px-3 py-1.5 rounded hover:bg-white/[0.1] transition-colors shadow-lg w-[120px] text-center"
                    >
                      {isCopied ? "Copied! ✓" : "Copy File (.md)"}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="bg-black/50 backdrop-blur-md border border-white/[0.08] text-[#ededed] text-xs px-3 py-1.5 rounded hover:bg-white/[0.1] transition-colors shadow-lg"
                    >
                      Download .md
                    </button>
                  </div>
                  <div className="w-full h-full overflow-y-auto p-8 custom-scrollbar">
                    {/* Visual Preview Header */}
                    <div className="mb-8 border-b border-white/[0.08] pb-6">
                      <h1 className="text-3xl font-bold text-white mb-4">
                        {formData.title || "Judul Artikel"}
                      </h1>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">{formData.category}</span>
                        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20">{formData.faculty || "General"}</span>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">{formData.program || "General"}</span>
                      </div>
                    </div>
                    
                    {/* Visual Rendered Markdown */}
                    <div className="markdown-preview text-[#d4d4d8] leading-relaxed space-y-6 text-sm">
                      <ReactMarkdown>
                        {formData.content || "*Belum ada konten...*"}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }

        /* Custom styles for rendered Markdown */
        .markdown-preview h1,
        .markdown-preview h2,
        .markdown-preview h3,
        .markdown-preview h4 {
          color: #ffffff;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        
        .markdown-preview h2 {
          font-size: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 0.3em;
        }

        .markdown-preview h3 {
          font-size: 1.25rem;
        }

        .markdown-preview p {
          margin-top: 0;
          margin-bottom: 1em;
        }

        .markdown-preview ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin-bottom: 1em;
        }

        .markdown-preview ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin-bottom: 1em;
        }

        .markdown-preview li {
          margin-bottom: 0.25em;
        }

        .markdown-preview strong {
          color: #ffffff;
          font-weight: 600;
        }

        .markdown-preview blockquote {
          border-left: 4px solid rgba(255,255,255,0.2);
          padding-left: 1em;
          margin-left: 0;
          margin-right: 0;
          font-style: italic;
          color: #a1a1aa;
          background-color: rgba(255,255,255,0.02);
          padding: 1em;
          border-radius: 0 0.5rem 0.5rem 0;
        }

        .markdown-preview img {
          max-width: 100%;
          border-radius: 0.5rem;
          margin: 1em 0;
        }

        .markdown-preview a {
          color: #60a5fa;
          text-decoration: underline;
        }

        .markdown-preview code {
          background-color: rgba(255,255,255,0.1);
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875em;
        }
      `}</style>
    </div>
  );
}
