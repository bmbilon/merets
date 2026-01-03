// Simple event emitter for user switch events (React Native compatible)

type EventListener = (data: any) => void;

class SimpleEventEmitter {
  private listeners: Map<string, EventListener[]> = new Map();

  on(event: string, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: EventListener) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }
}

export const userEvents = new SimpleEventEmitter();

export const USER_SWITCHED_EVENT = 'user_switched';

// Helper function to emit user switch event
export const notifyUserSwitch = (userId: string) => {
  console.log('[UserEvents] Emitting user switch event:', userId);
  userEvents.emit(USER_SWITCHED_EVENT, userId);
};
