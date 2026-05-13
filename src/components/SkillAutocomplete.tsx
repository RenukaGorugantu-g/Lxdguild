"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Search, X, Plus } from "lucide-react";

const ID_SKILLS = [
  "ADDIE Model", "Articulate Storyline 360", "Adobe Captivate", "Adult Learning Theory",
  "Learning Management Systems (LMS)", "SCORM/xAPI", "Instructional Design",
  "Curriculum Development", "Microlearning", "Scenario-Based Learning",
  "Social Learning", "Blended Learning", "Video Editing (Camtasia/Premiere)",
  "Graphic Design (Photoshop/Canva)", "VUI/UX Design", "Accessibility (WCAG 2.1)",
  "Kirkpatrick Evaluation", "SAM Model", "Design Thinking", "Project Management",
  "Corporate Communications", "Knowledge Management", "L&D Strategy"
];

export default function SkillAutocomplete({ 
  selectedSkills, 
  onAddSkill, 
  onRemoveSkill 
}: { 
  selectedSkills: string[], 
  onAddSkill: (skill: string) => void,
  onRemoveSkill: (skill: string) => void
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredSkills = ID_SKILLS.filter(skill => 
    skill.toLowerCase().includes(query.toLowerCase()) && 
    !selectedSkills.includes(skill)
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4" ref={wrapperRef}>
      <div className="flex flex-wrap gap-2">
        {selectedSkills.map(skill => (
          <span key={skill} className="inline-flex items-center gap-1 rounded-lg border border-[#d9e8d1] bg-[#eef8e7] px-3 py-1 text-xs font-bold text-[#138d1a]">
            {skill}
            <button onClick={() => onRemoveSkill(skill)} className="hover:text-red-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            className="w-full rounded-xl border border-[#dbe4d5] bg-white py-2.5 pl-10 pr-4 outline-none transition-all focus:ring-2 focus:ring-[#8fd97e]"
            placeholder="Search skills (e.g., Articulate Storyline)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </div>

        {isOpen && (query.length > 0 || filteredSkills.length > 0) && (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#dbe4d5] bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-60 overflow-y-auto">
              {filteredSkills.map(skill => (
                <button
                  key={skill}
                  onClick={() => {
                    onAddSkill(skill);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between border-b border-zinc-100 px-4 py-3 text-sm font-medium transition-colors last:border-0 hover:bg-zinc-50"
                >
                  {skill}
                  <Plus className="w-4 h-4 text-zinc-300" />
                </button>
              ))}
              {query.length > 0 && !ID_SKILLS.includes(query) && !selectedSkills.includes(query) && (
                <button
                  onClick={() => {
                    onAddSkill(query);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-[#138d1a] transition-colors hover:bg-zinc-50"
                >
                  <Plus className="w-4 h-4" /> Add "{query}"
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
