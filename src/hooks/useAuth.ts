'use client';

import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { adminLogin, logout } from '@/features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  return {
    ...auth,
    login: (email: string, password: string) =>
      dispatch(adminLogin({ email, password })),
    logout: () => dispatch(logout()),
  };
};
