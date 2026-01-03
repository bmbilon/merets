// Simple event emitter for user switch events
import { EventEmitter } from 'events';

class UserEventEmitter extends EventEmitter {}

export const userEvents = new UserEventEmitter();

export const USER_SWITCHED_EVENT = 'user_switched';

// Helper function to emit user switch event
export const notifyUserSwitch = (userId: string) => {
  console.log('[UserEvents] Emitting user switch event:', userId);
  userEvents.emit(USER_SWITCHED_EVENT, userId);
};
