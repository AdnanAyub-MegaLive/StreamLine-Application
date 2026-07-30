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

// POST /api/agencies/apply — see StreamLine-Portal's
// docs/mobile-agency-application-api.md. Sent as multipart/form-data
// because of the two CNIC images; each image is a local file uri straight
// from the image picker. The backend allows only one PENDING application
// per user and answers a second attempt with ALREADY_APPLIED (409) — the
// caller (CreateAgencyScreen) treats that the same as a successful submit,
// since it means one is already on file.
export async function submitAgencyApplication(sessionToken, input) {
  const form = new FormData();
  form.append('agencyName', input.agencyName.trim());
  form.append('whatsapp', input.whatsapp.trim());
  form.append('bdCode', input.bdCode.trim());
  if (input.email) {
    form.append('email', input.email.trim().toLowerCase());
  }
  if (input.cnicFront) {
    form.append('cnicFront', {
      uri: input.cnicFront.uri,
      type: input.cnicFront.type ?? 'image/jpeg',
      name: input.cnicFront.fileName ?? 'cnic-front.jpg'
    });
  }
  if (input.cnicBack) {
    form.append('cnicBack', {
      uri: input.cnicBack.uri,
      type: input.cnicBack.type ?? 'image/jpeg',
      name: input.cnicBack.fileName ?? 'cnic-back.jpg'
    });
  }
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

// GET /api/agencies/my-application — see docs/agency-status-check-spec.md
// (endpoint requested, not yet built on StreamLine-Portal as of this
// writing). Lets CreateAgencyScreen know a PENDING application already
// exists before the user ever taps Submit — without this, the app could
// only find out by attempting a submission and getting ALREADY_APPLIED
// back, which meant a genuinely pending application (created outside this
// device, e.g. a prior install or a different device) still showed the
// blank form until resubmitted once. Fails silently (returns null) so an
// older backend build without this endpoint yet just falls back to
// today's behavior instead of erroring.
export async function fetchMyAgencyApplication(sessionToken) {
  try {
    const response = await apiClient.get('/api/agencies/my-application', {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data?.data?.application ?? null;
  } catch {
    return null;
  }
}
