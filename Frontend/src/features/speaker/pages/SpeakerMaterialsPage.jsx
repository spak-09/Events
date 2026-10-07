import React, { useState } from 'react';
import { FileText, CheckCircle2, Clock, UploadCloud, Download, ExternalLink } from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { FileDropzone } from '../../../components/shared/FileDropzone';
import { useUiStore } from '../../../stores/uiStore';

export function SpeakerMaterialsPage() {
  const { addToast } = useUiStore();

  const [sessionMaterials, setSessionMaterials] = useState([]);

  const handleUploadSuccess = (sessionId, url, originalName) => {
    setSessionMaterials((prev) =>
      prev.map((item) =>
        item.id === sessionId
          ? {
              ...item,
              status: 'uploaded',
              fileUrl: url,
              fileName: originalName || 'slide_deck.pdf',
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : item
      )
    );
    addToast({
      title: 'Slides Uploaded',
      description: 'Deck uploaded to event A/V system.',
      type: 'success',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Session Materials & Slide Decks"
        description="Submit presentation decks and code artifacts for the AV technical crew"
      />

      <div className="space-y-6">
        {sessionMaterials.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No session presentations currently assigned to your speaker profile.</p>
          </Card>
        ) : (
          sessionMaterials.map((sess) => (
          <Card key={sess.id} className="p-6 space-y-4 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  Room: {sess.room}
                </span>
                <h3 className="text-base font-bold text-foreground">{sess.title}</h3>
              </div>
              <Badge variant={sess.status === 'uploaded' ? 'success' : 'warning'} className="capitalize self-start sm:self-auto">
                {sess.status === 'uploaded' ? '✓ Materials Ready' : 'Pending Upload'}
              </Badge>
            </div>

            {sess.fileUrl ? (
              <div className="flex items-center justify-between p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{sess.fileName}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Uploaded on {sess.updatedAt} • Screen Aspect 16:9
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={sess.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline text-xs flex items-center gap-1 font-medium"
                  >
                    Download <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSessionMaterials((prev) =>
                        prev.map((m) =>
                          m.id === sess.id
                            ? { ...m, fileUrl: null, fileName: null, status: 'pending' }
                            : m
                        )
                      );
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground h-8"
                  >
                    Replace
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <FileDropzone
                  accept=".pdf,.pptx,.key"
                  label="Drag slide deck here (.pdf, .pptx, max 25MB)"
                  onUploadSuccess={(url, name) => handleUploadSuccess(sess.id, url, name)}
                />
              </div>
            )}
          </Card>
        )))}
      </div>
    </div>
  );
}
