/**
 * DEMO DATA — fictional clients, projects, invoices and people used to review the UI
 * before the API is connected. Nothing here is real business data. Every screen that
 * shows it carries a "Demo data" badge. Replace with API calls in the integration stage.
 *
 * "Today" in the demo is 5 Nov 2026 (see lib/format.ts DEMO_TODAY).
 */
import type { DemoState } from './types';

export const DEMO_ACCOUNTS = {
  admin: 'u-admin',
  team: 'u-rohan',
  client: 'u-raj',
} as const;

export function createDemoState(): DemoState {
  return {
    users: [
      { id: 'u-admin', role: 'admin', name: 'Gaurav Kale', email: 'admin@demo.varuaglabs.in', phone: '+91 90000 00001', jobTitle: 'Founder & CEO', status: 'active', joinedOn: '2024-01-10' },
      { id: 'u-rohan', role: 'team', name: 'Rohan Patil', email: 'rohan@demo.varuaglabs.in', phone: '+91 90000 00011', jobTitle: 'Frontend developer', status: 'active', joinedOn: '2025-06-02' },
      { id: 'u-sneha', role: 'team', name: 'Sneha Kulkarni', email: 'sneha@demo.varuaglabs.in', phone: '+91 90000 00012', jobTitle: 'Backend developer', status: 'active', joinedOn: '2025-03-17' },
      { id: 'u-aditya', role: 'team', name: 'Aditya Joshi', email: 'aditya@demo.varuaglabs.in', phone: '+91 90000 00013', jobTitle: 'Product designer', status: 'active', joinedOn: '2025-08-11' },
      { id: 'u-priya', role: 'team', name: 'Priya Deshmukh', email: 'priya@demo.varuaglabs.in', phone: '+91 90000 00014', jobTitle: 'QA engineer', status: 'active', joinedOn: '2026-01-05' },
      { id: 'u-kunal', role: 'team', name: 'Kunal Shinde', email: 'kunal@demo.varuaglabs.in', phone: '+91 90000 00015', jobTitle: 'Mobile developer', status: 'suspended', joinedOn: '2025-11-20' },
      { id: 'u-raj', role: 'client', clientId: 'c-mehta', name: 'Raj Mehta', email: 'raj@mehtarealty.demo', phone: '+91 90000 00021', jobTitle: 'Director', status: 'active', joinedOn: '2026-09-01' },
      { id: 'u-neha', role: 'client', clientId: 'c-arogya', name: 'Dr. Neha Rao', email: 'neha@arogya.demo', phone: '+91 90000 00022', jobTitle: 'Founder', status: 'active', joinedOn: '2026-08-14' },
      { id: 'u-amit', role: 'client', clientId: 'c-kisan', name: 'Amit Pawar', email: 'amit@kisanfresh.demo', phone: '+91 90000 00023', jobTitle: 'Operations head', status: 'active', joinedOn: '2026-10-20' },
    ],
    clients: [
      { id: 'c-mehta', company: 'Mehta Realty', contactName: 'Raj Mehta', email: 'raj@mehtarealty.demo', phone: '+91 90000 00021', city: 'Pune', gstin: '27AAAAA0000A1Z5', status: 'active', since: '2026-03-02' },
      { id: 'c-arogya', company: 'Arogya Clinics', contactName: 'Dr. Neha Rao', email: 'neha@arogya.demo', phone: '+91 90000 00022', city: 'Nashik', status: 'active', since: '2026-08-14' },
      { id: 'c-kisan', company: 'Kisan Fresh', contactName: 'Amit Pawar', email: 'amit@kisanfresh.demo', phone: '+91 90000 00023', city: 'Satara', status: 'active', since: '2026-10-20' },
    ],
    projects: [
      {
        id: 'p-realty', code: 'VL-P0004', name: 'Real estate website', category: 'Website',
        description: 'Property listing website with search filters, enquiry forms and an admin panel for listings.',
        clientId: 'c-mehta', managerId: 'u-admin', memberIds: ['u-rohan', 'u-sneha', 'u-aditya', 'u-priya'],
        status: 'active', priority: 'high', startDate: '2026-09-15', dueDate: '2026-12-20', budget: 275000,
      },
      {
        id: 'p-clinic', code: 'VL-P0005', name: 'Clinic booking app', category: 'Mobile app',
        description: 'Patient appointment booking app with reminders and a clinic dashboard.',
        clientId: 'c-arogya', managerId: 'u-admin', memberIds: ['u-sneha', 'u-aditya', 'u-kunal', 'u-rohan'],
        status: 'active', priority: 'urgent', startDate: '2026-10-01', dueDate: '2027-01-31', budget: 420000,
      },
      {
        id: 'p-kisan', code: 'VL-P0006', name: 'Farm-to-door ordering', category: 'Web app',
        description: 'Ordering platform for fresh produce with delivery slots and UPI checkout.',
        clientId: 'c-kisan', managerId: 'u-admin', memberIds: ['u-aditya', 'u-sneha'],
        status: 'planning', priority: 'medium', startDate: '2026-11-15', dueDate: '2027-03-15', budget: 360000,
      },
      {
        id: 'p-brand', code: 'VL-P0002', name: 'Company brand site', category: 'Website',
        description: 'Five-page brand website with contact form and Google Business setup.',
        clientId: 'c-mehta', managerId: 'u-admin', memberIds: ['u-rohan', 'u-aditya'],
        status: 'completed', priority: 'low', startDate: '2026-03-10', dueDate: '2026-04-30', budget: 60000,
      },
    ],
    milestones: [
      { id: 'm-r1', projectId: 'p-realty', title: 'Discovery', order: 1, weight: 10, status: 'completed', startDate: '2026-09-15', dueDate: '2026-09-30', clientVisible: true, description: 'Requirements, sitemap and content plan.' },
      { id: 'm-r2', projectId: 'p-realty', title: 'Design', order: 2, weight: 20, status: 'completed', startDate: '2026-10-01', dueDate: '2026-10-20', clientVisible: true, description: 'Wireframes and visual design for all key pages.' },
      { id: 'm-r3', projectId: 'p-realty', title: 'Frontend', order: 3, weight: 35, status: 'in_progress', startDate: '2026-10-21', dueDate: '2026-11-24', clientVisible: true, description: 'Responsive pages, listing search and enquiry forms.' },
      { id: 'm-r4', projectId: 'p-realty', title: 'Backend', order: 4, weight: 25, status: 'pending', startDate: '2026-11-10', dueDate: '2026-12-08', clientVisible: true, description: 'Listings API, admin panel and lead notifications.' },
      { id: 'm-r5', projectId: 'p-realty', title: 'Launch', order: 5, weight: 10, status: 'pending', startDate: '2026-12-09', dueDate: '2026-12-20', clientVisible: true, description: 'Testing, hosting setup and go-live.' },

      { id: 'm-c1', projectId: 'p-clinic', title: 'Discovery', order: 1, weight: 10, status: 'completed', startDate: '2026-10-01', dueDate: '2026-10-12', clientVisible: true },
      { id: 'm-c2', projectId: 'p-clinic', title: 'Design', order: 2, weight: 20, status: 'in_progress', startDate: '2026-10-13', dueDate: '2026-11-08', clientVisible: true },
      { id: 'm-c3', projectId: 'p-clinic', title: 'Build', order: 3, weight: 55, status: 'pending', startDate: '2026-11-09', dueDate: '2027-01-10', clientVisible: true },
      { id: 'm-c4', projectId: 'p-clinic', title: 'Launch', order: 4, weight: 15, status: 'pending', startDate: '2027-01-11', dueDate: '2027-01-31', clientVisible: true },

      { id: 'm-k1', projectId: 'p-kisan', title: 'Discovery', order: 1, weight: 15, status: 'pending', startDate: '2026-11-15', dueDate: '2026-11-30', clientVisible: true },
      { id: 'm-k2', projectId: 'p-kisan', title: 'Design', order: 2, weight: 25, status: 'pending', dueDate: '2026-12-31', clientVisible: true },
      { id: 'm-k3', projectId: 'p-kisan', title: 'Build', order: 3, weight: 45, status: 'pending', dueDate: '2027-02-28', clientVisible: true },
      { id: 'm-k4', projectId: 'p-kisan', title: 'Launch', order: 4, weight: 15, status: 'pending', dueDate: '2027-03-15', clientVisible: true },

      { id: 'm-b1', projectId: 'p-brand', title: 'Design', order: 1, weight: 40, status: 'completed', dueDate: '2026-03-31', clientVisible: true },
      { id: 'm-b2', projectId: 'p-brand', title: 'Build & launch', order: 2, weight: 60, status: 'completed', dueDate: '2026-04-30', clientVisible: true },
    ],
    tasks: [
      // Real estate · Discovery
      { id: 't-r1a', milestoneId: 'm-r1', title: 'Requirements workshop', weight: 50, priority: 'medium', status: 'done', assigneeId: 'u-aditya', dueDate: '2026-09-22', verifiedAt: '2026-09-23T11:00:00' },
      { id: 't-r1b', milestoneId: 'm-r1', title: 'Sitemap and content plan', weight: 50, priority: 'medium', status: 'done', assigneeId: 'u-aditya', dueDate: '2026-09-30', verifiedAt: '2026-09-30T17:00:00' },
      // Real estate · Design
      { id: 't-r2a', milestoneId: 'm-r2', title: 'Wireframes', weight: 40, priority: 'high', status: 'done', assigneeId: 'u-aditya', dueDate: '2026-10-08', verifiedAt: '2026-10-09T12:00:00' },
      { id: 't-r2b', milestoneId: 'm-r2', title: 'Visual design system', weight: 60, priority: 'high', status: 'done', assigneeId: 'u-aditya', dueDate: '2026-10-20', verifiedAt: '2026-10-20T18:30:00' },
      // Real estate · Frontend
      { id: 't-r3a', milestoneId: 'm-r3', title: 'Homepage build', description: 'Hero, featured listings, testimonials and enquiry form. Mobile first.', weight: 15, priority: 'high', status: 'changes_requested', assigneeId: 'u-rohan', dueDate: '2026-11-06', estimatedHours: 18 },
      { id: 't-r3b', milestoneId: 'm-r3', title: 'Property listing filters', description: 'Filter by locality, budget, BHK and possession date. URL-synced filters.', weight: 20, priority: 'high', status: 'in_progress', assigneeId: 'u-rohan', dueDate: '2026-11-08', estimatedHours: 16 },
      { id: 't-r3c', milestoneId: 'm-r3', title: 'Listing detail page', weight: 25, priority: 'medium', status: 'done', assigneeId: 'u-rohan', dueDate: '2026-10-31', verifiedAt: '2026-11-01T16:00:00' },
      { id: 't-r3d', milestoneId: 'm-r3', title: 'Enquiry form + WhatsApp hand-off', weight: 20, priority: 'medium', status: 'in_review', assigneeId: 'u-rohan', dueDate: '2026-11-05', estimatedHours: 8 },
      { id: 't-r3e', milestoneId: 'm-r3', title: 'Responsive QA pass', weight: 20, priority: 'medium', status: 'todo', assigneeId: 'u-priya', dueDate: '2026-11-20' },
      // Real estate · Backend
      { id: 't-r4a', milestoneId: 'm-r4', title: 'Listings API', weight: 50, priority: 'high', status: 'in_progress', assigneeId: 'u-sneha', dueDate: '2026-11-25' },
      { id: 't-r4b', milestoneId: 'm-r4', title: 'Admin panel', weight: 50, priority: 'medium', status: 'todo', assigneeId: 'u-sneha', dueDate: '2026-12-08' },
      // Real estate · Launch
      { id: 't-r5a', milestoneId: 'm-r5', title: 'Hosting and domain setup', weight: 40, priority: 'medium', status: 'todo', assigneeId: 'u-sneha', dueDate: '2026-12-15' },
      { id: 't-r5b', milestoneId: 'm-r5', title: 'Go-live checklist', weight: 60, priority: 'medium', status: 'todo', assigneeId: 'u-priya', dueDate: '2026-12-20' },

      // Clinic · Discovery
      { id: 't-c1a', milestoneId: 'm-c1', title: 'Clinic workflow mapping', weight: 100, priority: 'high', status: 'done', assigneeId: 'u-aditya', dueDate: '2026-10-12', verifiedAt: '2026-10-12T15:00:00' },
      // Clinic · Design
      { id: 't-c2a', milestoneId: 'm-c2', title: 'Appointment flow wireframes', weight: 40, priority: 'high', status: 'done', assigneeId: 'u-aditya', dueDate: '2026-10-25', verifiedAt: '2026-10-26T10:00:00' },
      { id: 't-c2b', milestoneId: 'm-c2', title: 'UI kit and screens', weight: 60, priority: 'high', status: 'blocked', assigneeId: 'u-aditya', dueDate: '2026-11-08' },
      // Clinic · Build
      { id: 't-c3a', milestoneId: 'm-c3', title: 'Booking API', weight: 30, priority: 'high', status: 'todo', assigneeId: 'u-sneha', dueDate: '2026-12-05' },
      { id: 't-c3b', milestoneId: 'm-c3', title: 'Patient app screens', weight: 40, priority: 'high', status: 'todo', assigneeId: 'u-rohan', dueDate: '2026-12-20' },
      { id: 't-c3c', milestoneId: 'm-c3', title: 'SMS + push reminders', weight: 30, priority: 'medium', status: 'todo', assigneeId: 'u-kunal', dueDate: '2027-01-05' },
      // Clinic · Launch
      { id: 't-c4a', milestoneId: 'm-c4', title: 'Play Store release', weight: 100, priority: 'medium', status: 'todo', assigneeId: 'u-kunal', dueDate: '2027-01-31' },

      // Kisan · Discovery
      { id: 't-k1a', milestoneId: 'm-k1', title: 'Kick-off and requirements', weight: 100, priority: 'medium', status: 'todo', assigneeId: 'u-aditya', dueDate: '2026-11-20' },

      // Brand site (completed)
      { id: 't-b1a', milestoneId: 'm-b1', title: 'Brand pages design', weight: 100, priority: 'low', status: 'done', assigneeId: 'u-aditya', dueDate: '2026-03-31', verifiedAt: '2026-03-31T12:00:00' },
      { id: 't-b2a', milestoneId: 'm-b2', title: 'Build and launch', weight: 100, priority: 'low', status: 'done', assigneeId: 'u-rohan', dueDate: '2026-04-30', verifiedAt: '2026-04-30T12:00:00' },
    ],
    submissions: [
      {
        id: 's-1', taskId: 't-r3a', revision: 1, status: 'changes_requested', submittedBy: 'u-rohan', createdAt: '2026-11-04T17:20:00',
        notes: 'Homepage done: hero, featured listings carousel, testimonials and enquiry form. Tested on Android Chrome and Safari.',
        links: ['https://preview.demo.varuaglabs.in/realty'], fileIds: ['f-5'],
        reviewNote: 'Looks great. Tighten the mobile nav spacing and make the enquiry button sticky on small screens, then resubmit.',
        reviewedAt: '2026-11-05T09:10:00',
      },
      {
        id: 's-2', taskId: 't-r3d', revision: 1, status: 'pending', submittedBy: 'u-rohan', createdAt: '2026-11-05T10:05:00',
        notes: 'Enquiry form validates phone numbers and hands off to WhatsApp with the listing name pre-filled.',
        links: ['https://preview.demo.varuaglabs.in/realty/enquiry'], fileIds: [],
      },
    ],
    blockers: [
      { id: 'b-1', taskId: 't-c2b', reportedBy: 'u-aditya', description: 'Waiting for the clinic logo files and brand colours from the client.', status: 'open', createdAt: '2026-11-05T08:30:00' },
    ],
    files: [
      { id: 'f-1', projectId: 'p-realty', name: 'brand-guide.pdf', mime: 'application/pdf', size: 2_400_000, visibility: 'client', uploadedBy: 'u-aditya', createdAt: '2026-10-20T18:00:00' },
      { id: 'f-2', projectId: 'p-realty', name: 'homepage-preview.pdf', mime: 'application/pdf', size: 3_100_000, visibility: 'client', uploadedBy: 'u-rohan', createdAt: '2026-11-05T09:30:00' },
      { id: 'f-3', projectId: 'p-realty', name: 'wireframes-v2.png', mime: 'image/png', size: 860_000, visibility: 'internal', uploadedBy: 'u-aditya', createdAt: '2026-10-08T12:00:00' },
      { id: 'f-4', projectId: 'p-realty', name: 'listings-api-notes.md', mime: 'text/markdown', size: 14_000, visibility: 'internal', uploadedBy: 'u-sneha', createdAt: '2026-11-03T11:00:00' },
      { id: 'f-5', projectId: 'p-realty', taskId: 't-r3a', name: 'homepage-mobile.png', mime: 'image/png', size: 1_200_000, visibility: 'internal', uploadedBy: 'u-rohan', createdAt: '2026-11-04T17:15:00' },
      { id: 'f-6', projectId: 'p-clinic', name: 'appointment-flow.pdf', mime: 'application/pdf', size: 1_700_000, visibility: 'client', uploadedBy: 'u-aditya', createdAt: '2026-10-26T10:00:00' },
    ],
    updates: [
      {
        id: 'up-1', projectId: 'p-realty', milestoneId: 'm-r3', authorId: 'u-admin', status: 'published', createdAt: '2026-11-05T09:00:00', publishedAt: '2026-11-05T09:40:00', fileIds: ['f-2'],
        title: 'Homepage is ready for your review',
        body: 'The homepage and property listing layout are live on the preview link. Share feedback by Friday so we can finish the frontend milestone on time.',
      },
      {
        id: 'up-2', projectId: 'p-realty', milestoneId: 'm-r2', authorId: 'u-admin', status: 'published', createdAt: '2026-10-20T18:00:00', publishedAt: '2026-10-21T10:00:00', fileIds: ['f-1'],
        title: 'Design approved, frontend underway',
        body: 'Thank you for approving the designs. The brand guide is attached for your records. Frontend development started today.',
      },
      {
        id: 'up-3', projectId: 'p-realty', milestoneId: 'm-r3', authorId: 'u-rohan', status: 'pending_approval', createdAt: '2026-11-05T11:00:00', fileIds: [],
        title: 'Property filters in progress',
        body: 'Locality and budget filters are working on staging. BHK and possession-date filters are next.',
      },
      {
        id: 'up-4', projectId: 'p-clinic', milestoneId: 'm-c2', authorId: 'u-admin', status: 'published', createdAt: '2026-10-26T10:00:00', publishedAt: '2026-10-26T12:00:00', fileIds: ['f-6'],
        title: 'Appointment flow approved',
        body: 'The patient booking flow is final. We are now designing the full UI kit.',
      },
    ],
    messages: [
      { id: 'msg-1', projectId: 'p-realty', authorId: 'u-sneha', body: 'Staging is updated with the new listing API. Filters can use it now.', createdAt: '2026-11-05T10:42:00' },
      { id: 'msg-2', projectId: 'p-realty', authorId: 'u-rohan', body: 'Great, wiring it up this afternoon.', createdAt: '2026-11-05T10:51:00' },
      { id: 'msg-3', projectId: 'p-realty', authorId: 'u-admin', body: 'Client wants the enquiry button sticky on mobile. Please include in the homepage fix.', createdAt: '2026-11-05T11:05:00' },
      { id: 'msg-4', projectId: 'p-clinic', authorId: 'u-aditya', body: 'Still waiting on clinic logo files. Raised a blocker.', createdAt: '2026-11-05T08:31:00' },
      { id: 'msg-5', projectId: 'p-clinic', authorId: 'u-admin', body: 'I will call Dr. Rao today and follow up.', createdAt: '2026-11-05T09:02:00' },
      { id: 'msg-6', projectId: 'p-brand', authorId: 'u-rohan', body: 'Brand site is live. Closing this thread.', createdAt: '2026-04-30T18:00:00' },
    ],
    invoices: [
      {
        id: 'i-9', number: 'VL-INV-2026-0009', clientId: 'c-mehta', projectId: 'p-brand', title: 'Company brand site', status: 'issued', issueDate: '2026-04-30', dueDate: '2026-05-15',
        items: [{ description: 'Brand website: design, build and launch', quantity: 1, unitPrice: 50000, taxRate: 18 }],
      },
      {
        id: 'i-12', number: 'VL-INV-2026-0012', clientId: 'c-mehta', projectId: 'p-realty', milestoneId: 'm-r2', title: 'Discovery + Design', status: 'issued', issueDate: '2026-10-01', dueDate: '2026-10-15',
        items: [
          { description: 'Discovery and content plan', quantity: 1, unitPrice: 25000, taxRate: 18 },
          { description: 'UI/UX design: all key pages', quantity: 1, unitPrice: 59745.76, taxRate: 18 },
        ],
      },
      {
        id: 'i-13', number: 'VL-INV-2026-0013', clientId: 'c-arogya', projectId: 'p-clinic', title: 'Clinic app: advance', status: 'issued', issueDate: '2026-10-15', dueDate: '2026-10-30',
        items: [{ description: 'Project advance (30%)', quantity: 1, unitPrice: 106779.66, taxRate: 18 }],
      },
      {
        id: 'i-14', number: 'VL-INV-2026-0014', clientId: 'c-mehta', projectId: 'p-realty', milestoneId: 'm-r3', title: 'Frontend milestone', status: 'issued', issueDate: '2026-11-01', dueDate: '2026-11-15',
        items: [{ description: 'Frontend development', quantity: 1, unitPrice: 63559.32, taxRate: 18 }],
        notes: 'Payment by UPI or bank transfer. Share the transaction reference in the app.',
      },
      {
        id: 'i-15', number: 'VL-INV-2026-0015', clientId: 'c-kisan', projectId: 'p-kisan', title: 'Kick-off advance', status: 'draft', dueDate: '2026-11-25',
        items: [{ description: 'Project advance (12.5%)', quantity: 1, unitPrice: 38135.59, taxRate: 18 }],
      },
    ],
    payments: [
      { id: 'pay-1', invoiceId: 'i-9', amount: 59000, method: 'bank_transfer', status: 'verified', paidOn: '2026-05-10', reference: 'UTR 4021 7781 1123', submittedBy: 'u-raj', createdAt: '2026-05-10T12:00:00', verifiedAt: '2026-05-11T10:00:00', receiptNumber: 'VL-RCPT-0003' },
      { id: 'pay-2', invoiceId: 'i-12', amount: 100000, method: 'bank_transfer', status: 'verified', paidOn: '2026-10-12', reference: 'UTR 4022 1094 5510', submittedBy: 'u-raj', createdAt: '2026-10-12T15:00:00', verifiedAt: '2026-10-12T18:00:00', receiptNumber: 'VL-RCPT-0006' },
      { id: 'pay-3', invoiceId: 'i-13', amount: 60000, method: 'upi', status: 'verified', paidOn: '2026-10-18', reference: 'UPI 6213 0091 4471', submittedBy: 'u-neha', createdAt: '2026-10-18T11:00:00', verifiedAt: '2026-10-18T13:00:00', receiptNumber: 'VL-RCPT-0007' },
      { id: 'pay-4', invoiceId: 'i-14', amount: 25000, method: 'upi', status: 'pending', paidOn: '2026-11-04', reference: 'UPI 6231 8840 1209', proofName: 'upi-screenshot.jpg', note: 'First part of the frontend invoice.', submittedBy: 'u-raj', createdAt: '2026-11-04T19:20:00' },
      { id: 'pay-5', invoiceId: 'i-13', amount: 20000, method: 'cash', status: 'pending', paidOn: '2026-11-03', reference: 'Handed to Gaurav at clinic visit', submittedBy: 'u-neha', createdAt: '2026-11-03T16:00:00' },
      { id: 'pay-6', invoiceId: 'i-13', amount: 5000, method: 'upi', status: 'rejected', paidOn: '2026-10-25', reference: 'UPI 0000', submittedBy: 'u-neha', createdAt: '2026-10-25T10:00:00', rejectionReason: 'No matching transaction found in the bank statement.' },
    ],
    expenses: [
      { id: 'e-1', category: 'Hosting', description: 'Cloud hosting: November', amount: 4200, date: '2026-11-01', status: 'approved' },
      { id: 'e-2', category: 'Software', description: 'Design tool seats (3)', amount: 6900, date: '2026-11-02', status: 'approved' },
      { id: 'e-3', category: 'Travel', description: 'Client visit to Nashik', amount: 2350, date: '2026-11-03', projectId: 'p-clinic', status: 'pending' },
      { id: 'e-4', category: 'Domain', description: 'Domain renewal for client staging', amount: 899, date: '2026-10-28', projectId: 'p-realty', status: 'approved' },
    ],
    tickets: [
      {
        id: 'tk-1', number: 'VL-T00012', clientId: 'c-mehta', projectId: 'p-realty', raisedBy: 'u-raj', assignedTo: 'u-rohan', subject: 'Update phone number on homepage', priority: 'medium', status: 'in_progress', createdAt: '2026-11-04T12:00:00',
        description: 'Our sales number changed. Please use +91 90000 00099 on the homepage and contact page.',
        messages: [
          { id: 'tm-1', authorId: 'u-raj', body: 'Our sales number changed. Please use +91 90000 00099 on the homepage and contact page.', createdAt: '2026-11-04T12:00:00' },
          { id: 'tm-2', authorId: 'u-rohan', body: 'Noted. It will be in the next preview build today.', createdAt: '2026-11-04T13:10:00' },
          { id: 'tm-3', authorId: 'u-admin', body: 'Also update the footer.', createdAt: '2026-11-04T13:30:00', internal: true },
        ],
      },
      {
        id: 'tk-2', number: 'VL-T00011', clientId: 'c-arogya', projectId: 'p-clinic', raisedBy: 'u-neha', subject: 'Can we add Marathi language?', priority: 'low', status: 'open', createdAt: '2026-11-02T09:00:00',
        description: 'Many of our patients prefer Marathi. Can the app support it?',
        messages: [{ id: 'tm-4', authorId: 'u-neha', body: 'Many of our patients prefer Marathi. Can the app support it?', createdAt: '2026-11-02T09:00:00' }],
      },
      {
        id: 'tk-3', number: 'VL-T00008', clientId: 'c-mehta', projectId: 'p-brand', raisedBy: 'u-raj', assignedTo: 'u-admin', subject: 'Contact form emails going to spam', priority: 'high', status: 'resolved', createdAt: '2026-05-20T10:00:00',
        description: 'Enquiries from the brand site land in spam.',
        messages: [
          { id: 'tm-5', authorId: 'u-raj', body: 'Enquiries from the brand site land in spam.', createdAt: '2026-05-20T10:00:00' },
          { id: 'tm-6', authorId: 'u-admin', body: 'Fixed: added SPF and DKIM records for your domain.', createdAt: '2026-05-20T16:00:00' },
        ],
      },
    ],
    notifications: [
      { id: 'n-1', userId: 'u-admin', kind: 'billing', title: 'Payment submitted', body: 'Mehta Realty submitted ₹25,000 by UPI for VL-INV-2026-0014.', createdAt: '2026-11-04T19:21:00', read: false, href: '/payment/pay-4' },
      { id: 'n-2', userId: 'u-admin', kind: 'task', title: 'Work submitted for review', body: 'Rohan submitted "Enquiry form + WhatsApp hand-off".', createdAt: '2026-11-05T10:05:00', read: false, href: '/task/t-r3d' },
      { id: 'n-3', userId: 'u-admin', kind: 'task', title: 'Blocker reported', body: 'Aditya: waiting for clinic logo files.', createdAt: '2026-11-05T08:30:00', read: false, href: '/task/t-c2b' },
      { id: 'n-4', userId: 'u-admin', kind: 'project', title: 'Update awaiting approval', body: 'Rohan drafted "Property filters in progress" for Mehta Realty.', createdAt: '2026-11-05T11:00:00', read: false, href: '/project/p-realty?tab=updates' },
      { id: 'n-5', userId: 'u-admin', kind: 'support', title: 'New ticket', body: 'Arogya Clinics: Can we add Marathi language?', createdAt: '2026-11-02T09:00:00', read: true, href: '/ticket/tk-2' },
      { id: 'n-6', userId: 'u-rohan', kind: 'task', title: 'Changes requested', body: 'Homepage build: tighten mobile nav spacing, sticky enquiry button.', createdAt: '2026-11-05T09:10:00', read: false, href: '/task/t-r3a' },
      { id: 'n-7', userId: 'u-rohan', kind: 'team', title: 'New message in Real estate website', body: 'Gaurav: Client wants the enquiry button sticky on mobile.', createdAt: '2026-11-05T11:05:00', read: false, href: '/thread/p-realty' },
      { id: 'n-8', userId: 'u-rohan', kind: 'task', title: 'Task assigned', body: 'Patient app screens · Clinic booking app', createdAt: '2026-11-01T10:00:00', read: true, href: '/task/t-c3b' },
      { id: 'n-9', userId: 'u-raj', kind: 'project', title: 'New update on your project', body: 'Homepage is ready for your review.', createdAt: '2026-11-05T09:40:00', read: false, href: '/updates' },
      { id: 'n-10', userId: 'u-raj', kind: 'billing', title: 'Invoice issued', body: 'VL-INV-2026-0014 · ₹75,000 due 15 Nov.', createdAt: '2026-11-01T10:00:00', read: true, href: '/invoice/i-14' },
      { id: 'n-11', userId: 'u-raj', kind: 'support', title: 'Ticket reply', body: 'Noted. It will be in the next preview build today.', createdAt: '2026-11-04T13:10:00', read: true, href: '/ticket/tk-1' },
    ],
    announcements: [
      { id: 'a-1', title: 'Diwali holidays', body: 'The studio is closed 8–10 November. Support replies resume on 11 November.', audience: 'all', publishedAt: '2026-11-01T10:00:00', authorId: 'u-admin' },
      { id: 'a-2', title: 'Friday demo day', body: 'Every Friday at 5 PM: share what you shipped this week, two minutes each.', audience: 'team', publishedAt: '2026-10-28T10:00:00', authorId: 'u-admin' },
    ],
  };
}
