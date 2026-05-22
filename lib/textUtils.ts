/**
 * Strips markdown formatting and HTML tags to produce plain text
 * suitable for the Web Speech API.
 */
export function stripToPlainText(markdown: string): string {
  let text = markdown;
  // Remove headings markers
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Remove bold/italic markers
  text = text.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');
  text = text.replace(/_{1,3}([^_]+)_{1,3}/g, '$1');
  // Remove links — keep the text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');
  // Remove blockquotes
  text = text.replace(/^>\s*/gm, '');
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');
  // Collapse multiple whitespace/newlines
  text = text.replace(/\n{2,}/g, '. ');
  text = text.replace(/\n/g, ' ');
  text = text.replace(/\s{2,}/g, ' ');
  return text.trim();
}
