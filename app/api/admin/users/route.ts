import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getUserById, updateUserRole, toggleUserStatus } from '@/lib/supabase/admin-helpers';
import { ApiResponse, PaginatedResponse, User } from '@/lib/types/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await getUsers(role, page, limit);

    return NextResponse.json<PaginatedResponse<User>>(result);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action, ...data } = body;

    if (!user_id || !action) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Missing required fields: user_id, action' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'update_role':
        if (!data.role) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: 'Missing field: role' },
            { status: 400 }
          );
        }
        result = await updateUserRole(user_id, data.role);
        break;

      case 'toggle_status':
        if (data.is_active === undefined) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: 'Missing field: is_active' },
            { status: 400 }
          );
        }
        result = await toggleUserStatus(user_id, data.is_active);
        break;

      default:
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}
