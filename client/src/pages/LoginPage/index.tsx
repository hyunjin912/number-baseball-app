import React, { useState, useEffect } from 'react';
import Login from '../../components/Login';
import { useAuthContext } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { view } = useAuthContext();

  return <>{view && <Login />}</>;
}
