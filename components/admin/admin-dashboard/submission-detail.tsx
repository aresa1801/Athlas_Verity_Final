'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, X, Clock } from 'lucide-react';
import { VerificationStatus, VerificationType } from '@/lib/types/admin';

interface SubmissionDetailProps {
  submission: {
    id: string;
    user_id: string;
    user?: { email: string; full_name: string };
    project_name: string;
    project_location: string;
    project_description: string | null;
    status: VerificationStatus;
    verification_type: VerificationType;
    submitted_at: string;
    created_at: string;
    carbon_credits_issued?: number;
    carbon_credit_standard?: string;
    vegetation_type?: string;
    area_hectares?: number;
    ecosystem_type?: string;
    water_body_name?: string;
    energy_generated_mwh?: number;
    energy_type?: string;
    installed_capacity_mw?: number;
    co2_avoided_tonnes?: number;
  };
  onClose: () => void;
  onStatusChange?: () => void;
}

export function SubmissionDetail({ submission, onClose, onStatusChange }: SubmissionDetailProps) {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleUpdateStatus = async (newStatus: VerificationStatus) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submission.id,
          verification_type: submission.verification_type,
          action: 'update_status',
          status: newStatus,
          comments: comments || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onStatusChange?.();
        setComments('');
        setShowComments(false);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndPublish = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submission.id,
          verification_type: submission.verification_type,
          action: 'approve_and_publish',
          admin_id: 'current_admin_id', // This should come from auth context
          comments: comments || undefined,
          catalog_data: {
            primary_image_url: null, // Update with actual image URL if available
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        onStatusChange?.();
        setComments('');
      }
    } catch (error) {
      console.error('Error approving submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: VerificationStatus) => {
    const colors: Record<VerificationStatus, string> = {
      draft: 'bg-gray-500/10 text-gray-700',
      submitted: 'bg-blue-500/10 text-blue-700',
      under_review: 'bg-yellow-500/10 text-yellow-700',
      pending_revision: 'bg-orange-500/10 text-orange-700',
      approved: 'bg-green-500/10 text-green-700',
      rejected: 'bg-red-500/10 text-red-700',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{submission.project_name}</h2>
          <p className="text-muted-foreground mt-1">{submission.project_location}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusBadgeColor(submission.status)}>
              {submission.status.replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{submission.verification_type.replace('_', ' ')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">
              {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">User Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">{submission.user?.email || '-'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <p className="mt-1 text-foreground">{submission.project_description || '-'}</p>
          </div>

          {submission.verification_type === 'green_carbon' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vegetation Type</label>
                  <p className="mt-1 text-foreground">{submission.vegetation_type || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Area (hectares)</label>
                  <p className="mt-1 text-foreground">{submission.area_hectares || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Carbon Credits</label>
                  <p className="mt-1 text-foreground">{submission.carbon_credits_issued || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Credit Standard</label>
                  <p className="mt-1 text-foreground">{submission.carbon_credit_standard || '-'}</p>
                </div>
              </div>
            </>
          )}

          {submission.verification_type === 'blue_carbon' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ecosystem Type</label>
                  <p className="mt-1 text-foreground">{submission.ecosystem_type || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Water Body Name</label>
                  <p className="mt-1 text-foreground">{submission.water_body_name || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Area (hectares)</label>
                  <p className="mt-1 text-foreground">{submission.area_hectares || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Carbon Credits</label>
                  <p className="mt-1 text-foreground">{submission.carbon_credits_issued || '-'}</p>
                </div>
              </div>
            </>
          )}

          {submission.verification_type === 'renewable_energy' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Energy Type</label>
                  <p className="mt-1 text-foreground">{submission.energy_type || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Capacity (MW)</label>
                  <p className="mt-1 text-foreground">{submission.installed_capacity_mw || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Energy Generated (MWh)</label>
                  <p className="mt-1 text-foreground">{submission.energy_generated_mwh || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CO2 Avoided (tonnes)</label>
                  <p className="mt-1 text-foreground">{submission.co2_avoided_tonnes || '-'}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Actions */}
      {submission.status !== 'approved' && submission.status !== 'rejected' && (
        <Card>
          <CardHeader>
            <CardTitle>Review Actions</CardTitle>
            <CardDescription>Update submission status and add comments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Comments</label>
              <Textarea
                placeholder="Add review comments..."
                value={comments}
                onChange={e => setComments(e.target.value)}
                className="min-h-24"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('under_review')}
                disabled={loading}
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                Review
              </Button>
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('pending_revision')}
                disabled={loading}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Revise
              </Button>
              <Button
                onClick={handleApproveAndPublish}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Check className="w-4 h-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleUpdateStatus('rejected')}
                disabled={loading}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
