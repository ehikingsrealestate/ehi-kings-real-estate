// Curated company automations, adapted for Ehi-Kings from the n8n template
// libraries (github.com/Zie619/n8n-workflows + github.com/enescingoz/awesome-n8n-templates)
// and real-estate best practice. Each is documented so staff understand what it
// does before launching it in n8n.
//
// The "steps" render as a left-to-right flow diagram on the Automations page.

export type AutomationStep = {
  label: string;
  detail: string;
  kind: 'trigger' | 'action' | 'decision' | 'output';
};

export type Automation = {
  id: string;
  name: string;
  category: 'Sales' | 'Marketing' | 'Operations' | 'Finance' | 'Retention';
  tagline: string;
  impact: string; // why it matters, in plain terms
  trigger: string;
  connects: string[]; // company systems it touches
  steps: AutomationStep[];
  howTo: string[];
  source?: string; // template library reference
  recommended?: boolean;
};

export const AUTOMATIONS: Automation[] = [
  {
    id: 'instant-lead-response',
    name: 'Instant lead response',
    category: 'Sales',
    tagline: 'Reply to every website enquiry within seconds — automatically.',
    impact:
      'Leads contacted within 5 minutes are up to 9× more likely to convert. This makes sure no enquiry ever waits, even at 2am.',
    trigger: 'New lead from the website form, booking page, or live chat',
    connects: ['Website / CRM', 'WhatsApp', 'Zoho Mail', 'Assigned agent'],
    steps: [
      { kind: 'trigger', label: 'New lead', detail: 'Convex CRM fires a webhook the moment a lead is captured.' },
      { kind: 'action', label: 'WhatsApp ack', detail: 'Send the buyer an instant WhatsApp acknowledging their enquiry.' },
      { kind: 'action', label: 'Email + agent', detail: 'Send a branded email and alert the assigned agent.' },
      { kind: 'output', label: 'Logged', detail: 'Stamp "first response sent" back onto the CRM lead.' },
    ],
    howTo: [
      'Point the CRM lead webhook at your n8n "instant-lead-response" workflow.',
      'Connect a WhatsApp Business (or Twilio) node and your Zoho Mail credentials.',
      'Edit the message templates, then activate the workflow.',
    ],
    source: 'awesome-n8n-templates: Lead capture & routing',
    recommended: true,
  },
  {
    id: 'lead-nurture-drip',
    name: 'Lead nurture drip',
    category: 'Sales',
    tagline: 'A gentle multi-day follow-up sequence that keeps warm leads warm.',
    impact:
      'Most buyers need several touches before they inspect. This runs the follow-ups for you so agents focus on hot leads.',
    trigger: 'Lead created and not yet marked "contacted"',
    connects: ['CRM', 'WhatsApp', 'Zoho Mail'],
    steps: [
      { kind: 'trigger', label: 'New lead', detail: 'Starts the drip when a lead enters the pipeline.' },
      { kind: 'action', label: 'Day 1', detail: 'Send the estate brochure + a booking link.' },
      { kind: 'decision', label: 'Replied?', detail: 'If the lead replies or books, the drip stops.' },
      { kind: 'action', label: 'Day 3 / Day 7', detail: 'Send value nudges (payment plans, site photos).' },
      { kind: 'output', label: 'Handoff', detail: 'Escalate engaged leads to an agent.' },
    ],
    howTo: [
      'Set the schedule offsets (Day 1/3/7) and edit each message.',
      'Add the "replied?" check against the CRM so the drip stops on engagement.',
      'Activate — new leads are enrolled automatically.',
    ],
    source: 'Zie619/n8n-workflows: scheduled email sequences',
    recommended: true,
  },
  {
    id: 'inspection-reminders',
    name: 'Inspection reminders',
    category: 'Operations',
    tagline: 'Cut no-shows with automatic 24-hour and 1-hour reminders.',
    impact: 'Site inspections are where deals happen. Reminders dramatically reduce missed appointments.',
    trigger: 'An inspection is booked (Tue/Thu/Sat 10am slots)',
    connects: ['Bookings / CRM', 'WhatsApp', 'SMS', 'Zoho Mail'],
    steps: [
      { kind: 'trigger', label: 'Booking', detail: 'A new inspection booking is created.' },
      { kind: 'action', label: 'Confirm', detail: 'Immediate confirmation with the address + map pin.' },
      { kind: 'action', label: '24h before', detail: 'Reminder with directions and the agent’s contact.' },
      { kind: 'action', label: '1h before', detail: 'Final nudge so the client sets off on time.' },
    ],
    howTo: [
      'Connect the bookings webhook and a WhatsApp/SMS node.',
      'Fill in the estate address + Google Maps link merge fields.',
      'Activate — every booking now gets the reminder chain.',
    ],
    source: 'awesome-n8n-templates: reminders & scheduling',
    recommended: true,
  },
  {
    id: 'payment-onboarding',
    name: 'Payment → onboarding',
    category: 'Finance',
    tagline: 'Turn a Paystack payment into a receipt, allocation steps, and a CRM update.',
    impact: 'Buyers get an instant, professional confirmation and clear next steps — no manual paperwork chase.',
    trigger: 'Paystack payment success webhook',
    connects: ['Paystack', 'CRM', 'Zoho Mail', 'Management'],
    steps: [
      { kind: 'trigger', label: 'Payment', detail: 'Paystack confirms a successful payment.' },
      { kind: 'action', label: 'Receipt', detail: 'Email a branded receipt with the reference.' },
      { kind: 'action', label: 'Next steps', detail: 'Send allocation + documentation checklist.' },
      { kind: 'output', label: 'CRM + MD', detail: 'Advance the deal stage and notify management.' },
    ],
    howTo: [
      'Add your Paystack webhook secret to the trigger node.',
      'Customise the receipt + checklist templates.',
      'Activate — payments now onboard buyers automatically.',
    ],
    source: 'awesome-n8n-templates: payments & receipts',
    recommended: true,
  },
  {
    id: 'new-listing-social',
    name: 'New listing → social blast',
    category: 'Marketing',
    tagline: 'Publish a listing once; it posts to every social channel.',
    impact: 'Keeps the brand active and puts fresh inventory in front of buyers with zero extra effort.',
    trigger: 'A listing is published or featured in the admin',
    connects: ['Listings', 'Instagram', 'Facebook', 'X', 'Social planner'],
    steps: [
      { kind: 'trigger', label: 'Listing live', detail: 'A property is published or marked featured.' },
      { kind: 'action', label: 'Compose', detail: 'Build a caption with price, location, and photo.' },
      { kind: 'action', label: 'Post', detail: 'Publish to the connected social accounts.' },
      { kind: 'output', label: 'Track', detail: 'Log the post back into the Social planner.' },
    ],
    howTo: [
      'Connect Instagram/Facebook (Meta) or your posting API in n8n.',
      'Edit the caption template and hashtags.',
      'Activate — new listings auto-broadcast.',
    ],
    source: 'awesome-n8n-templates: social media publishing',
  },
  {
    id: 'weekly-digest',
    name: 'Weekly portfolio digest',
    category: 'Marketing',
    tagline: 'Email subscribers the newest land, homes, and offers every week.',
    impact: 'Stays top-of-mind with your audience and recirculates inventory to warm contacts.',
    trigger: 'Every Friday morning (schedule)',
    connects: ['Listings', 'CRM opt-ins', 'Zoho Mail'],
    steps: [
      { kind: 'trigger', label: 'Weekly', detail: 'Runs on a schedule (e.g. Fri 9am).' },
      { kind: 'action', label: 'Collect', detail: 'Pull new/updated listings and current offers.' },
      { kind: 'action', label: 'Build email', detail: 'Render a clean digest with images + prices.' },
      { kind: 'output', label: 'Send', detail: 'Deliver to consenting subscribers.' },
    ],
    howTo: [
      'Set the send day/time and the subscriber source (CRM opt-ins).',
      'Choose how many listings to feature.',
      'Activate — the digest sends itself each week.',
    ],
    source: 'Zie619/n8n-workflows: scheduled digests',
  },
  {
    id: 'review-request',
    name: 'Post-close review request',
    category: 'Retention',
    tagline: 'Ask happy buyers for a testimonial or Google review at the right moment.',
    impact: 'Reviews are the strongest trust signal for new buyers — this collects them consistently.',
    trigger: 'A deal is marked "won" / handover complete',
    connects: ['CRM', 'WhatsApp', 'Zoho Mail', 'Google reviews'],
    steps: [
      { kind: 'trigger', label: 'Deal won', detail: 'A pipeline deal moves to won / handover.' },
      { kind: 'action', label: 'Wait', detail: 'Pause a few days so the client has settled in.' },
      { kind: 'action', label: 'Ask', detail: 'Send a warm review request with a direct link.' },
      { kind: 'output', label: 'Log', detail: 'Record whether a review was left.' },
    ],
    howTo: [
      'Add your Google review link and message template.',
      'Set the wait delay after handover.',
      'Activate — reviews get requested automatically.',
    ],
    source: 'awesome-n8n-templates: reputation & reviews',
  },
  {
    id: 'management-daily-brief',
    name: 'Daily management brief',
    category: 'Operations',
    tagline: 'A morning summary of new leads, bookings, and pipeline movement to the MD.',
    impact: 'Gives leadership a one-glance pulse of the business without opening a dashboard.',
    trigger: 'Every morning (schedule)',
    connects: ['CRM', 'Bookings', 'Zoho Mail', 'WhatsApp'],
    steps: [
      { kind: 'trigger', label: 'Daily 8am', detail: 'Runs on a schedule each morning.' },
      { kind: 'action', label: 'Gather', detail: 'Count new leads, bookings, and pipeline changes.' },
      { kind: 'action', label: 'Summarise', detail: 'Format a concise brief (optionally AI-written).' },
      { kind: 'output', label: 'Deliver', detail: 'Email / WhatsApp the brief to management.' },
    ],
    howTo: [
      'Point the workflow at the CRM/bookings data source.',
      'Set the send time and recipients.',
      'Activate — the brief lands every morning.',
    ],
    source: 'Zie619/n8n-workflows: reporting & digests',
  },
];

export const AUTOMATION_CATEGORIES = ['Sales', 'Marketing', 'Operations', 'Finance', 'Retention'] as const;
