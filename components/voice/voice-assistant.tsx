'use client';

import { useState, useCallback } from 'react';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);

  const startSession = useCallback(async () => {
    try {
      const response = await fetch('/api/voice/session', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to start session');
      }
      setTranscript([
        "QAgent: Hello! I'm ready to help. You can ask me to run tests, show bugs, or explain fixes.",
      ]);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to start voice session:', error);
    }
  }, []);

  const endSession = useCallback(() => {
    setIsConnected(false);
    setTranscript([]);
  }, []);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Mic className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Talk to QAgent
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="h-48 overflow-y-auto bg-muted/30 rounded-lg p-3 space-y-2">
              {transcript.map((line, i) => (
                <div key={i} className="text-sm">
                  {line}
                </div>
              ))}
              {transcript.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Click &quot;Start&quot; to begin talking
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4">
              {!isConnected ? (
                <Button onClick={startSession} className="gap-2">
                  <Phone className="h-4 w-4" />
                  Start
                </Button>
              ) : (
                <>
                  <Button
                    variant={isMuted ? 'destructive' : 'outline'}
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={endSession}
                    className="gap-2"
                  >
                    <PhoneOff className="h-4 w-4" />
                    End
                  </Button>
                </>
              )}
            </div>

            <div className="text-xs text-center text-muted-foreground">
              Powered by Daily + Pipecat
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
