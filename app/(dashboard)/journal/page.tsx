import { getJournal, getJournalHistory } from "@/app/actions/journal";
import { JournalHero } from "@/components/journal/journal-hero";
import { JournalEditor } from "@/components/journal/journal-editor";
import { JournalInsights } from "@/components/journal/journal-insights";
import { JournalTimeline } from "@/components/journal/journal-timeline";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "AI Journal - Hamun",
};

export default async function JournalPage() {
  const today = new Date();
  const currentJournal = await getJournal(today);
  const history = await getJournalHistory();

  return (
    <div className="flex flex-col h-full bg-background md:pl-64">
      {/* Header */}
      <div className="flex items-center justify-between p-6 sm:p-8 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Journal</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-12 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="xl:col-span-2 space-y-8">
            <JournalHero journal={currentJournal} />
            <JournalEditor journal={currentJournal} />
          </div>

          <div className="space-y-8">
            {currentJournal && <JournalInsights journal={currentJournal} />}
            <JournalTimeline history={history} />
          </div>

        </div>
      </div>
    </div>
  );
}
