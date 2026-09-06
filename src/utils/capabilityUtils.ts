import { Capability, MockPersona } from '../types';

/**
 * Centralized Capability Checking Logic
 * Ensures authorization checks are decoupled from presentation titles or roles.
 */

export function hasCapability(persona: MockPersona | null | undefined, capability: Capability): boolean {
  if (!persona || !persona.capabilities) return false;
  return persona.capabilities.includes(capability);
}

export function hasAnyCapability(persona: MockPersona | null | undefined, capabilities: Capability[]): boolean {
  if (!persona || !persona.capabilities) return false;
  if (!capabilities || capabilities.length === 0) return true;
  return capabilities.some((cap) => persona.capabilities.includes(cap));
}

export function hasAllCapabilities(persona: MockPersona | null | undefined, capabilities: Capability[]): boolean {
  if (!persona || !persona.capabilities) return false;
  if (!capabilities || capabilities.length === 0) return true;
  return capabilities.every((cap) => persona.capabilities.includes(cap));
}

// Named capability checks corresponding strictly to Prompt 6 mandates:
export const canManageUsers = (p: MockPersona | null | undefined) => hasCapability(p, 'USER_MANAGE');
export const canManageResponsibilities = (p: MockPersona | null | undefined) => hasCapability(p, 'RESPONSIBILITY_MANAGE');
export const canManageDelegation = (p: MockPersona | null | undefined) => hasCapability(p, 'DELEGATION_MANAGE');
export const canCreateWork = (p: MockPersona | null | undefined) => hasCapability(p, 'WORK_CREATE');
export const canAssignWork = (p: MockPersona | null | undefined) => hasCapability(p, 'WORK_ASSIGN');
export const canViewManagement = (p: MockPersona | null | undefined) => hasCapability(p, 'MANAGEMENT_VIEW') || hasCapability(p, 'ops_view');
