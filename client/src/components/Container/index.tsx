import React, { useEffect, useRef, useState } from 'react';
import './Container.css';
import Header from '../Header';
import { Outlet } from 'react-router-dom';

const Container = () => {
  return (
    <div className="container">
      <Header />
      <main>
        <Outlet />
      </main>
      <div className="bg"></div>
    </div>
  );
};

export default Container;
