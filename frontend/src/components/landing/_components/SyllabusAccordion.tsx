import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

interface SyllabusItem {
  title: string;
  topics: string[];
  time: string;
}

const syllabusData: SyllabusItem[] = [
  {
    title: "Introduction to UX Design",
    topics: ["What is UX?", "History of UX", "UX vs UI", "Importance of UX"],
    time: "1 Hour",
  },
  {
    title: "User Research",
    topics: [
      "Understanding Users",
      "Conducting Surveys",
      "User Personas",
      "Competitor Analysis",
    ],
    time: "1 Hour",
  },
  {
    title: "Prototyping & Wireframing",
    topics: [
      "Low-fidelity Prototypes",
      "Wireframing Basics",
      "Usability Testing",
      "Iterative Design",
    ],
    time: "1 Hour",
  },
  {
    title: "Advanced UX Strategies",
    topics: [
      "A/B Testing",
      "Accessibility in UX",
      "Emotional Design",
      "Future of UX",
    ],
    time: "1 Hour",
  },
];

const SyllabusAccordion: React.FC = () => {
  return (
    <section className="py-6">
      <header className="mb-4">
        <h1 className="text-xl font-bold">Syllabus</h1>
      </header>
      <div className="w-full overflow-x-auto">
        <Accordion
          type="multiple"
          className="max-w-[40rem] min-w-[32rem] rounded-md border p-3 dark:border-blue-300/30"
        >
          {syllabusData.map((syllabus) => (
            <AccordionItem key={syllabus.title} value={syllabus.title}>
              <AccordionTrigger className="hover:no-underline focus:outline-none">
                <div className="flex w-full justify-between px-4">
                  <h3 className="text-base font-bold">{syllabus.title}</h3>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                    <span>{syllabus.topics.length} Lessons</span>
                    <Separator orientation="vertical" />
                    <span>{syllabus.time}</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <ul className="space-y-2">
                  {syllabus.topics.map((topic) => (
                    <li key={topic} className="font-medium">
                      {topic}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default SyllabusAccordion;
