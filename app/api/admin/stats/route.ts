import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/supabase/admin-helpers';
import { ApiResponse, AdminDashboardStats } from '@/lib/types/admin';

export async function GET(request: NextRequest) {
  try {
    const stats = await getDashboardStats();

    return NextResponse.json<ApiResponse<AdminDashboardStats>>({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
