import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import '/node_modules/bootstrap-icons/font/bootstrap-icons.css';
import '/node_modules/sweetalert2/dist/sweetalert2.min.css';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);