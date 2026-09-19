/**
 * Cloudflare Workflows stubs — Phase 0/7/9.
 * Replan: cancel → research → propose → waitForEvent(approval) → execute
 * BrowserAction: approved booking / checkout prep
 * Onboarding: private 5-question DM flow
 */

export type WorkflowName = "Onboarding" | "Replan" | "BrowserAction";

export function listWorkflows(): WorkflowName[] {
  return ["Onboarding", "Replan", "BrowserAction"];
}
