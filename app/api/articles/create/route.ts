import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, faculty, program, content } = body;

    if (!title || !category || !faculty || !program || !content) {
      return NextResponse.json(
        { error: "Semua field harus diisi!" },
        { status: 400 }
      );
    }

    // 1. Generate Slug
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/[^\w-]+/g, "") // Remove all non-word chars
      .replace(/--+/g, "-"); // Replace multiple hyphens with single hyphen

    // 2. Format YAML Frontmatter
    const markdownContent = `---
title: "${title}"
category: "${category}"
faculty: "${faculty}"
program: "${program}"
---

${content}
`;

    // 3. Save to file in the mabaguide project
    const contentDirectory = path.join(process.cwd(), "..", "mabaguide", "content", "faq");
    
    // Ensure directory exists
    if (!fs.existsSync(contentDirectory)) {
      fs.mkdirSync(contentDirectory, { recursive: true });
    }

    const filePath = path.join(contentDirectory, `${slug}.md`);

    fs.writeFileSync(filePath, markdownContent, "utf8");

    return NextResponse.json({ 
      success: true, 
      message: "Artikel berhasil dibuat!",
      slug 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat membuat artikel." },
      { status: 500 }
    );
  }
}
