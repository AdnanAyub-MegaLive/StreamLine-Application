import axios from 'axios';
import { apiClient } from './client';

export class AgencyApplicationError extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.name = 'AgencyApplicationError';
    this.code = code;
  }
}

// POST /api/agencies/apply — see docs/agency-application-spec.md (endpoint
// to be added on StreamLine-Portal). Sent as multipart/form-data because of
// the two CNIC images; each image is a local file uri straight from the
// image picker.
export async function submitAgencyApplication(sessionToken, input) {
  const form = new FormData();
  form.append('agencyName', input.agencyName.trim());
  form.append('whatsapp', input.whatsapp.trim());
  form.append('bdCode', input.bdCode.trim());
  if (input.email) {
    form.append('email', input.email.trim().toLowerCase());
  }
  form.append('cnicFront', {
    uri: input.cnicFront.uri,
    type: input.cnicFront.type ?? 'image/jpeg',
    name: input.cnicFront.fileName ?? 'cnic-front.jpg'
  });
  form.append('cnicBack', {
    uri: input.cnicBack.uri,
    type: input.cnicBack.type ?? 'image/jpeg',
    name: input.cnicBack.fileName ?? 'cnic-back.jpg'
  });
  try {
    const response = await apiClient.post('/api/agencies/apply', form, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data?.data ?? {};
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new AgencyApplicationError(message ?? 'Application failed.', code);
    }
    throw new AgencyApplicationError('Could not reach the server. Try again.', 'NETWORK');
  }
}
