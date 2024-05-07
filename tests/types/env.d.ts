declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
      VITE_CLARIFAI_USER_ID: string;
      VITE_CLARIFAI_PAT: string;
    }
  }
}

// Since this file has no import/export statements, the TypeScript compiler treats it as a script
// convert it into a module by adding an empty export statement.
export {};
