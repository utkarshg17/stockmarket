import React from 'react';
import ReactDOM from 'react-dom/client';
import StockMarketFetcher from './StockMarketFetcher';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <StockMarketFetcher />
  </React.StrictMode>
);
