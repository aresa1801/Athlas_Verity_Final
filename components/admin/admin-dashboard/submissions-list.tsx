'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VerificationStatus, VerificationType } from '@/lib/types/admin';

interface Submission {
  id: string;
  user_id: string;
  user?: { email: string; full_name: string };
  project_name: string;
  status: VerificationStatus;
  verification_type: VerificationType;
  submitted_at: string;
  created_at: string;
}

interface SubmissionsListProps {
  onSelectSubmission: (submission: Submission) => void;
}

export function SubmissionsList({ onSelectSubmission }: SubmissionsListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<VerificationStatus | ''>('');
  const [type, setType] = useState<VerificationType | ''>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  useEffect(() => {
    fetchSubmissions();
  }, [page, status, type]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) params.append('status', status);
      if (type) params.append('type', type);

      const response = await fetch(`/api/admin/submissions?${params}`);
      const data = await response.json();

      if (data.success) {
        setSubmissions(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
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

  const getTypeBadgeColor = (type: VerificationType) => {
    const colors: Record<VerificationType, string> = {
      green_carbon: 'bg-emerald-500/10 text-emerald-700',
      blue_carbon: 'bg-cyan-500/10 text-cyan-700',
      renewable_energy: 'bg-yellow-500/10 text-yellow-700',
    };
    return colors[type];
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
          <Select value={status} onValueChange={v => { setStatus(v as VerificationStatus | ''); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="pending_revision">Pending Revision</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-foreground mb-2 block">Type</label>
          <Select value={type} onValueChange={v => { setType(v as VerificationType | ''); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="green_carbon">Green Carbon</SelectItem>
              <SelectItem value="blue_carbon">Blue Carbon</SelectItem>
              <SelectItem value="renewable_energy">Renewable Energy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submissions Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No submissions found</p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Project Name</TableHead>
                  <TableHead>User Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map(submission => (
                  <TableRow key={submission.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{submission.project_name}</TableCell>
                    <TableCell>{submission.user?.email || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeColor(submission.verification_type)}>
                        {submission.verification_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(submission.status)}>
                        {submission.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {submission.submitted_at
                        ? new Date(submission.submitted_at).toLocaleDateString()
                        : 'Not submitted'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectSubmission(submission)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
