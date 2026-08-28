/** Real-time chat service — conversations, paginated messages, typing, read state. */
import { ENV } from '../config/env';
import type { AppUser, Conversation, Message, MessageType, ServiceRequest } from '../models/types';
import { demo } from './firebase/demoDb';
import * as fb from './firebase/firebaseClient';
import { newId } from '../utils/id';
import { analytics } from './analytics';

export const MESSAGE_PAGE_SIZE = 40;

export async function ensureConversation(
  user: AppUser,
  proId: string,
  requestId?: string,
): Promise<Conversation> {
  if (ENV.isDemo) {
    await demo.ready();
    return demo.ensureConversation(user.uid, proId, requestId);
  }
  const pro = await fb.fbGetPro(proId).catch(() => null);
  return fb.fbEnsureConversation({
    id: '',
    customerId: user.uid,
    proId,
    participantNames: { [user.uid]: user.name, [proId]: pro?.businessName || pro?.displayName || 'Professional' },
    requestId,
    unread: { [user.uid]: 0, [proId]: 0 },
    updatedAt: Date.now(),
  });
}

/** Pro opening a chat with a lead's customer (conversation already exists in most flows). */
export async function ensureConversationForLead(
  user: AppUser,
  request: ServiceRequest,
): Promise<Conversation> {
  if (ENV.isDemo) {
    await demo.ready();
    return demo.ensureConversation(request.customerId, user.uid, request.id);
  }
  const conv = {
    id: '',
    customerId: request.customerId,
    proId: user.uid,
    participants: [request.customerId, user.uid],
    participantNames: { [request.customerId]: request.customerName, [user.uid]: user.name },
    requestId: request.id,
    unread: { [request.customerId]: 0, [user.uid]: 0 },
    updatedAt: Date.now(),
  } as Conversation;
  return fb.fbEnsureConversation(conv);
}

export function subscribeConversations(uid: string, cb: (c: Conversation[]) => void): () => void {
  if (ENV.isDemo) {
    void demo.ready().then(() => cb(demo.conversationsFor(uid)));
    return demo.subscribe('conversations', () => cb(demo.conversationsFor(uid)));
  }
  return fb.fbSubscribeConversations(uid, cb);
}

export function subscribeMessages(conversationId: string, cb: (m: Message[]) => void): () => void {
  if (ENV.isDemo) {
    void demo.ready().then(() => cb(demo.messagesFor(conversationId)));
    return demo.subscribe('messages:' + conversationId, () => cb(demo.messagesFor(conversationId)));
  }
  return fb.fbSubscribeMessages(conversationId, MESSAGE_PAGE_SIZE, cb);
}

export function getConversation(conversationId: string): Conversation | null {
  if (ENV.isDemo) return demo.conversation(conversationId) ?? null;
  return null; // firebase callers should already have it from the list
}

export interface OutgoingMessage {
  type: MessageType;
  text?: string;
  imageURL?: string;
  payload?: Message['payload'];
}

export async function sendMessage(
  conversationId: string,
  user: AppUser,
  outgoing: OutgoingMessage,
): Promise<void> {
  analytics.track('message_sent', { conversationId, type: outgoing.type });
  if (ENV.isDemo) {
    const msg = demo.insertMessage(conversationId, { senderId: user.uid, ...outgoing });
    if (outgoing.type === 'text' && outgoing.text) {
      demo.maybeAutoReply(conversationId, user.uid, outgoing.text);
    }
    void msg;
    return;
  }
  const message: Message = {
    id: newId(),
    conversationId,
    senderId: user.uid,
    type: outgoing.type,
    text: outgoing.text,
    imageURL: outgoing.imageURL,
    payload: outgoing.payload,
    createdAt: Date.now(),
    readBy: [user.uid],
    status: 'sent',
  };
  await fb.fbSendMessage(conversationId, message);
}

export async function markConversationRead(conversationId: string, uid: string): Promise<void> {
  if (ENV.isDemo) {
    demo.markConversationRead(conversationId, uid);
    return;
  }
  await fb.fbMarkConversationRead(conversationId, uid);
}

export function setTyping(conversationId: string, uid: string, typing: boolean): void {
  if (ENV.isDemo) {
    demo.setTyping(conversationId, uid, typing);
  }
  // firebase: typing via presence document — Phase 2 (see docs/ARCHITECTURE.md)
}
