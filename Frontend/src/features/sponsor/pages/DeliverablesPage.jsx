import React, { useState } from 'react';
import { FileText, CheckCircle2, Clock, Upload, AlertCircle, ExternalLink } from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Modal } from '../../../components/ui/modal';
import { ProgressRing } from '../../../components/ui/progress';
import { FileDropzone } from '../../../components/shared/FileDropzone';
import { useUiStore } from '../../../stores/uiStore';
import { formatDate } from '../../../lib/utils';

export function DeliverablesPage() {
  const { addToast } = useUiStore();
  const [activeUploadModal, setActiveUploadModal] = useState(null); // deliverable object

  const [deliverables, setDeliverables] = useState([]);

  const completed = deliverables.filter((d) => d.status === 'approved' || d.status === 'submitted').length;
  const pct = deliverables.length > 0 ? Math.round((completed / deliverables.length) * 100) : 0;

  const handleUploadSuccess = (url, fileName) => {
    if (!activeUploadModal) return;
    setDeliverables((prev) =>
      prev.map((d) =>
        d.id === activeUploadModal.id
          ? {
              ...d,
              status: 'submitted',
              asset: url,
              reviewNotes: 'Submitted for organizer review.',
            }
          : d
      )
    );
    addToast({
      title: 'Deliverable Submitted',
      description: `${activeUploadModal.title} submitted for verification.`,
      type: 'success',
    });
    setActiveUploadModal(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Sponsor Deliverables Checklist"
        description="Fulfill brand assets and marketing materials before strict event production cutoff dates"
      />

      {/* Progress Ring Summary Card */}
      <Card className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-soft">
        <div className="flex items-center gap-5">
          <ProgressRing percentage={pct} size={72} strokeWidth={7} />
          <div>
            <h3 className="text-base font-bold text-foreground">Production Readiness</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completed} of {deliverables.length} required assets uploaded and compliant.
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground border-t sm:border-t-0 sm:border-l border-border/50 pt-3 sm:pt-0 sm:pl-6 text-center sm:text-left">
          <span className="font-semibold text-foreground block">Cutoff Deadline</span>
          <span>November 18, 2026 at 23:59 EST</span>
        </div>
      </Card>

      {/* Deliverables List */}
      <div className="space-y-4">
        {deliverables.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No sponsorship deliverables currently assigned.</p>
          </Card>
        ) : (
          deliverables.map((del) => (
          <Card key={del.id} className="p-6 space-y-3 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      del.status === 'approved'
                        ? 'success'
                        : del.status === 'submitted'
                        ? 'accent'
                        : del.status === 'rejected'
                        ? 'destructive'
                        : 'outline'
                    }
                    className="capitalize text-[10px]"
                  >
                    {del.status === 'approved' ? '✓ Approved' : del.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    Due: {formatDate(del.dueDate)}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{del.title}</h4>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                {del.asset && (
                  <a
                    href={del.asset}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    View File <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <Button
                  size="sm"
                  variant={del.asset ? 'outline' : 'default'}
                  onClick={() => setActiveUploadModal(del)}
                  className="text-xs gap-1.5 h-8"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {del.asset ? 'Replace' : 'Upload Asset'}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{del.description}</p>

            {del.reviewNotes && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs">
                <span className="font-semibold text-foreground mr-1.5">Reviewer Notes:</span>
                <span className="text-muted-foreground">{del.reviewNotes}</span>
              </div>
            )}
          </Card>
        )))}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={!!activeUploadModal}
        onClose={() => setActiveUploadModal(null)}
        title="Submit Deliverable Asset"
        description={`Upload fulfillment file for ${activeUploadModal?.title || ''}.`}
      >
        <div className="space-y-4 pt-2">
          <FileDropzone
            label="Drag file here (.svg, .png, .mp4, .pdf)"
            onUploadSuccess={handleUploadSuccess}
          />

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveUploadModal(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
