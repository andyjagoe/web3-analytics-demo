import React from 'react';
import ReactDOM from 'react-dom';
import Analytics from 'analytics';
import { AnalyticsProvider } from 'use-analytics';
import googleAnalytics from '@analytics/google-analytics';
import web3Analytics from 'analytics-plugin-web3analytics';
import './index.css';
import Application from './views/Application';
import reportWebVitals from './reportWebVitals';

/* Initialize analytics & load plugins */
const analytics = Analytics({
  app: 'awesome-app',
  plugins: [
    googleAnalytics({
      trackingId: 'UA-48308168-2',
    }),
    web3Analytics({
      appId: process.env.APP_ID,
      jsonRpcUrl: process.env.NODE_URL,
      logLevel: "debug"
    })
  ]
})

ReactDOM.render(
  <React.StrictMode>
    <AnalyticsProvider instance={analytics}>
      <Application />
    </AnalyticsProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();