// Axios interceptor that mocks all backend API calls
// Import this file once (in index.js) to activate mock mode
import axios from 'axios';
import { handleMockRequest } from './mockData';

const API_PREFIX = '/api';

axios.interceptors.request.use((config) => {
  // Extract the API path from the full URL
  const url = config.url || '';
  const apiIndex = url.indexOf(API_PREFIX);
  if (apiIndex === -1) return config; // Not an API call, let it pass through

  const path = url.substring(apiIndex + API_PREFIX.length).split('?')[0];

  // Parse body
  let body = {};
  if (config.data) {
    if (typeof config.data === 'string') {
      try { body = JSON.parse(config.data); } catch (e) { /* ignore */ }
    } else if (config.data instanceof FormData) {
      body = { _isFormData: true };
    } else {
      body = config.data;
    }
  }

  // Parse query params and attach to body for handler access
  const queryString = (url.split('?')[1]) || '';
  if (queryString) {
    const params = Object.fromEntries(new URLSearchParams(queryString));
    body._params = params;
    body._fullUrl = url.substring(apiIndex + API_PREFIX.length);
  }

  // Get mock response
  const result = handleMockRequest(config.method, path, body);

  // Override the adapter to return mock data without making a real request
  config.adapter = () => {
    return new Promise((resolve, reject) => {
      // Simulate a tiny network delay for realism
      setTimeout(() => {
        if (result.error) {
          reject({
            response: {
              data: { detail: result.error },
              status: result.status || 400,
              statusText: 'Error',
              headers: {},
              config
            }
          });
        } else {
          resolve({
            data: result.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          });
        }
      }, 50);
    });
  };

  return config;
});

console.log('%c[Mock Mode] All API calls are mocked — no backend needed', 'color: #0055FF; font-weight: bold;');
