import type {
  ComposeContextRequest,
  ComposedContext,
  CreateRuleInput,
  Rule,
  UpdateRuleInput
} from '../shared/ruleSchema';

const apiBaseUrl = '/api';

type ApiErrorPayload = {
  message?: string;
  issues?: unknown;
  details?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getApiErrorMessage = (payload: unknown, fallbackStatus: number): string => {
  if (!isRecord(payload)) {
    return `Request failed with status ${fallbackStatus}`;
  }

  const message = typeof payload.message === 'string' ? payload.message : null;
  const details = payload.details ?? payload.issues;

  if (!message) {
    return `Request failed with status ${fallbackStatus}`;
  }

  if (!details) {
    return message;
  }

  return `${message}: ${JSON.stringify(details)}`;
};

const request = async <TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | undefined;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = undefined;
    }

    throw new Error(getApiErrorMessage(payload, response.status));
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
};

export const rulesApi = {
  getRules: () => request<Rule[]>('/rules'),
  getRule: (ruleId: string) => request<Rule>(`/rules/${encodeURIComponent(ruleId)}`),
  createRule: (input: CreateRuleInput) =>
    request<Rule>('/rules', {
      method: 'POST',
      body: JSON.stringify(input)
    }),
  updateRule: (ruleId: string, input: UpdateRuleInput) =>
    request<Rule>(`/rules/${encodeURIComponent(ruleId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    }),
  deleteRule: (ruleId: string) =>
    request<void>(`/rules/${encodeURIComponent(ruleId)}`, {
      method: 'DELETE'
    }),
  composeContext: (input: ComposeContextRequest) =>
    request<ComposedContext>('/context/compose', {
      method: 'POST',
      body: JSON.stringify(input)
    })
};
