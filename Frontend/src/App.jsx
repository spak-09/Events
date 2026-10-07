import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { Providers } from './app/providers';

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

export default App;
