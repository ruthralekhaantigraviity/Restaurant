import clsx from 'clsx';

const StatCard = ({ title, value, icon: Icon, trend, trendUp, colorClass = "bg-green-500" }) => {
    let formattedTrend = null;
    if (trend !== undefined && trend !== null && !isNaN(trend)) {
        const absVal = Math.abs(Number(trend));
        formattedTrend = absVal > 999 ? '>999%' : `${absVal.toFixed(1)}%`;
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium">{title}</p>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-slate-100 mt-2">{value}</h3>
                </div>
                <div className={clsx("p-3 rounded-xl text-white shadow-sm shrink-0", colorClass)}>
                    <Icon size={24} />
                </div>
            </div>

            {formattedTrend && (
                <div className="mt-4 flex items-center gap-2 flex-nowrap">
                    <span className={clsx(
                        "text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 whitespace-nowrap",
                        trendUp
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60"
                    )}>
                        <span>{trendUp ? '↑' : '↓'}</span>
                        <span>{formattedTrend}</span>
                    </span>
                    <span className="text-gray-400 dark:text-slate-500 text-[10px] sm:text-[11px] font-medium whitespace-nowrap shrink-0">vs last month</span>
                </div>
            )}
        </div>
    );
};

export default StatCard;
