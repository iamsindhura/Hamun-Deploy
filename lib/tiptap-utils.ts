/**
 * Safely parses journal content into a valid TipTap JSON structure.
 * Handles backward compatibility with old plain-text journals.
 */
export function parseJournalContent(content: any): any {
  if (!content) {
    return createEmptyTiptapDoc();
  }

  // If it's already an object (JSON), it's likely already a valid TipTap document or parsed JSON
  if (typeof content === 'object') {
    // Check if it's a valid TipTap doc structure
    if (content.type === 'doc' && Array.isArray(content.content)) {
      return content;
    }
    // Fallback if the object is weird
    return convertTextToTiptap(JSON.stringify(content));
  }

  // If it's a string, we need to determine if it's a JSON string or plain text
  if (typeof content === 'string') {
    try {
      // Try parsing it as JSON first
      const parsed = JSON.parse(content);
      
      // If it parsed successfully into an object and has a type of 'doc', it's TipTap JSON
      if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
        return parsed;
      }
      
      // If it parsed into a number, boolean, or weird array, fallback to text conversion
      return convertTextToTiptap(content);
    } catch (e) {
      // JSON.parse threw an error, meaning this is a legacy plain-text journal!
      return convertTextToTiptap(content);
    }
  }

  return createEmptyTiptapDoc();
}

/**
 * Converts legacy plain text into a basic TipTap JSON structure.
 */
function convertTextToTiptap(text: string): any {
  if (!text || text.trim() === '') {
    return createEmptyTiptapDoc();
  }

  const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');
  
  return {
    type: 'doc',
    content: paragraphs.map(p => ({
      type: 'paragraph',
      content: [{ type: 'text', text: p.trim() }]
    }))
  };
}

function createEmptyTiptapDoc() {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: []
      }
    ]
  };
}

/**
 * Extracts plain text from a TipTap JSON structure for timeline previews.
 */
export function extractTextFromTiptap(content: any): string {
  if (!content || !Array.isArray(content.content)) return "";
  
  let text = "";
  for (const node of content.content) {
    if (node.type === 'paragraph' || node.type === 'heading') {
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          if (child.type === 'text' && child.text) {
            text += child.text;
          }
        }
      }
      text += " ";
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      if (node.content && Array.isArray(node.content)) {
        for (const item of node.content) {
          text += extractTextFromTiptap(item) + " ";
        }
      }
    } else if (node.type === 'listItem') {
      if (node.content && Array.isArray(node.content)) {
        for (const item of node.content) {
          text += extractTextFromTiptap(item) + " ";
        }
      }
    } else if (node.type === 'blockquote') {
      text += extractTextFromTiptap(node) + " ";
    }
  }
  
  return text.trim();
}
