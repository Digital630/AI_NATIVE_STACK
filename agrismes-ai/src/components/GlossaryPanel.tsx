/**
 * GlossaryPanel Component
 * Full glossary search and browse interface
 * Part of Epistemic Clarity initiative
 */

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BookOpen, Search } from "lucide-react";
import { GLOSSARY } from "./GlossaryTerm";

// Categorize terms for easier browsing
const CATEGORIES: Record<string, string[]> = {
  "Quality & Grading": ["moisture content", "grade", "defect count", "screen size"],
  "Trade Terms (Incoterms)": ["fob", "cif", "incoterms", "exw"],
  "Processing": ["rcn", "wfk", "wet processing", "dry processing"],
  "Quantities & Logistics": ["mt", "fcl", "lcl"],
  "Quality Standards": ["phytosanitary", "fumigation", "traceability"],
  "Financial": ["lc", "advance payment", "cad"],
  "Market & Pricing": ["spot price", "futures", "premium", "differential"],
};

interface GlossaryPanelProps {
  trigger?: React.ReactNode;
}

export function GlossaryPanel({ trigger }: GlossaryPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTerms = useMemo(() => {
    let terms = Object.entries(GLOSSARY);

    // Filter by search
    if (search) {
      const query = search.toLowerCase();
      terms = terms.filter(([term, entry]) => 
        term.includes(query) || 
        entry.definition.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      const categoryTerms = CATEGORIES[selectedCategory] || [];
      terms = terms.filter(([term]) => categoryTerms.includes(term));
    }

    return terms.sort((a, b) => a[0].localeCompare(b[0]));
  }, [search, selectedCategory]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Glossary
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg bg-card">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Agricultural Trade Glossary
          </SheetTitle>
          <SheetDescription>
            Simple explanations for common terms. Click any term to learn more.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search terms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {Object.keys(CATEGORIES).map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setSelectedCategory(
                  selectedCategory === category ? null : category
                )}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Terms list */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-4 pr-4">
              {filteredTerms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No terms found. Try a different search.
                </p>
              ) : (
                filteredTerms.map(([term, entry]) => (
                  <div 
                    key={term}
                    className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <h4 className="font-semibold text-sm capitalize text-foreground mb-2">
                      {term}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {entry.definition}
                    </p>
                    {entry.example && (
                      <p className="text-xs text-primary/80 italic mt-2 border-l-2 border-primary/30 pl-2">
                        {entry.example}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              {Object.keys(GLOSSARY).length} terms available • Updated regularly
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
