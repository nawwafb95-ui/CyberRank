import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export function AppShell() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}


