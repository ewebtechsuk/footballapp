declare namespace React {
  type ReactNode = any;
  interface FC<P = {}> {
    (props: P & { children?: ReactNode }): JSX.Element | null;
  }
}

declare module 'react' {
  export type ReactNode = any;
  export interface FC<P = {}> {
    (props: P & { children?: ReactNode }): JSX.Element | null;
  }
  export const createElement: any;
  export const Fragment: any;
  export const createContext: any;
  export const useState: <T = any>(initialState: T) => [T, (value: T) => void];
  export const useEffect: (effect: () => void | (() => void), deps?: ReadonlyArray<any>) => void;
  export const useMemo: <T>(factory: () => T, deps: ReadonlyArray<any>) => T;
  export const useCallback: <T extends (...args: any[]) => any>(callback: T, deps: ReadonlyArray<any>) => T;
  export const useRef: <T = any>(initialValue: T) => { current: T };
  export const useContext: any;
  export const useReducer: any;
  export const useLayoutEffect: any;
  export const useImperativeHandle: any;
  export const memo: any;
  const React: any;
  export default React;
}

declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const StyleSheet: any;
  export const TouchableOpacity: any;
  export const ScrollView: any;
  export const SafeAreaView: any;
  export const FlatList: any;
  export const TextInput: any;
  export const Alert: any;
  export const ActivityIndicator: any;
  export const Image: any;
  export const Platform: any;
  export const Linking: any;
  export const Button: any;
  const ReactNative: any;
  export default ReactNative;
}

declare module 'react-native-safe-area-context' {
  export const SafeAreaProvider: any;
  export const SafeAreaView: any;
  export const useSafeAreaInsets: any;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };

  export default AsyncStorage;
}

declare module '@react-navigation/native' {
  export const NavigationContainer: any;
  export function useNavigation<T = any>(): T;
  export function useRoute<T = any>(): T;
  export function useFocusEffect(effect: (...args: any[]) => void): void;
}

declare module '@react-navigation/native-stack' {
  export function createNativeStackNavigator<T = any>(): {
    Navigator: any;
    Screen: any;
  };
  export type NativeStackNavigationProp<ParamList = any, RouteName extends keyof ParamList = any> = any;
}

declare module 'react-redux' {
  export const Provider: any;
  export type TypedUseSelectorHook<TState> = (selector: (state: TState) => any) => any;
  export function useDispatch<TDispatch = any>(): TDispatch;
  export function useSelector<TSelected>(selector: (state: any) => TSelected): TSelected;
}

declare module '@reduxjs/toolkit' {
  export const configureStore: any;
  export const createSlice: any;
  export const createAsyncThunk: any;
  export type PayloadAction<T = any> = { payload: T };
}

declare module 'react-native-google-mobile-ads' {
  export default function mobileAds(): {
    initialize: () => Promise<void>;
    setRequestConfiguration: (config: any) => Promise<void>;
  };
  export const MobileAds: any;
  export const BannerAd: any;
  export const BannerAdSize: any;
  export const TestIds: any;
  export const MaxAdContentRating: {
    G: string;
    PG: string;
    T: string;
    MA: string;
  };
  export function useRewardedAd(adUnitId: string, options?: any): {
    isLoaded: boolean;
    isClosed: boolean;
    load: () => void;
    show: () => void;
    reward: { type: string; amount: number } | null;
    error: { message: string } | null;
  };
  export const AdEventType: any;
  export class RewardedAd {
    static createForAdRequest(adUnitId: string, options?: any): RewardedAd;
    load: () => void;
    show: () => void;
    addAdEventListener: (...args: any[]) => () => void;
  }
}

declare module 'react-native-iap' {
  export type Product = {
    productId: string;
    title: string;
    description: string;
    price: string;
    currency?: string;
  };

  export type ProductPurchase = {
    productId: string;
    transactionId: string;
    transactionReceipt: string | null;
  };

  export type PurchaseError = {
    code: string;
    message: string;
  };

  export type PurchaseResult = ProductPurchase;

  export const initConnection: () => Promise<boolean>;
  export const flushFailedPurchasesCachedAsPendingAndroid: () => Promise<void>;
  export const endConnection: () => Promise<void>;
  export const getProducts: (productIds: string[]) => Promise<Product[]>;
  export const requestPurchase: (productId: string, ...args: any[]) => Promise<PurchaseResult>;
  export const finishTransaction: (purchase: ProductPurchase, ...args: any[]) => Promise<void>;
  export const getAvailablePurchases: () => Promise<ProductPurchase[]>;
  export const purchaseUpdatedListener: (listener: (purchase: ProductPurchase) => void) => {
    remove: () => void;
  };
  export const purchaseErrorListener: (listener: (error: PurchaseError) => void) => {
    remove: () => void;
  };
}

declare module 'firebase/app' {
  const FirebaseApp: any;
  export default FirebaseApp;
}

declare module 'firebase/auth' {
  export const getAuth: any;
}

declare module 'firebase/firestore' {
  export const getFirestore: any;
}

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare namespace JSX {
  type Element = any;
  interface ElementClass {}
  interface ElementAttributesProperty { props: any; }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare var process: {
  env: Record<string, string | undefined>;
};

declare const __DEV__: boolean;
