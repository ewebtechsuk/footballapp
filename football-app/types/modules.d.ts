declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const StyleSheet: any;
  export const FlatList: any;
  export const ActivityIndicator: any;
  export const Alert: any;
  export const Button: any;
  export const TextInput: any;
  export const ScrollView: any;
  export const TouchableOpacity: any;
  export const SafeAreaView: any;
  export const Platform: {
    OS: 'ios' | 'android' | 'web' | string;
    select: <T>(spec: { ios?: T; android?: T; default?: T }) => T | undefined;
  };
  const ReactNative: any;
  export default ReactNative;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  export default AsyncStorage;
}

declare module 'react-native-iap' {
  export type Product = any;
  export type Purchase = any;
  export type PurchaseUpdatedListener = { remove(): void };
  export type PurchaseErrorListener = { remove(): void };
  export const initConnection: () => Promise<boolean>;
  export const endConnection: () => void;
  export const getProducts: (productIds: string[]) => Promise<Product[]>;
  export const requestPurchase: (options: any) => Promise<void>;
  export const purchaseUpdatedListener: (
    listener: (purchase: Purchase) => void | Promise<void>
  ) => PurchaseUpdatedListener;
  export const purchaseErrorListener: (
    listener: (error: Error) => void
  ) => PurchaseErrorListener;
  export const getAvailablePurchases: () => Promise<Purchase[]>;
  export const finishTransaction: (options: any) => Promise<void>;
  export const flushFailedPurchasesCachedAsPendingAndroid: () => Promise<void>;
}

declare module '@react-navigation/native' {
  export const NavigationContainer: any;
  export const useNavigation: <T = any>() => T;
  export const useRoute: any;
  export const CommonActions: any;
  export const useFocusEffect: any;
}

declare module '@react-navigation/native-stack' {
  export type NativeStackNavigationProp<_ParamList> = any;
  export type NativeStackScreenProps<_ParamList, _RouteName = keyof _ParamList> = any;
  export const createNativeStackNavigator: <_ParamList>() => any;
}

declare module 'react-redux' {
  export const Provider: any;
  export const useDispatch: <T = any>() => T;
  export const useSelector: any;
  export const connect: any;
}

declare module '@reduxjs/toolkit' {
  export const configureStore: any;
  export const createSlice: any;
  export const createAsyncThunk: any;
  export type PayloadAction<T = any> = { payload: T };
}

declare module 'redux' {
  export const combineReducers: any;
  export type AnyAction = any;
}

declare module 'react-native-safe-area-context' {
  export const SafeAreaProvider: any;
  export const SafeAreaView: any;
}

declare module 'react-native-screens' {
  export const enableScreens: any;
}

declare module 'axios' {
  const axios: any;
  export default axios;
}

declare module 'firebase' {
  const firebase: any;
  export default firebase;
}

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}
