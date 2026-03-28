import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSubmissions,
  getSubmissionsByStatus,
  getSubmissionById,
  updateSubmissionStatus,
  addToCatalog,
} from '@/lib/supabase/admin-helpers';
import { ApiResponse, PaginatedResponse } from '@/lib/types/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const verificationType = searchParams.get('type') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const submissionId = searchParams.get('id') || undefined;

    // Get specific submission
    if (submissionId) {
      if (!verificationType) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Missing required field: type' },
          { status: 400 }
        );
      }
      const result = await getSubmissionById(submissionId, verificationType as any);
      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: result,
      });
    }

    // Get all submissions or by status
    let result;
    if (status) {
      result = await getSubmissionsByStatus(status as any, verificationType as any, page, limit);
    } else {
      result = await getAllSubmissions(page, limit);
    }

    return NextResponse.json<PaginatedResponse<any>>(result);
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { submission_id, verification_type, action, ...data } = body;

    if (!submission_id || !verification_type || !action) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Missing required fields: submission_id, verification_type, action' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update_status':
        if (!data.status) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: 'Missing field: status' },
            { status: 400 }
          );
        }
        await updateSubmissionStatus(
          submission_id,
          verification_type,
          data.status,
          data.comments
        );
        return NextResponse.json<ApiResponse<{ success: boolean }>>({
          success: true,
          data: { success: true },
          message: `Submission status updated to ${data.status}`,
        });

      case 'approve_and_publish':
        if (!data.catalog_data) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: 'Missing field: catalog_data' },
            { status: 400 }
          );
        }
        // Update status to approved
        await updateSubmissionStatus(submission_id, verification_type, 'approved', data.comments);
        
        // Get submission data for catalog
        const submission = await getSubmissionById(submission_id, verification_type);
        
        // Add to catalog
        const catalogItem = await addToCatalog(
          submission_id,
          verification_type,
          {
            user_id: submission.user_id,
            project_name: submission.project_name,
            project_location: submission.project_location,
            project_description: submission.project_description,
            carbon_credits_issued: submission.carbon_credits_issued,
            energy_generated_mwh: submission.energy_generated_mwh,
            co2_avoided_tonnes: submission.co2_avoided_tonnes,
            primary_image_url: data.catalog_data.primary_image_url,
          },
          data.admin_id
        );

        return NextResponse.json<ApiResponse<any>>({
          success: true,
          data: catalogItem,
          message: 'Submission approved and added to catalog',
        });

      case 'reject':
        if (!data.status) {
          data.status = 'rejected';
        }
        await updateSubmissionStatus(
          submission_id,
          verification_type,
          data.status,
          data.comments
        );
        return NextResponse.json<ApiResponse<{ success: boolean }>>({
          success: true,
          data: { success: true },
          message: 'Submission rejected',
        });

      default:
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error updating submission:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to update submission' },
      { status: 500 }
    );
  }
}
