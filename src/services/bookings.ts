/** Bookings & job lifecycle service. */
import { ENV } from '../config/env';
import type { Booking, BookingStatus, UserRole } from '../models/types';
import { demo } from './firebase/demoDb';
import * as fb from './firebase/firebaseClient';
import { analytics } from './analytics';
import { canTransitionBooking } from '../features/requests/lifecycle';

export function subscribeBookings(uid: string, role: UserRole, cb: (b: Booking[]) => void): () => void {
  if (ENV.isDemo) {
    void demo.ready().then(() => cb(role === 'professional' ? demo.bookingsForPro(uid) : demo.bookingsForCustomer(uid)));
    return demo.subscribe('bookings', () =>
      cb(role === 'professional' ? demo.bookingsForPro(uid) : demo.bookingsForCustomer(uid)),
    );
  }
  return fb.fbSubscribeBookings(role === 'professional' ? 'proId' : 'customerId', uid, cb);
}

export async function getBooking(id: string): Promise<Booking | null> {
  if (ENV.isDemo) {
    await demo.ready();
    return demo.booking(id) ?? null;
  }
  return null;
}

export async function updateBookingStatus(id: string, to: BookingStatus, label: string): Promise<void> {
  if (ENV.isDemo) {
    const current = demo.booking(id);
    if (current && !canTransitionBooking(current.status, to)) {
      throw new Error(`Cannot move booking from ${current.status} to ${to}`);
    }
    demo.updateBooking(id, { status: to }, { kind: `status_${to}`, label });
    analytics.track(to === 'completed' ? 'job_completed' : 'booking_updated', { bookingId: id, to });
    return;
  }
  await fb.fbUpdateBooking(id, { status: to });
  analytics.track(to === 'completed' ? 'job_completed' : 'booking_updated', { bookingId: id, to });
}

export async function cancelBooking(id: string): Promise<void> {
  await updateBookingStatus(id, 'cancelled', 'Booking cancelled');
}
