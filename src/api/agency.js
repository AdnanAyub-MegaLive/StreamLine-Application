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

export class AgencyJoinError extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.name = 'AgencyJoinError';
    this.code = code;
  }
}

// GET /api/agencies — see docs/join-agency-api-spec.md (requested, not yet
// built on StreamLine-Portal as of this writing). Lists active agencies a
// user can request to join, optionally filtered by a search string. Throws
// on failure (unlike fetchMyAgencyApplication) since JoinAgencyScreen needs
// to show a real "couldn't load" state rather than silently rendering an
// empty list, which would look identical to "no agencies exist yet".
export async function fetchAgencies(sessionToken, query) {
  const response = await apiClient.get('/api/agencies', {
    headers: { Authorization: `Bearer ${sessionToken}` },
    params: query ? { q: query } : undefined
  });
  return response.data?.data?.agencies ?? [];
}

// POST /api/agencies/:agencyId/join — see docs/join-agency-api-spec.md.
// Requests to join an existing agency as a host; like submitAgencyApplication,
// this is a request that needs approval (by the agency owner or an admin),
// not an instant join.
export async function requestJoinAgency(sessionToken, agencyId) {
  try {
    const response = await apiClient.post(`/api/agencies/${agencyId}/join`, {}, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data?.data ?? {};
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new AgencyJoinError(message ?? 'Request failed.', code);
    }
    throw new AgencyJoinError('Could not reach the server. Try again.', 'NETWORK');
  }
}

// GET /api/agencies/my-join-request — same idea as fetchMyAgencyApplication,
// mirrored for the join-an-existing-agency flow. Fails silently (returns
// null) so an older/unreachable backend just falls back to no pending
// request instead of erroring.
export async function fetchMyAgencyJoinRequest(sessionToken) {
  try {
    const response = await apiClient.get('/api/agencies/my-join-request', {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data?.data?.request ?? null;
  } catch {
    return null;
  }
}

// GET /api/agencies/mine — see docs/agency-dashboard-api-spec.md. Only
// meaningful for an approved agency owner; returns null if the caller
// doesn't own one so the screen can fall back cleanly.
export async function fetchMyAgencyDashboard(sessionToken) {
  try {
    const response = await apiClient.get('/api/agencies/mine', {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data?.data?.agency ?? null;
  } catch {
    return null;
  }
}

// POST /api/agencies/join-requests/:requestId/respond — see
// docs/agency-dashboard-api-spec.md. The agency owner accepting/rejecting
// one of their own pending join requests, straight from the app.
export async function respondToAgencyJoinRequest(sessionToken, requestId, accept) {
  try {
    const response = await apiClient.post(`/api/agencies/join-requests/${requestId}/respond`, { accept }, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data?.data ?? {};
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new AgencyJoinError(message ?? 'Request failed.', code);
    }
    throw new AgencyJoinError('Could not reach the server. Try again.', 'NETWORK');
  }
}

// POST /api/agencies/mine/target — see docs/agency-dashboard-extended-spec.md
// (requested, not yet built). Owner sets the agency's monthly coin target.
export async function setAgencyMonthlyTarget(sessionToken, targetCoins) {
  try {
    const response = await apiClient.post('/api/agencies/mine/target', { targetCoins }, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data?.data ?? {};
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new AgencyJoinError(message ?? 'Could not update the target.', code);
    }
    throw new AgencyJoinError('Could not reach the server. Try again.', 'NETWORK');
  }
}

// DELETE /api/agencies/hosts/:hostId — see
// docs/agency-dashboard-extended-spec.md (requested, not yet built).
// Owner removing a host from their agency.
export async function removeAgencyHost(sessionToken, hostId) {
  try {
    const response = await apiClient.delete(`/api/agencies/hosts/${hostId}`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data?.data ?? {};
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new AgencyJoinError(message ?? 'Could not remove this host.', code);
    }
    throw new AgencyJoinError('Could not reach the server. Try again.', 'NETWORK');
  }
}
