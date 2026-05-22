import { Extension, Node as TiptapNode, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    }
  }
}

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, '') || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).run();
      },
    };
  },
});

export const GlobalAttributes = Extension.create({
  name: 'globalAttributes',
  addGlobalAttributes() {
    return [
      {
        types: [
          'paragraph',
          'heading',
          'textStyle',
          'image',
          'divNode',
          'figureNode',
          'figcaptionNode',
          'iframeNode',
          'videoNode',
          'asideNode',
          'dlNode',
          'dtNode',
          'ddNode'
        ],
        attributes: {
          class: {
            default: null,
            parseHTML: element => element.getAttribute('class') || element.getAttribute('className'),
            renderHTML: attributes => {
              if (!attributes.class) return {};
              return { class: attributes.class };
            },
          },
          style: {
            default: null,
            parseHTML: element => element.getAttribute('style'),
            renderHTML: attributes => {
              if (!attributes.style) return {};
              return { style: attributes.style };
            },
          },
          id: {
            default: null,
            parseHTML: element => element.getAttribute('id'),
            renderHTML: attributes => {
              if (!attributes.id) return {};
              return { id: attributes.id };
            },
          }
        }
      }
    ]
  }
});

export const DivNode = TiptapNode.create({
  name: 'divNode',
  group: 'block',
  content: 'block*',
  defining: true,
  parseHTML() {
    return [{ tag: 'div' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },
});

export const FigureNode = TiptapNode.create({
  name: 'figureNode',
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML() {
    return [{ tag: 'figure' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes), 0];
  },
});

export const FigcaptionNode = TiptapNode.create({
  name: 'figcaptionNode',
  group: 'inline',
  inline: true,
  content: 'inline*',
  defining: true,
  parseHTML() {
    return [{ tag: 'figcaption' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['figcaption', mergeAttributes(HTMLAttributes), 0];
  },
});

export const IframeNode = TiptapNode.create({
  name: 'iframeNode',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,
  addAttributes() {
    return {
      src: {
        default: null,
      },
      allow: {
        default: null,
      },
      allowfullscreen: {
        default: 'true',
        parseHTML: element => element.hasAttribute('allowfullscreen') ? 'true' : null,
        renderHTML: attributes => {
          if (!attributes.allowfullscreen) return {};
          return { allowfullscreen: 'true' };
        },
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      frameborder: {
        default: null,
      },
    };
  },
  parseHTML() {
    return [{ tag: 'iframe' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['iframe', mergeAttributes(HTMLAttributes)];
  },
});

export const VideoNode = TiptapNode.create({
  name: 'videoNode',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,
  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: 'true',
        parseHTML: element => element.hasAttribute('controls') ? 'true' : null,
        renderHTML: attributes => {
          if (!attributes.controls) return {};
          return { controls: 'true' };
        },
      },
      autoplay: {
        default: null,
        parseHTML: element => element.hasAttribute('autoplay') ? 'true' : null,
        renderHTML: attributes => {
          if (!attributes.autoplay) return {};
          return { autoplay: 'true' };
        },
      },
      loop: {
        default: null,
        parseHTML: element => element.hasAttribute('loop') ? 'true' : null,
        renderHTML: attributes => {
          if (!attributes.loop) return {};
          return { loop: 'true' };
        },
      },
      muted: {
        default: null,
        parseHTML: element => element.hasAttribute('muted') ? 'true' : null,
        renderHTML: attributes => {
          if (!attributes.muted) return {};
          return { muted: 'true' };
        },
      },
      playsinline: {
        default: null,
        parseHTML: element => element.hasAttribute('playsinline') ? 'true' : null,
        renderHTML: attributes => {
          if (!attributes.playsinline) return {};
          return { playsinline: 'true' };
        },
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      poster: {
        default: null,
      },
    };
  },
  parseHTML() {
    return [{ tag: 'video' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes)];
  },
});

export const AsideNode = TiptapNode.create({
  name: 'asideNode',
  group: 'block',
  content: 'block*',
  defining: true,
  parseHTML() {
    return [{ tag: 'aside' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['aside', mergeAttributes(HTMLAttributes), 0];
  },
});

export const DlNode = TiptapNode.create({
  name: 'dlNode',
  group: 'block',
  content: 'block*',
  defining: true,
  parseHTML() {
    return [{ tag: 'dl' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['dl', mergeAttributes(HTMLAttributes), 0];
  },
});

export const DtNode = TiptapNode.create({
  name: 'dtNode',
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML() {
    return [{ tag: 'dt' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['dt', mergeAttributes(HTMLAttributes), 0];
  },
});

export const DdNode = TiptapNode.create({
  name: 'ddNode',
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML() {
    return [{ tag: 'dd' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['dd', mergeAttributes(HTMLAttributes), 0];
  },
});
