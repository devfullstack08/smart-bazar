'use client';

import { useState } from 'react';
import { MARKETING_FAQS } from '@/constants/faq';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
      {MARKETING_FAQS.map((faq, index) => (
        <div
          key={faq.question}
          className={`rounded-xl md:rounded-2xl border transition-all bg-[var(--surface-elevated)] ${
            openIndex === index ? 'border-[var(--pw-primary)]/50' : 'border-[var(--border)]'
          }`}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-4 md:p-6 text-left min-h-[44px]"
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <HelpCircle
                className={`w-4 h-4 md:w-5 md:h-5 shrink-0 ${openIndex === index ? 'text-[var(--pw-primary)]' : 'text-[var(--muted-foreground)]'}`}
              />
              <span
                className={`text-sm md:text-base font-medium ${openIndex === index ? 'text-[var(--pw-primary)]' : 'text-[var(--foreground)]'}`}
              >
                {faq.question}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 md:w-5 md:h-5 shrink-0 transition-transform ${openIndex === index ? 'rotate-180 text-[var(--pw-primary)]' : 'text-[var(--muted-foreground)]'}`}
            />
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 md:px-6 md:pb-6 pt-0">
              <p className="text-sm md:text-base text-[var(--muted-foreground)] pl-6 md:pl-8 leading-relaxed">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
