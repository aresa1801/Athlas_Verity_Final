// WCAG 2.1 AA Compliance Utilities

export const ACCESSIBLE_COLORS = {
  // Text on dark backgrounds (4.5:1+ contrast ratio)
  text: {
    primary: '#F5F5F5', // oklch(0.98 0 0)
    secondary: '#A6A6A6', // oklch(0.65 0 0)
    muted: '#666666', // oklch(0.45 0 0)
  },
  // Interactive elements
  interactive: {
    emerald: '#10B981', // oklch(0.56 0.16 142)
    blue: '#3B82F6', // oklch(0.60 0.18 262)
    amber: '#F59E0B', // oklch(0.65 0.18 70)
    destructive: '#EF4444', // oklch(0.58 0.20 27)
  },
  // Focus indicators
  focus: {
    ring: '#10B981', // oklch(0.56 0.16 142)
    offset: 2,
  },
}

// Semantic HTML structure guidelines
export const SEMANTIC_ELEMENTS = {
  landmark: ['main', 'header', 'footer', 'nav', 'section', 'article', 'aside'],
  heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  form: ['form', 'fieldset', 'label', 'input', 'textarea', 'select', 'button'],
  list: ['ul', 'ol', 'li'],
  table: ['table', 'thead', 'tbody', 'tr', 'th', 'td'],
}

// Keyboard navigation patterns
export const KEYBOARD_KEYS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  TAB: 'Tab',
  SPACE: ' ',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
}

// Focus management utilities
export function setFocus(selector: string) {
  const element = document.querySelector(selector) as HTMLElement
  if (element) {
    element.focus()
    // Scroll into view if off-screen
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

export function trapFocus(container: HTMLElement, initialFocus?: string) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  if (initialFocus) {
    const initial = container.querySelector(initialFocus) as HTMLElement
    if (initial) initial.focus()
  } else {
    firstElement?.focus()
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== KEYBOARD_KEYS.TAB) return

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus()
        event.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus()
        event.preventDefault()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}

// Skip link for keyboard navigation
export function createSkipLink(targetSelector: string) {
  return {
    className: 'sr-only focus:not-sr-only',
    href: `#${targetSelector.replace('#', '')}`,
    children: 'Skip to main content',
  }
}

// ARIA label generation
export function generateAriaLabel(field: string, value: string) {
  return `${field}: ${value}`
}

// Form accessibility helpers
export function createFormGroup(fieldName: string, isRequired = false) {
  return {
    id: fieldName.toLowerCase().replace(/\s+/g, '-'),
    ariaRequired: isRequired,
    ariaDescribedBy: `${fieldName.toLowerCase().replace(/\s+/g, '-')}-hint`,
  }
}

// Announce changes to screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    announcement.remove()
  }, 3000)
}

// Validate color contrast ratio (WCAG AA: 4.5:1 for normal text)
export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

function getLuminance(color: string): number {
  const rgb = parseInt(color.replace('#', ''), 16)
  const r = (rgb >> 16) & 255
  const g = (rgb >> 8) & 255
  const b = rgb & 255

  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Image alt text guidelines
export const ALT_TEXT_GUIDELINES = {
  decorative: '', // Empty alt for decorative images
  functional: 'Brief description of action or purpose',
  informative: 'Concise description of image content',
  complex: 'Summary with link to full description',
}

// Responsive text sizing for readability
export const FONT_SIZES = {
  xs: 'text-xs leading-4', // 12px
  sm: 'text-sm leading-5', // 14px
  base: 'text-base leading-6', // 16px (default)
  lg: 'text-lg leading-7', // 18px
  xl: 'text-xl leading-8', // 20px
}
