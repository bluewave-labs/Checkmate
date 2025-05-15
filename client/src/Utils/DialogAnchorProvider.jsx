import { useRef } from 'react';
let DialogAnchorRef;

export const DialogAnchorProvider = ({anchor,  children }) => {
  DialogAnchorRef = anchor;

  return children;
}

export { DialogAnchorRef };