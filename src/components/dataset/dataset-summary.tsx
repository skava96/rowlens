const metrics = [
    { label: 'Rows Processed', value: '12,006 rows' },
    { label: 'Columns Detected', value: '24 columns' },
    { label: 'Missing Values', value: '5 missing values' },
    { label: 'Duplicate Rows', value: '2 duplicates' },
    { label: 'Validation Score', value: '92% validation score' },
];

export default function DatasetSummary() {
    return (
        <section className="w-full rounded-xl border border-border/80 bg-card p-4 sm:p-6">
            <h2 className="text-lg font-medium mb-4">Dataset Metrics</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {metrics.map((metric) => (
                    <div
                        key={metric.label}
                        className="bg-gray-100 border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                        <p className="text-gray-500 text-xs mb-2">{metric.label}</p>
                        <p className="text-gray-900 text-sm font-medium">{metric.value}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
