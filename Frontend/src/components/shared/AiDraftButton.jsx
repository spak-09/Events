import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { Textarea } from '../ui/textarea';
import { Sparkles, RefreshCw, Check } from 'lucide-react';
import apiClient from '../../lib/axios';
import { useUiStore } from '../../stores/uiStore';

export function AiDraftButton({
  type = 'event-description',
  payload = {},
  onAccept,
  label = 'Draft',
  size = 'sm',
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const { addToast } = useUiStore();

  const generateDraft = async () => {
    setIsLoading(true);
    try {
      let endpoint = '/ai/event-description';
      if (type === 'speaker-bio') endpoint = '/ai/speaker-bio';
      else if (type === 'announcement') endpoint = '/ai/announcement';
      else if (type === 'session-summary') endpoint = '/ai/session-summary';

      const res = await apiClient.post(endpoint, payload);
      const text = res.data?.data?.draft || '';
      setDraftContent(text);
    } catch (err) {
      addToast({
        title: 'Draft Generation Failed',
        description: err.response?.data?.error?.message || 'Could not generate AI draft',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    generateDraft();
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept(draftContent);
    }
    setIsOpen(false);
    addToast({
      title: 'Draft Applied',
      description: 'AI generated content has been inserted.',
      type: 'success',
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="accent"
        size={size}
        onClick={handleOpen}
        className={`gap-1.5 font-medium ${className || ''}`}
      >
        <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
        {label}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="AI Assistant Draft"
        description="Review or edit the generated draft before inserting."
      >
        <div className="space-y-4 pt-2">
          {isLoading ? (
            <div className="space-y-3 py-6">
              <div className="h-4 w-3/4 bg-muted/60 skeleton-shimmer rounded-lg" />
              <div className="h-4 w-full bg-muted/60 skeleton-shimmer rounded-lg" />
              <div className="h-4 w-5/6 bg-muted/60 skeleton-shimmer rounded-lg" />
              <div className="text-center text-xs text-muted-foreground pt-4 flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 animate-spin text-primary" />
                Synthesizing draft...
              </div>
            </div>
          ) : (
            <Textarea
              rows={8}
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              className="font-mono text-xs leading-relaxed"
            />
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateDraft}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Discard
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAccept}
                disabled={isLoading || !draftContent}
                className="gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Accept Draft
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
