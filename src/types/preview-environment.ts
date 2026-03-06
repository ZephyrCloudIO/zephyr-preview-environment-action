export type DeploymentStatus = "deployed" | "pending_approval" | "rejected";

export interface ApprovalInfo {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  requiredApprovals: number;
  currentApprovals: number;
}

export interface PreviewEnvironment {
  projectName: string;
  urls: string[];
  status?: DeploymentStatus;
  approval?: ApprovalInfo;
}
