declare module 'react' {
  export type ReactNode = any;
  export type PropsWithChildren<P = Record<string, unknown>> = P & { children?: ReactNode };
  export type FC<P = Record<string, unknown>> = (props: PropsWithChildren<P>) => ReactNode;

  const React: any;
  export default React;
  export as namespace React;

  export const useState: any;
  export const useEffect: any;
  export const useMemo: any;
  export const useCallback: any;
  export const useRef: any;
  export const useContext: any;
  export const useReducer: any;
  export const useLayoutEffect: any;
}

declare namespace React {
  type ReactNode = any;
  type PropsWithChildren<P = Record<string, unknown>> = P & { children?: ReactNode };
  interface FunctionComponent<P = Record<string, unknown>> {
    (props: PropsWithChildren<P>): ReactNode;
  }
  type FC<P = Record<string, unknown>> = FunctionComponent<P>;
}
