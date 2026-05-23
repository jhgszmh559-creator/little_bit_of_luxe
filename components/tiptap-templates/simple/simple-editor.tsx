"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"
import { Image as ImageIcon, Video as VideoIcon, Layers, BookOpenCheck, Sparkles, ClipboardList } from "lucide-react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import { DivNode, FigureNode, FigcaptionNode, FontSize, GlobalAttributes, IframeNode, VideoNode, AsideNode, DlNode, DtNode, DdNode } from "./custom-extensions"

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  onInsertCloudinary,
  onInsertVideo,
  onInsertGallery,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
  onInsertCloudinary?: () => void
  onInsertVideo?: () => void
  onInsertGallery?: () => void
}) => {
  return (
    <>

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarSeparator />

      <ToolbarGroup>
        <button
          type="button"
          onClick={onInsertCloudinary}
          className="text-[10px] uppercase font-bold tracking-wider px-2 py-1.5 hover:bg-ink/5 border border-ink/10 transition-colors text-ink rounded-none whitespace-nowrap min-h-[32px] flex items-center gap-1 cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5" /> Luxury Image
        </button>
        <button
          type="button"
          onClick={onInsertVideo}
          className="text-[10px] uppercase font-bold tracking-wider px-2 py-1.5 hover:bg-ink/5 border border-ink/10 transition-colors text-ink rounded-none whitespace-nowrap min-h-[32px] flex items-center gap-1 cursor-pointer"
        >
          <VideoIcon className="w-3.5 h-3.5" /> Luxury Video
        </button>
        <button
          type="button"
          onClick={onInsertGallery}
          className="text-[10px] uppercase font-bold tracking-wider px-2 py-1.5 hover:bg-ink/5 border border-ink/10 transition-colors text-ink rounded-none whitespace-nowrap min-h-[32px] flex items-center gap-1 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5" /> Luxury Gallery
        </button>
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor({ 
  content, 
  onUpdate, 
  onEditorReady,
  onInsertCloudinary,
  onInsertVideo,
  onInsertGallery
}: { 
  content: string
  onUpdate: (html: string) => void
  onEditorReady?: (editor: any) => void
  onInsertCloudinary?: () => void
  onInsertVideo?: () => void
  onInsertGallery?: () => void
}) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor prose max-w-none",
      },
      handleDrop(view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const files = Array.from(event.dataTransfer.files);
          const images = files.filter(file => file.type.startsWith('image/'));
          if (images.length > 0) {
            event.preventDefault();
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (coordinates) {
              images.forEach(async (file) => {
                try {
                  const url = await handleImageUpload(file);
                  const node = view.state.schema.nodes.image.create({ src: url, alt: file.name });
                  const transaction = view.state.tr.insert(coordinates.pos, node);
                  view.dispatch(transaction);
                } catch (err) {
                  console.error('Drop upload failed:', err);
                }
              });
            }
            return true;
          }
        }
        return false;
      },
      handlePaste(view, event, slice) {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
          const files = Array.from(event.clipboardData.files);
          const images = files.filter(file => file.type.startsWith('image/'));
          if (images.length > 0) {
            event.preventDefault();
            images.forEach(async (file) => {
              try {
                const url = await handleImageUpload(file);
                const node = view.state.schema.nodes.image.create({ src: url, alt: file.name });
                const transaction = view.state.tr.insert(view.state.selection.to, node);
                view.dispatch(transaction);
              } catch (err) {
                console.error('Paste upload failed:', err);
              }
            });
            return true;
          }
        }
        return false;
      }
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      DivNode,
      FigureNode,
      FigcaptionNode,
      FontSize,
      GlobalAttributes,
      IframeNode,
      VideoNode,
      AsideNode,
      DlNode,
      DtNode,
      DdNode,
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {
                  top: "76px",
                }),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
              onInsertCloudinary={onInsertCloudinary}
              onInsertVideo={onInsertVideo}
              onInsertGallery={onInsertGallery}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  )
}
