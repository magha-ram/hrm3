import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { FAQItem } from '@/config/help-center';

interface FAQAccordionProps {
  faqs: FAQItem[];
  searchQuery?: string;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-primary/20 text-foreground rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function FAQAccordion({ faqs, searchQuery = '' }: FAQAccordionProps) {
  if (faqs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No FAQs found matching your search.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger className="text-left hover:no-underline">
            <div className="flex items-start gap-2 pr-4">
              <span>{highlightText(faq.question, searchQuery)}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p className="text-muted-foreground">
                {highlightText(faq.answer, searchQuery)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {faq.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
