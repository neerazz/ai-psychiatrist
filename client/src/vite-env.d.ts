/// <reference types="vite/client" />

interface Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

declare module '*.md?raw' {
  const content: string;
  export default content;
}
