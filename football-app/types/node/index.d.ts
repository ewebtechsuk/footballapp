declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
  [key: string]: any;
};

declare var require: any;
declare var module: any;
declare var __dirname: string;
