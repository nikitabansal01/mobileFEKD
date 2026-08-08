import { useMutation, useQuery } from '@tanstack/react-query';

import { createIdempotencyKey } from '@/src/core/api/client';
import { v2Client } from '@/src/core/api/runtimeClient';
import type { components } from '@/src/core/api/v2.generated';
import { queryClient } from '@/src/core/query/queryClient';

export type ObservationCatalog =
  components['schemas']['ObservationCatalogResponse'];
export type CatalogEntry = components['schemas']['ObservationCatalogEntry'];
export type CurrentObservations =
  components['schemas']['CurrentObservationsResponse'];
export type ObservationWrite = components['schemas']['ObservationWriteRequest'];
export type Observation = components['schemas']['ObservationResponse'];

export const personalizeKeys = {
  all: ['personalize'] as const,
  catalog: () => [...personalizeKeys.all, 'catalog'] as const,
  current: (type: string) => [...personalizeKeys.all, 'current', type] as const,
};

/** The catalog carries no user data, so it is cached for the session. */
export const getObservationCatalog = (
  signal?: AbortSignal,
): Promise<ObservationCatalog> =>
  v2Client.request('get', '/api/v2/observation-catalog', {
    authenticated: false,
    signal,
  });

export const getCurrentObservations = (
  observationType: string,
  signal?: AbortSignal,
): Promise<CurrentObservations> =>
  v2Client.request('get', '/api/v2/me/observations/current', {
    query: { observation_type: observationType },
    signal,
  });

export const recordObservation = (
  body: ObservationWrite,
  idempotencyKey: string,
): Promise<Observation> =>
  v2Client.request('post', '/api/v2/me/observations', { body, idempotencyKey });

export const useObservationCatalog = () =>
  useQuery({
    queryKey: personalizeKeys.catalog(),
    queryFn: ({ signal }) => getObservationCatalog(signal),
    staleTime: Infinity,
  });

export const useCurrentObservations = (observationType: string) =>
  useQuery({
    queryKey: personalizeKeys.current(observationType),
    queryFn: ({ signal }) => getCurrentObservations(observationType, signal),
  });

export const useRecordObservation = (observationType: string) =>
  useMutation({
    mutationFn: (body: ObservationWrite) =>
      recordObservation(body, createIdempotencyKey()),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: personalizeKeys.current(observationType),
      }),
  });
