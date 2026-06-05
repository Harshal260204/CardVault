import type { CaptureMode, LeadQualifier } from '@/lib/types';

const CAPTURE_LABELS: Record<CaptureMode, string> = {
  visitor: 'Visitor',
  exhibitor: 'Exhibitor',
  quick_capture: 'Quick Capture',
  legacy: 'Legacy',
};

export function formatCaptureMode(mode: CaptureMode | null | undefined): string {
  if (!mode) return 'Legacy';
  return CAPTURE_LABELS[mode] ?? mode;
}

export function leadBadgeVariant(
  qualifier: LeadQualifier | null | undefined,
): 'hot' | 'warm' | 'cold' | 'default' {
  if (qualifier === 'hot') return 'hot';
  if (qualifier === 'warm') return 'warm';
  if (qualifier === 'cold') return 'cold';
  return 'default';
}

export function formatLeadLabel(qualifier: LeadQualifier | null | undefined): string {
  if (!qualifier) return 'Unqualified';
  return qualifier.charAt(0).toUpperCase() + qualifier.slice(1);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
