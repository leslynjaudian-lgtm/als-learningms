<template>
  <div class="rte-wrapper" :class="{ 'is-focused': isFocused }">
    <!-- Auto-Expanding Rich Text Content Area -->
    <div class="rte-content" @click="focusEditorOnEmptySpace">
      <EditorContent v-if="editor" :editor="editor" class="rte-editor-content" />
    </div>

    <!-- Bottom Formatting Toolbar (Google Forms style) -->
    <div class="rte-toolbar" role="toolbar" aria-label="Formatting options">
      <button
        type="button"
        class="rte-tool-btn"
        :class="{ 'is-active': editor?.isActive('bold') }"
        :aria-pressed="Boolean(editor?.isActive('bold'))"
        title="Bold (Ctrl+B)"
        aria-label="Bold"
        @mousedown.prevent
        @click="editor?.chain().focus().toggleBold().run()"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        </svg>
      </button>

      <button
        type="button"
        class="rte-tool-btn"
        :class="{ 'is-active': editor?.isActive('italic') }"
        :aria-pressed="Boolean(editor?.isActive('italic'))"
        title="Italic (Ctrl+I)"
        aria-label="Italic"
        @mousedown.prevent
        @click="editor?.chain().focus().toggleItalic().run()"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="19" y1="4" x2="10" y2="4" />
          <line x1="14" y1="20" x2="5" y2="20" />
          <line x1="15" y1="4" x2="9" y2="20" />
        </svg>
      </button>

      <button
        type="button"
        class="rte-tool-btn"
        :class="{ 'is-active': editor?.isActive('underline') }"
        :aria-pressed="Boolean(editor?.isActive('underline'))"
        title="Underline (Ctrl+U)"
        aria-label="Underline"
        @mousedown.prevent
        @click="editor?.chain().focus().toggleUnderline().run()"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
          <line x1="4" y1="21" x2="20" y2="21" />
        </svg>
      </button>

      <span class="rte-toolbar-sep" aria-hidden="true"></span>

      <button
        type="button"
        class="rte-tool-btn"
        :class="{ 'is-active': editor?.isActive('bulletList') }"
        :aria-pressed="Boolean(editor?.isActive('bulletList'))"
        title="Bulleted list"
        aria-label="Bulleted list"
        @mousedown.prevent
        @click="editor?.chain().focus().toggleBulletList().run()"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      </button>

      <button
        type="button"
        class="rte-tool-btn"
        :class="{ 'is-active': editor?.isActive('orderedList') }"
        :aria-pressed="Boolean(editor?.isActive('orderedList'))"
        title="Numbered list"
        aria-label="Numbered list"
        @mousedown.prevent
        @click="editor?.chain().focus().toggleOrderedList().run()"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <path d="M4 6h1v4" />
          <path d="M4 10h2" />
          <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { sanitizeRichText } from '../utils/sanitizeRichText.js';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Enter instructions or directions for this module...',
  },
});

const emit = defineEmits(['update:modelValue']);

const isFocused = ref(false);
let lastEmittedHtml = sanitizeRichText(props.modelValue);

const editor = useEditor({
  content: lastEmittedHtml,
  extensions: [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      codeBlock: false,
      code: false,
      strike: false,
      horizontalRule: false,
      dropcursor: false,
      gapcursor: false,
    }),
    Underline,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  onFocus() {
    isFocused.value = true;
  },
  onBlur() {
    isFocused.value = false;
  },
  onUpdate({ editor: ed }) {
    const html = ed.isEmpty ? '' : ed.getHTML();
    lastEmittedHtml = html;
    emit('update:modelValue', html);
  },
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (!editor.value) return;
    if (newVal === lastEmittedHtml) return;
    const normalized = sanitizeRichText(newVal);
    const currentHtml = editor.value.isEmpty ? '' : editor.value.getHTML();
    if (normalized !== currentHtml) {
      lastEmittedHtml = normalized;
      editor.value.commands.setContent(normalized || '', false);
    }
  }
);

function focusEditorOnEmptySpace(event) {
  if (!editor.value) return;
  if (event.target === event.currentTarget) {
    editor.value.commands.focus('end');
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
.rte-wrapper {
  width: 100%;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-sizing: border-box;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.rte-wrapper.is-focused {
  border-color: #2563eb;
  background: #ffffff;
}

.rte-content {
  width: 100%;
  background: #ffffff;
  cursor: text;
  box-sizing: border-box;
}

.rte-editor-content :deep(.ProseMirror) {
  min-height: 150px;
  padding: 0.65rem 0.85rem;
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.55;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  box-sizing: border-box;
  overflow-y: hidden;
  overflow-x: hidden;
  overflow-wrap: break-word;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.rte-editor-content :deep(.ProseMirror p) {
  margin: 0 0 0.5rem;
}

.rte-editor-content :deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

.rte-editor-content :deep(.ProseMirror ul) {
  margin: 0.35rem 0 0.5rem;
  padding-left: 1.35rem;
  list-style-type: disc;
}

.rte-editor-content :deep(.ProseMirror ol) {
  margin: 0.35rem 0 0.5rem;
  padding-left: 1.35rem;
  list-style-type: decimal;
}

.rte-editor-content :deep(.ProseMirror li) {
  margin-bottom: 0.2rem;
}

.rte-editor-content :deep(.ProseMirror li p) {
  margin: 0;
}

.rte-editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: #94a3b8;
  float: left;
  height: 0;
  pointer-events: none;
}

.rte-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.45rem 0.65rem;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

.rte-tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #475569;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.rte-tool-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.rte-tool-btn.is-active {
  background: #dbeafe;
  color: #1d4ed8;
}

.rte-toolbar-sep {
  width: 1px;
  height: 18px;
  background: #cbd5e1;
  margin: 0 0.25rem;
}
</style>

