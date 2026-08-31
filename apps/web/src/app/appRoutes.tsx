import { Suspense, lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DemoPage } from '@/pages/DemoPage';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { RootShell } from './RootShell';

const MainLayout = lazy(async () => ({
  default: (await import('@/components/layout/MainLayout')).MainLayout,
}));

const appRoutes: RouteObject[] = [
  {
    element: <RootShell />,
    children: __DEMO_SITE__
      ? [
          { index: true, element: <Navigate to="/demo" replace /> },
          { path: '/demo/*', element: <DemoPage /> },
          { path: '*', element: <Navigate to="/demo" replace /> },
        ]
      : [
          { path: '/login', element: <LoginPage /> },
          {
            path: '/*',
            element: (
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner size={28} />}>
                  <MainLayout />
                </Suspense>
              </ProtectedRoute>
            ),
          },
        ],
  },
];

export const createAppRoutes = (): RouteObject[] => appRoutes;
