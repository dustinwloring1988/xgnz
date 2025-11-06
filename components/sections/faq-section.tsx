"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollReveal } from "@/components/scroll-reveal"

export function FaqSection() {
  const faqs = [
    {
      question: "What is XGNZ Chat?",
      answer:
        "XGNZ Chat is a modern real‑time messaging app for teams and communities. It offers channels, threads, file sharing, advanced search, and strong privacy controls.",
    },
    {
      question: "How do I get started?",
      answer:
        "Click Get Started to launch the chat experience. You can create channels, invite teammates, and start messaging in seconds.",
    },
    {
      question: "Is my data secure?",
      answer:
        "We take security seriously with role‑based permissions and industry‑standard best practices. Enterprise options include SSO and retention controls.",
    },
    {
      question: "Does it support rich media?",
      answer:
        "Yes. Share images, files, and code blocks. React to messages and keep discussions organized with threads.",
    },
    {
      question: "Do you offer support?",
      answer:
        "Starter includes basic support. Pro and Enterprise offer priority support, onboarding, and dedicated assistance.",
    },
  ]

  return (
    <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
      <div className="container px-4 md:px-6">
        <ScrollReveal>
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-heading font-bold tracking-tighter sm:text-5xl">
                Frequently Asked Questions
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 opacity-70">
                Find answers to common questions about using XGNZ Chat.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="mx-auto max-w-3xl py-12">
          <ScrollReveal>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="glassmorphic-accordion-item">
                  <AccordionTrigger className="text-left font-medium tracking-tight">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground opacity-70">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
