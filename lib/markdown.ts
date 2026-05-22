/**
 * A lightweight, custom-tuned markdown and inline-HTML parser for the "Little Bit of Luxe" journal.
 * Handles standard heading styles, paragraphs, inline formatting (bold, italic, links),
 * and safely transparentizes embedded HTML/JSX blocks such as CTA and Verdict boxes.
 */
export function parseMarkdown(md: string): string {
  // 1. Pre-process className to class for inline-HTML rendering in browser
  let content = md.replace(/className=/g, 'class=');

  // 2. Parse blocks
  const lines = content.split('\n');
  const resultBlocks: string[] = [];
  let currentBlock: string[] = [];
  let inHtmlBlock = false;
  let htmlBlockStack: string[] = [];

  const blockTags = new Set(['div', 'a', 'table', 'figure', 'iframe', 'video', 'blockquote', 'section', 'p', 'aside', 'dl', 'dt', 'dd']);

  const flushParagraph = () => {
    if (currentBlock.length > 0) {
      const text = currentBlock.join('\n').trim();
      if (text) {
        resultBlocks.push(`<p class="mb-6 leading-relaxed text-ink-2">${parseInlineMarkdown(text)}</p>`);
      }
      currentBlock = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if we are starting a block HTML section
    if (!inHtmlBlock) {
      const startMatch = trimmed.match(/^<([a-zA-Z0-9]+)\b/i);
      if (startMatch && blockTags.has(startMatch[1].toLowerCase())) {
        flushParagraph();
        inHtmlBlock = true;
        htmlBlockStack = [];
      }
    }

    if (inHtmlBlock) {
      currentBlock.push(line);
      
      // Parse tags in the current line to track open/close state
      // Tag opening: <tag...>, excluding self-closing or comments
      // Tag closing: </tag>
      const tagRegex = /<\/?([a-zA-Z0-9]+)\b[^>]*>/g;
      let match;
      while ((match = tagRegex.exec(line)) !== null) {
        const fullTag = match[0];
        const tagName = match[1].toLowerCase();
        
        if (blockTags.has(tagName)) {
          if (fullTag.startsWith('</')) {
            // Closing tag
            if (htmlBlockStack.length > 0 && htmlBlockStack[htmlBlockStack.length - 1] === tagName) {
              htmlBlockStack.pop();
            }
          } else if (!fullTag.endsWith('/>')) {
            // Opening tag
            htmlBlockStack.push(tagName);
          }
        }
      }

      // If stack becomes empty, the block has ended
      if (htmlBlockStack.length === 0) {
        resultBlocks.push(currentBlock.join('\n'));
        currentBlock = [];
        inHtmlBlock = false;
      }
      continue;
    }

    // Markdown blocks
    if (trimmed.startsWith('# ')) {
      flushParagraph();
      const val = trimmed.substring(2);
      resultBlocks.push(`<h1 class="lbl-h1 mb-6 text-midnight">${parseInlineMarkdown(val)}</h1>`);
    } else if (trimmed.startsWith('## ')) {
      flushParagraph();
      const val = trimmed.substring(3);
      const text = val.replace(/[*_`]/g, '').trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      resultBlocks.push(`<h2 id="${id}" class="lbl-h2 mb-4 text-midnight scroll-mt-24">${parseInlineMarkdown(val)}</h2>`);
    } else if (trimmed.startsWith('### ')) {
      flushParagraph();
      const val = trimmed.substring(4);
      const text = val.replace(/[*_`]/g, '').trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      resultBlocks.push(`<h3 id="${id}" class="lbl-h3 mb-4 text-midnight scroll-mt-24">${parseInlineMarkdown(val)}</h3>`);
    } else if (trimmed === '') {
      flushParagraph();
    } else {
      currentBlock.push(line);
    }
  }

  // Flush any remaining block
  if (inHtmlBlock) {
    resultBlocks.push(currentBlock.join('\n'));
  } else {
    flushParagraph();
  }

  return resultBlocks.join('\n');
}

export function parseInlineMarkdown(text: string): string {
  let html = text;

  // 1. Signature bold italic matching: * **word** * -> <em class="font-serif italic font-semibold">word</em>
  // Also matches: * **word** * (with trailing spaces)
  html = html.replace(/\*\s*\*\*([^*]+)\*\*\s*\*/g, '<em class="font-serif italic font-semibold">$1</em>');
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<em class="font-serif italic font-semibold">$1</em>');

  // 2. Bold/Italic standard: *word* -> <em>word</em>, **word** -> <strong>word</strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="font-serif italic font-semibold">$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 3. Inline Images: ![alt](url) -> <img src="url" alt="alt" />
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" />'
  );

  // 4. Inline Links: [label](url) -> custom class link
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-midnight hover:text-bordeaux underline underline-offset-4 decoration-1 transition-colors" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return html;
}
