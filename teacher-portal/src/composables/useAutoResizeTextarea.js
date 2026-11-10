import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

/**
 * Resize a textarea element to fit its content while respecting a minimum height.
 * Resets height before reading scrollHeight so the textarea also shrinks when text is removed.
 */
export function resizeTextareaElement(el, minHeight = 150) {
  if (!el || !el.isConnected) return;
  if (el.offsetParent === null && window.getComputedStyle(el).display === 'none') return;

  el.style.minHeight = `${minHeight}px`;
  el.style.height = `${minHeight}px`;

  const computed = window.getComputedStyle(el);
  const borderTop = parseFloat(computed.borderTopWidth) || 0;
  const borderBottom = parseFloat(computed.borderBottomWidth) || 0;
  const contentHeight = el.scrollHeight + borderTop + borderBottom;

  el.style.height = `${Math.max(minHeight, contentHeight)}px`;
}

/**
 * Composable for an auto-expanding textarea bound to a reactive text getter.
 * Handles initial mount, programmatic value loads, input/paste events, and window resize.
 */
export function useAutoResizeTextarea(getValue, { minHeight = 150 } = {}) {
  const textareaRef = ref(null);

  function resize() {
    nextTick(() => {
      resizeTextareaElement(textareaRef.value, minHeight);
    });
  }

  function handlePaste() {
    nextTick(() => {
      resizeTextareaElement(textareaRef.value, minHeight);
    });
  }

  watch(getValue, () => {
    resize();
  });

  onMounted(() => {
    resize();
    window.addEventListener('resize', resize);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize);
  });

  return {
    textareaRef,
    resize,
    handlePaste,
  };
}

