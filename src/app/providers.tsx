'use client';

import React from 'react';
import ReduxProvider from '@/providers/ReduxProvider';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ReduxProvider>{children}</ReduxProvider>;
}