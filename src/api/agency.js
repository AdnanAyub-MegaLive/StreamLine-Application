import axios from 'axios';
import { apiClient } from './client';

export class AgencyApplicationError extends Error {
  code;
  fields;
  constructor(message, code, fields) {
    super(message);
    this.name = 'AgencyApplicationError';
    this.code = code;
    this.fields = fields;
  }
}

// POST /api/agencies/apply — plain JSON now (the backend dropped the
// email/CNIC-image requirements it used to have; only agencyName/whatsapp/
// bdCode are required, matching exactly what CreateAgencyScreen collects,
// so there's no more need for multipart/form-data at all).
// Possible error codes: ALREADY_APPLIED (a PENDING application already
// exists — CreateAgencyScreen treats this the same as a successful
// submit), ALREADY_HAS_AGENCY (an APPROVED application already exists —
// nothing to do, they already have an agency), and
// ADMIN_ID_ATTEMPT_LIMIT_REACHED (3 rejected applications already used
// this same Admin ID — must use a different one).
export async function submitAgencyApplication(sessionToken, input) {
  try {
    const response = await apiClient.post('/api/agencies/apply', {
      agencyName: input.agencyName.trim(),
      whatsapp: input.whatsapp.trim(),
      bdCode: input.bdCode.trim()
    }, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data?.data ?? {};
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message, fields } = error.response.data.error;
      throw new AgencyApplicationError(message ?? 'Application failed.', code, fields);
    }
    throw new AgencyApplicationError('Could not reach the server. Try again.', 'NETWORK');
  }
}

// GET /api/agencies/my-application — lets CreateAgencyScreen know a
// PENDING/APPROVED application already exists before the user ever taps
// Submit — without this, the app could only find out by attempting a
// submission and getting ALREADY_APPLIED/ALREADY_HAS_AGENCY back, which
// meant a genuinely pending application (created outside this device, e.g.
// a prior install or a different device) still showed the blank form until
// resubmitted once. Returns null for a REJECTED latest application too —
// the backend allows reapplying (up to 3 times per Admin ID) in that case,
// so the form should show as blank/ready, not "already applied". Fails
// silently (returns null) on any request error so an older/unreachable
// backend just falls back to today's behavior instead of erroring.
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
