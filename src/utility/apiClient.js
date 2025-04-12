// src/api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // This will be prefixed to all requests
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

export default apiClient;