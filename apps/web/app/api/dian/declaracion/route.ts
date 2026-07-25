import { atenderDescarga } from '@/server/dian/atender';

import type { NextResponse } from 'next/server';

export const maxDuration = 120;

/**
 * Downloads an already filed return (PDF) from MUISCA to prefill the figures
 * the user does not remember: prior net worth, net tax and advance payment.
 *
 * When the account has no return for that year the response is a 404 with
 * `sin_declaracion`, which the UI shows as information, not as a breakdown.
 */
export async function POST(request: Request): Promise<NextResponse> {
  return atenderDescarga('declaracion', request);
}
