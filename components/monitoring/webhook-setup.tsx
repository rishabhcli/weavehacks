'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WebhookSetupProps {
  repoFullName: string;
  webhookUrl: string;
  webhookSecret?: string;
}

export function WebhookSetup({ repoFullName, webhookUrl, webhookSecret }: WebhookSetupProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const copyToClipboard = async (text: string, type: 'url' | 'secret') => {
    await navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const [owner, repo] = repoFullName.split('/');
  const githubSettingsUrl = `https://github.com/${owner}/${repo}/settings/hooks/new`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Webhook Setup
          <Badge variant="outline">Required for Push Triggers</Badge>
        </CardTitle>
        <CardDescription>
          Configure a GitHub webhook to trigger runs automatically on push events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Payload URL</label>
          <div className="flex gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
              {webhookUrl}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(webhookUrl, 'url')}
            >
              {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {webhookSecret && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Secret</label>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                {webhookSecret.slice(0, 8)}{'*'.repeat(24)}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookSecret, 'secret')}
              >
                {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Content Type</label>
          <code className="block px-3 py-2 bg-muted rounded-md text-sm font-mono">
            application/json
          </code>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Events to Trigger</label>
          <div className="flex gap-2">
            <Badge>Push</Badge>
            <Badge>Pull Request</Badge>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button asChild className="w-full">
            <a href={githubSettingsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open GitHub Webhook Settings
            </a>
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Setup Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click the button above to open GitHub webhook settings</li>
            <li>Paste the Payload URL</li>
            <li>Set Content type to application/json</li>
            <li>Enter the Secret</li>
            <li>Select &quot;Just the push event&quot; or choose individual events</li>
            <li>Click &quot;Add webhook&quot;</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
