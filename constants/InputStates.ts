export const INPUT_STATES = {
  default: {
    border: '#e0e0e0',
    background: '#ffffff',
    text: '#333333',
    borderWidth: 1,
  },
  selected: {
    border: '#c17ec9',
    background: '#F6EAF6',
    text: '#333333',
    borderWidth: 1.5,
  },
  focused: {
    border: '#c17ec9',
    background: '#ffffff',
    text: '#333333',
    borderWidth: 1.5,
  },
  error: {
    border: '#ff0000',
    background: '#ffffff',
    text: '#333333',
    borderWidth: 1,
  },
} as const;

export type InputState = keyof typeof INPUT_STATES;
