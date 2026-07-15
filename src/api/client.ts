import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://example.com/api',
  timeout: 15000,
});
