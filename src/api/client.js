import axios from 'axios';
import { appEnv } from '../config/env';
export const apiClient = axios.create({
  baseURL: appEnv.apiBaseUrl,
  timeout: 15000
});
