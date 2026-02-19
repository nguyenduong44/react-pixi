/// <reference types="vite/client" />

// Allow importing PNG (and other image formats) as URL strings via Vite
declare module '*.png' {
  const url: string;
  export default url;
}
declare module '*.jpg' {
  const url: string;
  export default url;
}
declare module '*.jpeg' {
  const url: string;
  export default url;
}
declare module '*.svg' {
  const url: string;
  export default url;
}
