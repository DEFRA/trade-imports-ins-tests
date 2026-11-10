import type { APIRequestContext } from '@playwright/test';
import { RestClient, RestClientError } from '@adapters/http/rest-client';
import { E2E_ORGANISATION_ID, organisationHeaders, type TraderApiClientOptions } from '@adapters/http/organisation';
import { getAnimalsBackendBaseUrl, getDeveloperApiKey } from '@config/service-base-urls';
import type { NotificationFulfilments } from '@domain/animals/models/api/notification-fulfilments';
import type { Notification } from '@domain/animals/models/api/notification';

const SUBMIT_RETRY_ATTEMPTS = 3;
const SUBMIT_RETRY_BASE_MS = 500;

/**
 * HTTP client for the notification api.
 */
export class NotificationApiClient {
  private readonly rest: RestClient;
  private readonly organisationId: string;

  constructor(request: APIRequestContext, options: TraderApiClientOptions = {}) {
    const { baseUrl = getAnimalsBackendBaseUrl(), apiKey = getDeveloperApiKey(), organisationId = E2E_ORGANISATION_ID } = options;
    this.organisationId = organisationId;
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  async getNotificationFulfilments(id: string): Promise<NotificationFulfilments> {
    return this.rest.get<NotificationFulfilments>(`/notifications/${id}/fulfilments`, organisationHeaders(this.organisationId));
  }

  /** POST /notifications — returns the created notification including its reference number. */
  async createNotification(notification: Record<string, unknown> = {}, actor?: Record<string, unknown>): Promise<Notification> {
    return this.rest.post<Notification>(
      '/notifications',
      {
        notification,
        ...(actor ? { actor } : {}),
      },
      organisationHeaders(this.organisationId),
    );
  }

  /** PUT /notifications/{id} — whole-record replace; optional actor metadata. */
  async saveNotification(
    id: string,
    concurrencyToken: number,
    notification: Record<string, unknown> = {},
    actor?: Record<string, unknown>,
  ): Promise<Notification> {
    return this.rest.put<Notification>(
      `/notifications/${id}`,
      {
        notification: { referenceNumber: id, concurrencyToken, ...notification },
        ...(actor ? { actor } : {}),
      },
      organisationHeaders(this.organisationId),
    );
  }

  async submitNotification(id: string, concurrencyToken: number): Promise<Notification> {
    return this.retryOnTransientOutboxLock(() =>
      this.rest.post<Notification>(
        `/notifications/${id}/submit?concurrencyToken=${concurrencyToken}`,
        undefined,
        organisationHeaders(this.organisationId),
      ),
    );
  }

  async amendNotification(id: string): Promise<Notification> {
    return this.retryOnTransientOutboxLock(() =>
      this.rest.post<Notification>(`/notifications/${id}/amend`, undefined, organisationHeaders(this.organisationId)),
    );
  }

  async cancelAmendNotification(id: string): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${id}/cancel-amend`, undefined, organisationHeaders(this.organisationId));
  }

  async copyNotification(id: string, concurrencyToken: number): Promise<Notification> {
    return this.rest.post<Notification>(
      `/notifications/${id}/copy?concurrencyToken=${concurrencyToken}`,
      undefined,
      organisationHeaders(this.organisationId),
    );
  }

  async softDeleteNotification(id: string): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${id}/soft-delete`, undefined, organisationHeaders(this.organisationId));
  }

  async countNotifications(referenceNumber?: string): Promise<number> {
    const path = referenceNumber === undefined ? '/notifications' : `/notifications?referenceNumber=${encodeURIComponent(referenceNumber)}`;
    const page = await this.rest.get<{ totalElements: number }>(path, organisationHeaders(this.organisationId));
    return page.totalElements;
  }

  private async retryOnTransientOutboxLock<T>(action: () => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await action();
      } catch (error) {
        const transientLock = error instanceof RestClientError && error.status === 500;
        if (!transientLock || attempt >= SUBMIT_RETRY_ATTEMPTS) throw error;
        await new Promise((resolve) => setTimeout(resolve, SUBMIT_RETRY_BASE_MS * attempt));
      }
    }
  }
}
