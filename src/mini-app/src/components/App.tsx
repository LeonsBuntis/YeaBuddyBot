import { isMiniAppDark, retrieveLaunchParams, useSignal } from '@telegram-apps/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { useMemo } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { routes } from '@/navigation/routes.tsx';

export function App() {
  const lp = useMemo(() => retrieveLaunchParams(), []);
  const isDark = useSignal(isMiniAppDark);

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['ios', 'macos'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
    >
      <HashRouter>
        <Routes>
          {routes.map((route) => <Route key={route.path} {...route} />)}
          <Route element={<Navigate to="/"/>} path="*"/>
        </Routes>
      </HashRouter>
    </AppRoot>
  );
}
