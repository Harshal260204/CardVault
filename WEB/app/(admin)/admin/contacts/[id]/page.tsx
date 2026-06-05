'use client';

import { PageHeader } from '@/components/layout/page-header';
import { LeadBadge } from '@/components/shared/lead-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useContact, useUpdateContact } from '@/hooks/use-contacts';
import { api } from '@/lib/api';
import { mergeContacts } from '@/lib/api-client';
import { formatCaptureMode } from '@/lib/format';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const contactId = params.id;
  const { data: contact, isLoading, error } = useContact(contactId);
  const updateContact = useUpdateContact(contactId);
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    setMergeError(null);
    setMergeSuccess(null);
    if (!mergeSourceId.trim()) {
      setMergeError('Enter the source contact ID to merge into this record.');
      return;
    }
    setIsMerging(true);
    try {
      await mergeContacts(api, contactId, mergeSourceId.trim());
      setMergeSuccess('Contacts merged successfully.');
      setMergeSourceId('');
    } catch (e) {
      setMergeError(e instanceof Error ? e.message : 'Merge failed.');
    } finally {
      setIsMerging(false);
    }
  };

  if (isLoading) {
    return <p className="text-text-secondary">Loading contact…</p>;
  }

  if (error || !contact) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">Contact not found.</p>
        <Link href="/admin/contacts" className="text-accent hover:underline">
          Back to contacts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={contact.fullName}
        description={contact.company ?? 'Contact detail'}
        action={
          <div className="flex gap-2">
            <Link href="/admin/contacts">
              <Button variant="ghost">Back</Button>
            </Link>
            <Link href={`/admin/contacts/${contact.id}/edit`}>
              <Button>Edit</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="accent">{formatCaptureMode(contact.captureMode)}</Badge>
              <LeadBadge qualifier={contact.leadQualifier} />
              {contact.encounterType ? (
                <Badge variant="default">{contact.encounterType}</Badge>
              ) : null}
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-text-tertiary">Company</dt>
                <dd className="font-medium text-foreground">{contact.company ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Title</dt>
                <dd className="font-medium text-foreground">{contact.title ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Emails</dt>
                <dd className="font-medium text-foreground">
                  {contact.emails.length ? contact.emails.join(', ') : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Phones</dt>
                <dd className="font-medium text-foreground">
                  {contact.phones.length ? contact.phones.join(', ') : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Website</dt>
                <dd className="font-medium text-foreground">{contact.website ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Notes</dt>
                <dd className="font-medium text-foreground">{contact.notes ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Created</dt>
                <dd className="font-medium text-foreground">
                  {new Date(contact.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-foreground">Merge duplicate</h2>
            <p className="text-sm text-text-secondary">
              Merge another contact into this record. The source contact will be absorbed and this
              contact will remain.
            </p>
            {mergeError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {mergeError}
              </p>
            ) : null}
            {mergeSuccess ? (
              <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {mergeSuccess}
              </p>
            ) : null}
            <Input
              placeholder="Source contact UUID"
              value={mergeSourceId}
              onChange={(e) => setMergeSourceId(e.target.value)}
            />
            <Button onClick={handleMerge} loading={isMerging} disabled={updateContact.isPending}>
              Merge into this contact
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
