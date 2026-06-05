'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useContact, useUpdateContact } from '@/hooks/use-contacts';
import type { LeadQualifier } from '@/lib/types';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ContactEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const contactId = params.id;
  const { data: contact, isLoading } = useContact(contactId);
  const updateContact = useUpdateContact(contactId);

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [leadQualifier, setLeadQualifier] = useState<LeadQualifier | ''>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contact) return;
    setFullName(contact.fullName);
    setCompany(contact.company ?? '');
    setTitle(contact.title ?? '');
    setEmail(contact.emails[0] ?? '');
    setPhone(contact.phones[0] ?? '');
    setWebsite(contact.website ?? '');
    setNotes(contact.notes ?? '');
    setLeadQualifier(contact.leadQualifier ?? '');
  }, [contact]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await updateContact.mutateAsync({
        fullName: fullName.trim(),
        company: company.trim() || undefined,
        title: title.trim() || undefined,
        emails: email.trim() ? [email.trim()] : [],
        phones: phone.trim() ? [phone.trim()] : [],
        website: website.trim() || undefined,
        notes: notes.trim() || undefined,
        leadQualifier: leadQualifier || undefined,
      });
      router.push(`/admin/contacts/${contactId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  if (isLoading || !contact) {
    return <p className="text-text-secondary">Loading contact…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit contact"
        description={contact.fullName}
        action={
          <Link href={`/admin/contacts/${contactId}`}>
            <Button variant="ghost">Cancel</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Lead qualifier
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={leadQualifier}
                onChange={(e) => setLeadQualifier(e.target.value as LeadQualifier | '')}
              >
                <option value="">Unqualified</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Notes
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button type="submit" loading={updateContact.isPending}>
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
