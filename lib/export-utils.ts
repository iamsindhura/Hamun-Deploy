import { format } from "date-fns";

export function tiptapToMarkdown(doc: any): string {
  if (!doc) return "";
  if (typeof doc === "string") return doc;
  if (!Array.isArray(doc.content)) return "";

  let markdown = "";
  for (const node of doc.content) {
    if (node.type === "paragraph") {
      let pText = "";
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          if (child.type === "text" && child.text) {
            pText += child.text;
          }
        }
      }
      markdown += `${pText}\n\n`;
    } else if (node.type === "heading") {
      let hText = "";
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          if (child.type === "text" && child.text) {
            hText += child.text;
          }
        }
      }
      const level = node.attrs?.level || 1;
      const prefix = "#".repeat(level);
      markdown += `${prefix} ${hText}\n\n`;
    } else if (node.type === "blockquote") {
      const qText = tiptapToMarkdown(node);
      markdown += `> ${qText.trim().replace(/\n/g, "\n> ")}\n\n`;
    } else if (node.type === "bulletList") {
      if (node.content && Array.isArray(node.content)) {
        for (const item of node.content) {
          const itemText = tiptapToMarkdown(item);
          markdown += `- ${itemText.trim()}\n`;
        }
        markdown += `\n`;
      }
    } else if (node.type === "orderedList") {
      if (node.content && Array.isArray(node.content)) {
        let index = 1;
        for (const item of node.content) {
          const itemText = tiptapToMarkdown(item);
          markdown += `${index}. ${itemText.trim()}\n`;
          index++;
        }
        markdown += `\n`;
      }
    } else if (node.type === "listItem") {
      markdown += tiptapToMarkdown(node);
    } else if (node.type === "customImage") {
      const caption = node.attrs?.caption ? ` - "${node.attrs.caption}"` : "";
      markdown += `![Image Attachment](${node.attrs?.src || ""})${caption}\n\n`;
    } else if (node.type === "customAudio") {
      const summary = node.attrs?.summary ? ` (${node.attrs.summary})` : "";
      markdown += `[Audio Attachment](${node.attrs?.src || ""})${summary}\n\n`;
    } else if (node.type === "customPDF") {
      const summary = node.attrs?.summary ? ` (${node.attrs.summary})` : "";
      markdown += `[PDF Attachment: ${node.attrs?.filename || ""}](${node.attrs?.src || ""})${summary}\n\n`;
    }
  }

  return markdown.trim();
}

export function tiptapToHtml(doc: any): string {
  if (!doc) return "";
  if (typeof doc === "string") return `<p>${doc.replace(/\n/g, "<br/>")}</p>`;
  if (!Array.isArray(doc.content)) return "";

  let html = "";
  for (const node of doc.content) {
    if (node.type === "paragraph") {
      let pText = "";
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          if (child.type === "text" && child.text) {
            pText += child.text;
          }
        }
      }
      html += `<p>${pText}</p>`;
    } else if (node.type === "heading") {
      let hText = "";
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          if (child.type === "text" && child.text) {
            hText += child.text;
          }
        }
      }
      const level = node.attrs?.level || 1;
      html += `<h${level}>${hText}</h${level}>`;
    } else if (node.type === "blockquote") {
      const qText = tiptapToHtml(node);
      html += `<blockquote>${qText}</blockquote>`;
    } else if (node.type === "bulletList") {
      if (node.content && Array.isArray(node.content)) {
        html += `<ul>`;
        for (const item of node.content) {
          html += `<li>${tiptapToHtml(item)}</li>`;
        }
        html += `</ul>`;
      }
    } else if (node.type === "orderedList") {
      if (node.content && Array.isArray(node.content)) {
        html += `<ol>`;
        for (const item of node.content) {
          html += `<li>${tiptapToHtml(item)}</li>`;
        }
        html += `</ol>`;
      }
    } else if (node.type === "listItem") {
      html += node.content ? node.content.map((n: any) => tiptapToHtml({ content: [n] })).join("") : "";
    } else if (node.type === "customImage") {
      const caption = node.attrs?.caption ? `<div class="attachment-caption" style="font-size:12px; color:#6b7280; font-style:italic;">${node.attrs.caption}</div>` : "";
      html += `
        <div class="attachment-embed image-embed" style="margin-bottom:15px;">
          <img src="${node.attrs?.src || ""}" style="max-width:100%; border-radius:8px; margin-bottom:5px;" />
          ${caption}
        </div>
      `;
    } else if (node.type === "customAudio") {
      const summary = node.attrs?.summary ? `<p class="attachment-summary" style="margin:5px 0 0 0; font-size:13px; color:#4b5563;">${node.attrs.summary}</p>` : "";
      html += `
        <div class="attachment-embed audio-embed" style="padding: 12px; background: #f3f4f6; border-radius: 8px; margin-bottom: 15px;">
          <strong>Audio Attachment</strong>
          ${summary}
        </div>
      `;
    } else if (node.type === "customPDF") {
      const summary = node.attrs?.summary ? `<p class="attachment-summary" style="margin:5px 0 0 0; font-size:13px; color:#4b5563;">${node.attrs.summary}</p>` : "";
      html += `
        <div class="attachment-embed pdf-embed" style="padding: 12px; background: #f3f4f6; border-radius: 8px; margin-bottom: 15px;">
          <strong>PDF Attachment:</strong> ${node.attrs?.filename || ""}
          ${summary}
        </div>
      `;
    }
  }

  return html;
}

export function generateMarkdown(journal: any): string {
  const dateStr = format(new Date(journal.date), "EEEE, MMMM do, yyyy");
  const title = journal.insights?.title || "A Day of Reflection";
  const subtitle = journal.subtitle || "";
  const sticker = journal.sticker || "Neutral";
  const emotion = journal.insights?.emotion || "Neutral";
  
  const bodyText = tiptapToMarkdown(journal.content || journal.originalText);

  let md = `# Journal Entry - ${dateStr}\n\n`;
  md += `## ${title}\n`;
  if (subtitle) md += `*${subtitle}*\n`;
  md += `\n`;
  md += `**Sticker/Mood:** ${sticker}\n`;
  md += `**Emotion:** ${emotion}\n\n`;
  md += `---\n\n`;
  md += `### Reflections\n\n`;
  md += `${bodyText}\n\n`;

  // Personal Memories
  if (journal.personalMemories && journal.personalMemories.length > 0) {
    md += `---\n\n`;
    md += `### Personal Memories\n\n`;
    journal.personalMemories.forEach((mem: any) => {
      md += `- ${mem.content}\n`;
    });
    md += `\n`;
  }

  // Attachments
  if (journal.attachments && journal.attachments.length > 0) {
    md += `---\n\n`;
    md += `### Attachments\n\n`;
    journal.attachments.forEach((att: any) => {
      md += `- ${att.filename} (${att.type})\n`;
    });
    md += `\n`;
  }

  // AI Insights
  const ai = journal.insights?.aiAnalysis;
  if (ai) {
    md += `---\n\n`;
    md += `### AI Insights & Coaching Briefing\n\n`;
    md += `**Overall Score:** ${ai.score}/100 (${ai.label || ""})\n\n`;
    md += `#### Executive Summary\n`;
    md += `${ai.executiveSummary}\n\n`;
    
    if (ai.reason) {
      md += `#### AI Coach Message\n`;
      md += `${ai.reason}\n\n`;
    }

    if (ai.evidence && ai.evidence.length > 0) {
      md += `#### Today's Evidence\n`;
      ai.evidence.forEach((item: string) => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (ai.strengths && ai.strengths.length > 0) {
      md += `#### Key Strengths\n`;
      ai.strengths.forEach((item: string) => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (ai.areasToImprove && ai.areasToImprove.length > 0) {
      md += `#### Areas to Improve\n`;
      ai.areasToImprove.forEach((item: string) => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (ai.tomorrowActionPlan && ai.tomorrowActionPlan.length > 0) {
      md += `#### Tomorrow's Action Plan\n`;
      ai.tomorrowActionPlan.forEach((item: string) => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (ai.suggestedFocus) {
      md += `#### Suggested Focus\n`;
      md += `**${ai.suggestedFocus}**\n\n`;
    }
  }

  return md;
}

export function generatePlainText(journal: any): string {
  const dateStr = format(new Date(journal.date), "EEEE, MMMM do, yyyy");
  const title = journal.insights?.title || "A Day of Reflection";
  const subtitle = journal.subtitle || "";
  const sticker = journal.sticker || "Neutral";
  const emotion = journal.insights?.emotion || "Neutral";

  // Use raw extractor to strip any remaining HTML or tags
  const bodyText = tiptapToMarkdown(journal.content || journal.originalText)
    .replace(/!\[.*?\]\(.*?\)/g, "[Image]")
    .replace(/\[.*?\]\(.*?\)/g, "[Attachment]");

  let txt = `==================================================\n`;
  txt += `JOURNAL ENTRY - ${dateStr.toUpperCase()}\n`;
  txt += `==================================================\n\n`;
  txt += `Title: ${title}\n`;
  if (subtitle) txt += `Subtitle: ${subtitle}\n`;
  txt += `Sticker/Mood: ${sticker}\n`;
  txt += `Emotion: ${emotion}\n\n`;
  txt += `--------------------------------------------------\n`;
  txt += `REFLECTIONS\n`;
  txt += `--------------------------------------------------\n\n`;
  txt += `${bodyText}\n\n`;

  if (journal.personalMemories && journal.personalMemories.length > 0) {
    txt += `--------------------------------------------------\n`;
    txt += `PERSONAL MEMORIES\n`;
    txt += `--------------------------------------------------\n\n`;
    journal.personalMemories.forEach((mem: any) => {
      txt += `- ${mem.content}\n`;
    });
    txt += `\n`;
  }

  if (journal.attachments && journal.attachments.length > 0) {
    txt += `--------------------------------------------------\n`;
    txt += `ATTACHMENTS\n`;
    txt += `--------------------------------------------------\n\n`;
    journal.attachments.forEach((att: any) => {
      txt += `- ${att.filename} (${att.type})\n`;
    });
    txt += `\n`;
  }

  const ai = journal.insights?.aiAnalysis;
  if (ai) {
    txt += `--------------------------------------------------\n`;
    txt += `AI INSIGHTS & COACHING BRIEFING\n`;
    txt += `--------------------------------------------------\n\n`;
    txt += `Overall Score: ${ai.score}/100 (${ai.label || ""})\n\n`;
    txt += `Executive Summary:\n${ai.executiveSummary}\n\n`;
    
    if (ai.reason) {
      txt += `AI Coach Message:\n${ai.reason}\n\n`;
    }

    if (ai.evidence && ai.evidence.length > 0) {
      txt += `Today's Evidence:\n`;
      ai.evidence.forEach((item: string) => {
        txt += `- ${item}\n`;
      });
      txt += `\n`;
    }

    if (ai.strengths && ai.strengths.length > 0) {
      txt += `Key Strengths:\n`;
      ai.strengths.forEach((item: string) => {
        txt += `- ${item}\n`;
      });
      txt += `\n`;
    }

    if (ai.areasToImprove && ai.areasToImprove.length > 0) {
      txt += `Areas to Improve:\n`;
      ai.areasToImprove.forEach((item: string) => {
        txt += `- ${item}\n`;
      });
      txt += `\n`;
    }

    if (ai.tomorrowActionPlan && ai.tomorrowActionPlan.length > 0) {
      txt += `Tomorrow's Action Plan:\n`;
      ai.tomorrowActionPlan.forEach((item: string) => {
        txt += `- ${item}\n`;
      });
      txt += `\n`;
    }

    if (ai.suggestedFocus) {
      txt += `Suggested Focus:\n${ai.suggestedFocus}\n\n`;
    }
  }

  return txt;
}

export function exportToPDF(journal: any) {
  const dateStr = format(new Date(journal.date), "EEEE, MMMM do, yyyy");
  const title = journal.insights?.title || "A Day of Reflection";
  const subtitle = journal.subtitle || "";
  const sticker = journal.sticker || "Neutral";
  const emotion = journal.insights?.emotion || "Neutral";

  const bodyHtml = tiptapToHtml(journal.content || journal.originalText);

  const ai = journal.insights?.aiAnalysis;
  let aiHtml = "";
  if (ai) {
    aiHtml = `
      <div class="ai-card">
        <h2>AI Insights & Coaching Briefing</h2>
        <div class="score-badge">Overall Score: <strong>${ai.score}</strong>/100 (${ai.label || ""})</div>
        
        <h3>Executive Summary</h3>
        <p>${ai.executiveSummary}</p>

        ${ai.reason ? `<h3>AI Coach Message</h3><p>${ai.reason}</p>` : ""}

        ${ai.evidence && ai.evidence.length > 0 ? `
          <h3>Evidence</h3>
          <ul>${ai.evidence.map((item: string) => `<li>${item}</li>`).join("")}</ul>
        ` : ""}

        ${ai.strengths && ai.strengths.length > 0 ? `
          <h3>Strengths</h3>
          <ul>${ai.strengths.map((item: string) => `<li>${item}</li>`).join("")}</ul>
        ` : ""}

        ${ai.areasToImprove && ai.areasToImprove.length > 0 ? `
          <h3>Areas to Improve</h3>
          <ul>${ai.areasToImprove.map((item: string) => `<li>${item}</li>`).join("")}</ul>
        ` : ""}

        ${ai.tomorrowActionPlan && ai.tomorrowActionPlan.length > 0 ? `
          <h3>Tomorrow's Action Plan</h3>
          <ul>${ai.tomorrowActionPlan.map((item: string) => `<li>${item}</li>`).join("")}</ul>
        ` : ""}

        ${ai.suggestedFocus ? `<h3>Suggested Focus</h3><p><strong>${ai.suggestedFocus}</strong></p>` : ""}
      </div>
    `;
  }

  let memoriesHtml = "";
  if (journal.personalMemories && journal.personalMemories.length > 0) {
    memoriesHtml = `
      <div class="personal-memories" style="margin-top: 30px; page-break-inside: avoid; border-top: 1px dashed #e5e7eb; padding-top: 20px;">
        <h3>Personal Memories</h3>
        <ul style="list-style-type: square; padding-left: 20px;">
          ${journal.personalMemories.map((mem: any) => `<li>${mem.content}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  let attachmentsHtml = "";
  if (journal.attachments && journal.attachments.length > 0) {
    attachmentsHtml = `
      <div class="attachments">
        <h3>Attachments</h3>
        <ul style="list-style-type: square; padding-left: 20px;">
          ${journal.attachments.map((att: any) => `<li>${att.filename} (${att.type})</li>`).join("")}
        </ul>
      </div>
    `;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Journal Export - ${dateStr}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1f2937;
            line-height: 1.65;
            max-width: 800px;
            margin: 45px auto;
            padding: 0 30px;
          }
          h1 {
            font-size: 38px;
            margin-bottom: 5px;
            color: #111827;
            font-weight: 800;
          }
          .subtitle {
            font-size: 19px;
            color: #4b5563;
            margin-bottom: 25px;
            font-style: italic;
          }
          .meta-info {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 30px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 15px;
          }
          .content {
            font-size: 16px;
            margin-bottom: 40px;
          }
          .ai-card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 30px;
            margin-top: 40px;
            page-break-inside: avoid;
          }
          .ai-card h2 {
            margin-top: 0;
            color: #7c3aed;
            font-size: 22px;
            font-weight: bold;
          }
          .score-badge {
            display: inline-block;
            background-color: #f3e8ff;
            color: #6b21a8;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          h3 {
            color: #374151;
            font-size: 17px;
            margin-top: 25px;
            margin-bottom: 10px;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 5px;
            font-weight: bold;
          }
          ul {
            padding-left: 20px;
            margin-bottom: 20px;
          }
          li {
            margin-bottom: 5px;
          }
          .attachments {
            margin-top: 30px;
            font-size: 14px;
            color: #4b5563;
            page-break-inside: avoid;
            border-top: 1px dashed #e5e7eb;
            padding-top: 20px;
          }
          @media print {
            body {
              margin: 20px;
            }
            .ai-card {
              border: none;
              background-color: transparent;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="meta-info" style="font-weight: bold; tracking: 0.1em; text-transform: uppercase;">${dateStr}</div>
        <h1>${title}</h1>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
        <div class="meta-info">
          <strong>Sticker/Mood:</strong> ${sticker} &nbsp;&nbsp;|&nbsp;&nbsp; 
          <strong>Emotion:</strong> ${emotion}
        </div>
        <div class="content">
          ${bodyHtml}
        </div>
        ${memoriesHtml}
        ${attachmentsHtml}
        ${aiHtml}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
