import SuggestionPanel from "@/components/ai/suggestion-panel";
import { AISuggestion } from "@/types/dataset";

type Props = {
    suggestions: AISuggestion[];
    hasDataset: boolean;
    onReviewSuggestion: (id: string) => void;
    onApproveSuggestion: (id: string) => void;
    onRejectSuggestion: (id: string) => void;
    onClearReview: () => void;
};

export default function DatasetReviewSection({
    suggestions,
    hasDataset,
    onReviewSuggestion,
    onApproveSuggestion,
    onRejectSuggestion,
    onClearReview,
}: Props) {
    return (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <SuggestionPanel
                suggestions={suggestions}
                hasDataset={hasDataset}
                onReviewSuggestion={onReviewSuggestion}
                onApproveSuggestion={onApproveSuggestion}
                onRejectSuggestion={onRejectSuggestion}
                onClearReview={onClearReview}
            />
        </section>
    );
}