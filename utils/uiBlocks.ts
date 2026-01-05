export type UIBlockPriority = 'low' | 'normal' | 'high';
export type UIBlockActionType = 'submit_event' | 'open_modal' | 'send_text';
export type UIEventType = 'action' | 'dismiss' | 'slider_submit' | 'form_submit';

export interface UIBlockAction {
  id: string;
  title: string;
  action_type: UIBlockActionType;
  payload?: Record<string, any>;
  style?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  requires_confirmation?: boolean;
}

export interface UIBlock {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  payload?: Record<string, any>;
  actions?: UIBlockAction[];
  dismissible?: boolean;
  priority?: UIBlockPriority;
  expires_at?: string;
  analytics?: Record<string, any>;
}

export interface UIEventRequest {
  thread_id?: string;
  session_id?: string;

  block_id: string;
  event_type: UIEventType;

  action_id?: string;
  value?: any;
  fields?: Record<string, any>;

  idempotency_key?: string;
  metadata?: Record<string, any>;
}
