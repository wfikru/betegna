/** Service requests, matching fan-out and professional leads. */
import { ENV } from '../config/env';
import type { AppUser, Lead, ServiceRequest } from '../models/types';
import { demo, type RequestDraft } from './firebase/demoDb';
import * as fb from './firebase/firebaseClient';
import { newId } from '../utils/id';
import { analytics } from './analytics';

export type { RequestDraft };

export async function createRequest(user: AppUser, draft: RequestDraft): Promise<ServiceRequest> {
  analytics.track('request_submitted', { serviceId: draft.serviceId, urgency: draft.when.urgency });
  if (ENV.isDemo) return demo.createRequest(user, draft);

  const request: ServiceRequest = {
    id: newId(),
    customerId: user.uid,
    customerName: user.name,
    categoryId: '',
    serviceId: draft.serviceId,
    serviceName: '',
    summaryText: draft.summaryText,
    answers: draft.answers,
    description: draft.description,
    location: draft.location,
    when: draft.when,
    photos: draft.photos,
    status: 'submitted',
    matchedProIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await fb.fbCreateRequest(request); // Cloud Function performs the matching fan-out
  return request;
}

export function subscribeRequests(uid: string, cb: (r: ServiceRequest[]) => void): () => void {
  if (ENV.isDemo) {
    void demo.ready().then(() => cb(demo.requestsFor(uid)));
    return demo.subscribe('requests', () => cb(demo.requestsFor(uid)));
  }
  return fb.fbSubscribeRequests(uid, cb);
}

export async function getRequest(id: string): Promise<ServiceRequest | null> {
  if (ENV.isDemo) {
    await demo.ready();
    return demo.request(id) ?? null;
  }
  return fb.fbGetRequest(id);
}

export async function updateRequest(id: string, patch: Partial<ServiceRequest>): Promise<void> {
  if (ENV.isDemo) {
    demo.updateRequest(id, patch);
    return;
  }
  await fb.fbUpdateRequest(id, patch);
}

export async function cancelRequest(id: string): Promise<void> {
  analytics.track('request_cancelled', { requestId: id });
  await updateRequest(id, { status: 'cancelled' });
}

/* ── leads (professional side) ── */

export function subscribeLeads(proUid: string, cb: (l: Lead[]) => void): () => void {
  if (ENV.isDemo) {
    void demo.ready().then(() => cb(demo.leadsForPro(proUid)));
    return demo.subscribe('leads', () => cb(demo.leadsForPro(proUid)));
  }
  return fb.fbSubscribeLeads(proUid, cb);
}

export async function getRequestForLead(lead: Lead): Promise<ServiceRequest | null> {
  return getRequest(lead.requestId);
}

export async function setLeadState(leadId: string, state: Lead['state']): Promise<void> {
  if (ENV.isDemo) {
    demo.updateLead(leadId, { state });
    return;
  }
  await fb.fbUpdateLead(leadId, { state });
}

export async function markLeadSeen(leadId: string): Promise<void> {
  if (ENV.isDemo) {
    demo.updateLead(leadId, { seen: true });
    return;
  }
  await fb.fbUpdateLead(leadId, { seen: true });
}
