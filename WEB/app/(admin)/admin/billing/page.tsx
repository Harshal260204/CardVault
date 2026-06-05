'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBillingCheckout, useBillingPortal, useBillingSubscription } from '@/hooks/use-billing';

export default function BillingPage() {
  const { data, isLoading } = useBillingSubscription();
  const checkout = useBillingCheckout();
  const portal = useBillingPortal();

  const openCheckout = async () => {
    const session = await checkout.mutateAsync();
    window.location.href = session.url;
  };

  const openPortal = async () => {
    const session = await portal.mutateAsync();
    window.location.href = session.url;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & plan"
        description="Manage your organization subscription via Stripe"
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          {isLoading ? (
            <p className="text-text-secondary">Loading subscription…</p>
          ) : (
            <>
              <div>
                <p className="text-sm text-text-tertiary">Current plan</p>
                <p className="text-2xl font-semibold text-foreground">
                  {data?.planName ?? data?.plan ?? '—'}
                </p>
                <p className="text-sm text-text-secondary">
                  {data?.planPriceInr ? `₹${data.planPriceInr}` : 'Free tier'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={openCheckout}
                  loading={checkout.isPending}
                  disabled={!data?.billingEnabled}
                >
                  Upgrade to Pro
                </Button>
                <Button
                  variant="secondary"
                  onClick={openPortal}
                  loading={portal.isPending}
                  disabled={!data?.stripeCustomerId || !data?.billingEnabled}
                >
                  Manage subscription
                </Button>
              </div>
              {!data?.billingEnabled ? (
                <p className="text-sm text-text-tertiary">
                  Stripe is not configured on the API. Set STRIPE_SECRET_KEY and STRIPE_PRICE_PRO.
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
