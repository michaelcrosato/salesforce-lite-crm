import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  XCircle,
  type LucideIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type {
  ApprovalPolicyRegistry,
  ApprovalPolicySubject,
  ApprovalPolicyWriteFlags
} from "@/lib/server/approvalPolicyRegistry";
import type {
  ApprovalReviewPacket,
  ApprovalReviewPacketAudit,
  ApprovalReviewPacketBatch,
  ApprovalReviewPacketStatus
} from "@/lib/server/approvalReviewPackets";

type ApprovalReadinessOperatorProps = {
  registry: ApprovalPolicyRegistry;
  packetBatch: ApprovalReviewPacketBatch;
  audit: ApprovalReviewPacketAudit;
};

const writeFlagLabels = [
  { key: "database", label: "Database" },
  { key: "crmRecords", label: "CRM records" },
  { key: "auditEvents", label: "Audit events" },
  { key: "approvalDecisions", label: "Approval decisions" },
  { key: "approvals", label: "Approvals" },
  { key: "routes", label: "Routes" },
  { key: "routeHandlers", label: "Route handlers" },
  { key: "productUi", label: "Packet product UI" },
  { key: "externalServices", label: "External services" },
  { key: "backgroundJobs", label: "Background jobs" },
  { key: "actionExecution", label: "Action execution" },
  { key: "auth", label: "Auth enforcement" }
] satisfies ReadonlyArray<{
  key: keyof ApprovalPolicyWriteFlags;
  label: string;
}>;

const guardrailMessages = [
  {
    title: "Decision controls absent",
    detail:
      "The surface reports approval requirements but does not approve, reject, or persist decisions."
  },
  {
    title: "Execution disabled",
    detail:
      "Sample packets never execute actions, mutate CRM records, re-run routing, or schedule jobs."
  },
  {
    title: "Provider scope blocked",
    detail:
      "External AI providers, network calls, email sends, Salesforce sync, and credentials remain outside scope."
  },
  {
    title: "Route scope unchanged",
    detail:
      "Approval readiness stays inside /reports and does not add route handlers or promote excluded routes."
  }
] as const;

export function ApprovalReadinessOperator({
  registry,
  packetBatch,
  audit
}: ApprovalReadinessOperatorProps) {
  const hasWriteSurface = writeFlagLabels.some(
    (flag) => packetBatch.write[flag.key]
  );

  return (
    <section className="space-y-4" data-testid="approval-readiness-operator">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            Approval Readiness
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect no-write approval policies and sample review packets before
            any approval engine exists.
          </p>
        </div>
        <Badge variant={audit.ok ? "success" : "warning"}>
          {audit.ok ? "packet audit ready" : "packet audit review needed"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={ClipboardCheck}
          label="Supported subjects"
          value={formatNumber(registry.supportedSubjectCount)}
          testId="approval-readiness-summary-supported"
        />
        <SummaryCard
          icon={XCircle}
          label="Blocked subjects"
          value={formatNumber(registry.blockedSubjectCount)}
          testId="approval-readiness-summary-blocked"
        />
        <SummaryCard
          icon={FileText}
          label="Approval-needed samples"
          value={formatNumber(packetBatch.summary.approvalNeededCount)}
          testId="approval-readiness-summary-approval-needed"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Write surfaces"
          value={hasWriteSurface ? "Review" : "None"}
          testId="approval-readiness-summary-writes"
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Registry Coverage</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatNumber(registry.subjectCount)} subject policies across{" "}
                {formatNumber(registry.blockedCapabilities.length)} blocked
                capabilities.
              </p>
            </div>
            <Badge variant="outline">{registry.registryVersion}</Badge>
          </CardHeader>
          <CardContent>
            <Table data-testid="approval-readiness-registry-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registry.subjects.map((subject) => (
                  <RegistrySubjectRow key={subject.id} subject={subject} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Sample Review Packets</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatNumber(packetBatch.summary.packetCount)} deterministic
                samples, {formatNumber(packetBatch.summary.issueCount)} total
                issues.
              </p>
            </div>
            <Badge variant="outline">{packetBatch.packetVersion}</Badge>
          </CardHeader>
          <CardContent>
            <Table data-testid="approval-readiness-packet-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packetBatch.packets.map((packet) => (
                  <PacketRow key={packet.proposal.proposalId} packet={packet} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="approval-readiness-guardrails">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Guardrails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-4">
            {guardrailMessages.map((guardrail) => (
              <div
                key={guardrail.title}
                className="rounded-md border bg-muted/20 px-3 py-3 text-sm"
              >
                <div className="font-medium">{guardrail.title}</div>
                <p className="mt-2 text-muted-foreground">
                  {guardrail.detail}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="approval-readiness-write-flags"
      >
        {writeFlagLabels.map((flag) => (
          <div
            key={flag.key}
            className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
          >
            <span className="font-medium">{flag.label}</span>{" "}
            <span className="ml-2 text-muted-foreground">
              {packetBatch.write[flag.key] ? "on" : "off"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RegistrySubjectRow({
  subject
}: {
  subject: ApprovalPolicySubject;
}) {
  return (
    <TableRow data-testid={`approval-readiness-subject-${subject.status}`}>
      <TableCell className="font-medium">
        {subject.label}
        <span className="mt-1 block max-w-[18rem] truncate text-xs text-muted-foreground">
          {subject.id}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={policyStatusVariant(subject.status)}>
          {formatToken(subject.status)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={riskVariant(subject.riskLevel)}>
          {formatToken(subject.riskLevel)}
        </Badge>
      </TableCell>
      <TableCell>
        {subject.reviewer.displayName}
        <span className="mt-1 block max-w-[14rem] truncate text-xs text-muted-foreground">
          {subject.reviewer.label}
        </span>
      </TableCell>
      <TableCell>{formatNumber(subject.evidence.length)}</TableCell>
    </TableRow>
  );
}

function PacketRow({ packet }: { packet: ApprovalReviewPacket }) {
  return (
    <TableRow data-testid={`approval-readiness-packet-${testIdToken(packet.status)}`}>
      <TableCell className="font-medium">
        {packet.proposal.label ?? "Unknown proposal"}
        <span className="mt-1 block max-w-[18rem] truncate text-xs text-muted-foreground">
          {packet.proposal.proposalId ?? "No proposal id"}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={packetStatusVariant(packet.status)}>
          {formatToken(packet.status)}
        </Badge>
      </TableCell>
      <TableCell>
        {packet.proposal.target?.entity ?? "Unknown"}
        <span className="mt-1 block max-w-[12rem] truncate text-xs text-muted-foreground">
          {formatNumber(packet.proposal.target?.recordCount ?? 0)} records
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>
            Approval{" "}
            {packet.approval?.approvalRequired ? "required" : "not required"}
          </span>
          <span>
            Audit{" "}
            {packet.audit?.auditRequiredBeforeExecution
              ? "required before execution"
              : "not required"}
          </span>
          <span>
            Execution {packet.safety.currentExecutionAllowed ? "on" : "off"} /
            writes {packet.summary.wouldWriteNow ? "on" : "off"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className="block max-w-[18rem] truncate">
          {packet.issues.length > 0
            ? packet.issues.map((issue) => formatToken(issue.code)).join(", ")
            : "none"}
        </span>
      </TableCell>
    </TableRow>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  testId
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-normal">{value}</div>
      </CardContent>
    </Card>
  );
}

function policyStatusVariant(status: ApprovalPolicySubject["status"]) {
  switch (status) {
    case "supported":
      return "success";
    case "blocked":
      return "danger";
  }
}

function packetStatusVariant(status: ApprovalReviewPacketStatus) {
  switch (status) {
    case "approval_needed":
      return "warning";
    case "blocked":
      return "danger";
    case "not_needed":
      return "success";
  }
}

function riskVariant(riskLevel: ApprovalPolicySubject["riskLevel"]) {
  switch (riskLevel) {
    case "medium":
      return "outline";
    case "high":
      return "warning";
    case "critical":
    case "blocked":
      return "danger";
  }
}

function formatToken(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function testIdToken(value: string): string {
  return value.replaceAll("_", "-");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
