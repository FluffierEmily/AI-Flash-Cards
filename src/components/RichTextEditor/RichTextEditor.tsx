import { useEffect, useState, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Code2,
  Eraser,
} from "lucide-react"
import "./RichTextEditor.css"

// Create lowlight instance loaded with common languages
const lowlight = createLowlight(common)

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isCodeBlockFocused, setIsCodeBlockFocused] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("plaintext")
  const containerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable standard codeBlock to use CodeBlockLowlight instead
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Return HTML format of rich text
      onChange(editor.getHTML())
    },
    onFocus: () => {
      if (editor?.isActive("codeBlock")) {
        setIsCodeBlockFocused(true)
        setCurrentLanguage(editor.getAttributes("codeBlock").language || "plaintext")
      }
    },
    onBlur: () => {
      setTimeout(() => {
        const activeEl = document.activeElement
        const isInside = containerRef.current && containerRef.current.contains(activeEl)
        if (isInside && activeEl?.tagName === "SELECT") {
          return
        }
        setIsCodeBlockFocused(false)
      }, 50)
    },
    onSelectionUpdate: ({ editor }) => {
      if (editor.isFocused) {
        setIsCodeBlockFocused(editor.isActive("codeBlock"))
        if (editor.isActive("codeBlock")) {
          setCurrentLanguage(editor.getAttributes("codeBlock").language || "plaintext")
        }
      }
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[120px] max-h-[250px] overflow-y-auto prose dark:prose-invert max-w-none",
      },
    },
  })

  // Watch for external content updates (e.g. resetting answer field)
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  // The editor is considered in its default empty state ONLY when it has
  // exactly one child node, and that node is an empty paragraph.
  const isDefaultEmpty =
    editor.isEmpty &&
    editor.state.doc.childCount === 1 &&
    editor.state.doc.firstChild?.type.name === "paragraph"

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border border-border bg-background transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden"
    >
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${editor.isActive("bold")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${editor.isActive("italic")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${editor.isActive("bulletList")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${editor.isActive("orderedList")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${editor.isActive("code")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${editor.isActive("codeBlock")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          title="Code Block"
        >
          <Code2 className="h-4 w-4" />
        </button>

        {/* Language selector - visible only when inside a code block and editor is focused */}
        {isCodeBlockFocused && (
          <select
            value={currentLanguage}
            onChange={(e) => {
              const lang = e.target.value
              setCurrentLanguage(lang)
              editor
                .chain()
                .focus()
                .updateAttributes("codeBlock", { language: lang })
                .run()
            }}
            onBlur={() => {
              setTimeout(() => {
                if (editor.isFocused) {
                  return
                }
                setIsCodeBlockFocused(false)
              }, 50)
            }}
            className="text-xs font-semibold px-2 py-1 rounded-lg border border-border bg-background hover:bg-secondary outline-none cursor-pointer transition-colors max-w-[120px] text-foreground ml-1"
          >
            <option value="plaintext">Plain Text</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="python">Python</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
            <option value="cpp">C++</option>
            <option value="json">JSON</option>
            <option value="bash">Bash/Shell</option>
            <option value="sql">SQL</option>
          </select>
        )}

        <div className="w-px h-5 bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer ml-auto"
          title="Clear Formatting"
        >
          <Eraser className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="relative">
        <EditorContent editor={editor} />
        {placeholder && isDefaultEmpty && (
          <div className="absolute top-4 left-4 text-sm text-muted-foreground pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}
