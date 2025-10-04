import React, { useEffect, PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setPremium, PREMIUM_ENTITLEMENT_STORAGE_KEY } from '../store/slices/premiumSlice';
import type { AppDispatch } from '../store';

const PremiumBootstrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const hydrate = async () => {
      const storedValue = await AsyncStorage.getItem(PREMIUM_ENTITLEMENT_STORAGE_KEY);
      dispatch(setPremium(storedValue === 'true'));
    };

    hydrate();
  }, [dispatch]);

  return <>{children}</>;
};

export default PremiumBootstrapper;
