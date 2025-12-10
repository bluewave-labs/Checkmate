/// <reference types="vite/client" />
// Runtime config now provided via window.__ENV; import.meta.env keys are not used.
interface ImportMetaEnv {}
interface ImportMeta { readonly env: ImportMetaEnv }
