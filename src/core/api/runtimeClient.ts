import { firebaseTokenProvider } from '../auth/firebaseTokenProvider';
import { ApiClient } from './client';
import { V2Client } from './v2Client';

/** The single authenticated HTTP client used by all v2 feature adapters. */
export const apiClient = new ApiClient({ tokenProvider: firebaseTokenProvider });

/** The only feature-facing client; request and response shapes come from OpenAPI. */
export const v2Client = new V2Client(apiClient);
