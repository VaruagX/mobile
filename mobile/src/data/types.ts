/** Domain types. They mirror the backend schema (backend/migrations/001-005). */

export type Role = 'admin' | 'team' | 'client';
export type AccountStatus = 'active' | 'suspended' | 'disabled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type User = {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  clientId?: string;
  status: AccountStatus;
  joinedOn: string;
};

export type Client = {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  gstin?: string;
  status: 'active' | 'suspended' | 'archived';
  since: string;
};

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export type Project = {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  clientId: string;
  managerId: string;
  memberIds: string[];
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  dueDate: string;
  budget?: number;
};

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold';

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  order: number;
  weight: number;
  status: MilestoneStatus;
  startDate?: string;
  dueDate?: string;
  clientVisible: boolean;
};

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'changes_requested' | 'done' | 'cancelled';

export type Task = {
  id: string;
  milestoneId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  weight: number;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  estimatedHours?: number;
  verifiedAt?: string;
};

export type Submission = {
  id: string;
  taskId: string;
  revision: number;
  notes: string;
  links: string[];
  fileIds: string[];
  status: 'pending' | 'verified' | 'changes_requested';
  submittedBy: string;
  createdAt: string;
  reviewNote?: string;
  reviewedAt?: string;
};

export type Blocker = {
  id: string;
  taskId: string;
  reportedBy: string;
  description: string;
  status: 'open' | 'resolved';
  createdAt: string;
  resolution?: string;
};

export type FileItem = {
  id: string;
  projectId?: string;
  taskId?: string;
  name: string;
  mime: string;
  size: number;
  visibility: 'internal' | 'client';
  uploadedBy: string;
  createdAt: string;
};

export type ProjectUpdate = {
  id: string;
  projectId: string;
  milestoneId?: string;
  authorId: string;
  title: string;
  body: string;
  status: 'draft' | 'pending_approval' | 'published';
  createdAt: string;
  publishedAt?: string;
  fileIds: string[];
};

export type Message = {
  id: string;
  projectId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type InvoiceItem = { description: string; quantity: number; unitPrice: number; taxRate: number };

export type Invoice = {
  id: string;
  number: string;
  clientId: string;
  projectId?: string;
  milestoneId?: string;
  title: string;
  status: 'draft' | 'issued' | 'void';
  issueDate?: string;
  dueDate?: string;
  items: InvoiceItem[];
  notes?: string;
};

export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'online';

export type Payment = {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'verified' | 'rejected';
  paidOn: string;
  reference?: string;
  note?: string;
  proofName?: string;
  submittedBy: string;
  createdAt: string;
  verifiedAt?: string;
  receiptNumber?: string;
  rejectionReason?: string;
};

export type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  projectId?: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_client' | 'resolved' | 'closed';

export type TicketMessage = { id: string; authorId: string; body: string; createdAt: string; internal?: boolean };

export type Ticket = {
  id: string;
  number: string;
  clientId: string;
  projectId?: string;
  raisedBy: string;
  assignedTo?: string;
  subject: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  createdAt: string;
  messages: TicketMessage[];
};

export type AppNotification = {
  id: string;
  userId: string;
  kind: 'task' | 'project' | 'billing' | 'support' | 'team';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'team' | 'client';
  publishedAt: string;
  authorId: string;
};

export type DemoState = {
  users: User[];
  clients: Client[];
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  submissions: Submission[];
  blockers: Blocker[];
  files: FileItem[];
  updates: ProjectUpdate[];
  messages: Message[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  tickets: Ticket[];
  notifications: AppNotification[];
  announcements: Announcement[];
};
