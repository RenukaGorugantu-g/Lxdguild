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
          <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 rounded-lg text-xs font-bold border border-brand-100 dark:border-brand-900/30">
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
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
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
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-60 overflow-y-auto">
              {filteredSkills.map(skill => (
                <button
                  key={skill}
                  onClick={() => {
                    onAddSkill(skill);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors border-b last:border-0 border-zinc-100 dark:border-zinc-800"
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
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-bold text-brand-600 transition-colors"
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
