// Web-only shim: remove deprecated `pointerEvents` prop coming from react-native
// Some RN libraries pass `pointerEvents` which is deprecated on the web and triggers
// DevTools warnings. This shim strips `pointerEvents` from props before elements
// are created on web by monkey-patching React.createElement.
import * as React from 'react';

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const origCreateElement = React.createElement;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (React as any).createElement = function patchedCreateElement(type: any, props: any, ...children: any[]) {
    if (props && typeof props === 'object' && 'pointerEvents' in props) {
      // create a shallow copy without pointerEvents
      // avoid mutating the original props object
      const { pointerEvents, ...rest } = props;
      return origCreateElement(type, rest, ...children);
    }
    return origCreateElement(type, props, ...children);
  };
}

export {};
