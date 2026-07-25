import { atenderDescarga } from '@/server/dian/atender';

import type { NextResponse } from 'next/server';

export const maxDuration = 120;

/** Downloads the user's third-party report (exógena) from MUISCA. */
export async function POST(request: Request): Promise<NextResponse> {
  return atenderDescarga('exogena', request);
}
