import { Accordion } from '@ark-ui/react/accordion';
import { Plus } from 'lucide-react';

// FAQ accordion on Ark UI (chakra-ui/ark) — headless state machine, brand
// styling, smooth height animation via Ark's --height custom property.

export interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <Accordion.Root collapsible defaultValue={[items[0]?.q]} className="border-b border-rule">
      {items.map((item) => (
        <Accordion.Item key={item.q} value={item.q} className="border-t border-rule">
          <Accordion.ItemTrigger className="group flex w-full items-center justify-between gap-6 py-5 text-left text-base font-medium text-primary transition-colors hover:text-accent sm:text-lg">
            {item.q}
            <Accordion.ItemIndicator className="shrink-0 text-muted transition-transform duration-300 group-hover:text-accent data-[state=open]:rotate-45">
              <Plus className="h-5 w-5" />
            </Accordion.ItemIndicator>
          </Accordion.ItemTrigger>
          <Accordion.ItemContent className="faq-content overflow-hidden">
            <p className="max-w-2xl pb-6 text-sm leading-7 text-muted sm:text-base">{item.a}</p>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
