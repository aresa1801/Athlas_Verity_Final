import { NextRequest, NextResponse } from 'next/server';
import { getApprovedCatalog, getCatalogByType } from '@/lib/supabase/admin-helpers';
import { ApiResponse, PaginatedResponse, VerifiedCatalogItem } from '@/lib/types/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let result;
    if (type) {
      result = await getCatalogByType(type as any, page, limit);
    } else {
      result = await getApprovedCatalog(page, limit);
    }

    return NextResponse.json<PaginatedResponse<VerifiedCatalogItem>>(result);
  } catch (error: any) {
    console.error('Error fetching catalog:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch catalog' },
      { status: 500 }
    );
  }
}
