/**
 * Input field state configurations
 * 
 * Defines visual styles for different input states including colors, backgrounds, and border widths.
 * Used for consistent input styling across the application.
 */
export const INPUT_STATES = {
  /** Default state styling for input fields */
  default: {
    border: '#e0e0e0',
    background: '#ffffff',
    text: '#333333',
    borderWidth: 1,
  },
  /** Selected state styling for input fields */
  selected: {
    border: '#c17ec9',
    background: '#F6EAF6',
    text: '#333333',
    borderWidth: 1.5,
  },
  /** Focused state styling for input fields */
  focused: {
    border: '#c17ec9',
    background: '#ffffff',
    text: '#333333',
    borderWidth: 1.5,
  },
  /** Error state styling for input fields */
  error: {
    border: '#ff0000',
    background: '#ffffff',
    text: '#333333',
    borderWidth: 1,
  },
} as const;

/**
 * Type definition for input state keys
 */
export type InputState = keyof typeof INPUT_STATES;
