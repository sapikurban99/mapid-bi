import sys

with open('app/b2c-campaigns/page.tsx', 'r') as f:
    lines = f.readlines()

insertion_index = -1
for i, line in enumerate(lines):
    if '<EditModal isOpen={!!editModal}' in line:
        insertion_index = i
        break

if insertion_index != -1:
    content = """
        {/* BUDGET DISBURSEMENT SECTION */}
        <div className="pt-12 mt-12 border-t border-zinc-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black tracking-tight leading-tight">Budget Disbursement<br /><span className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Operational Spending Overview</span></h3>
            <div className="flex gap-2">
              <button onClick={() => {
                const newBudget = prompt('Enter new total budget (Rp):', config.b2cTotalBudget?.toString() || '100000000');
                if (newBudget && !isNaN(Number(newBudget))) {
                  const newConfig = { ...config, b2cTotalBudget: Number(newBudget) };
                  setConfigState(newConfig);
                  setConfigLS(newConfig);
                  saveConfigToSupabase(newConfig);
                }
              }} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition">
                <Edit2 size={12} /> Set Limit
              </button>
              <button onClick={() => openEditModal('budget')} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg">
                <Plus size={12} /> Add Spent
              </button>
            </div>
          </div>
          {(() => {
            const budgetData = config.biData?.budget || [];
            const totalSpent = budgetData.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
            const maxBudget = config.b2cTotalBudget || 100000000;
            const spentByCategory = budgetData.reduce((acc: any, item: any) => {
              const cat = item.category || 'Other';
              acc[cat] = (acc[cat] || 0) + (Number(item.amount) || 0);
              return acc;
            }, {});

            const sortedCategories = Object.entries(spentByCategory).sort((a: any, b: any) => b[1] - a[1]);
            const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
            const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

            return (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Total Budget Spent</h4>
                    <div className="text-2xl font-black tracking-tighter text-emerald-400">{formatIDR(totalSpent)}</div>
                    <div className="text-[10px] font-bold text-zinc-400 mt-3 border-t border-white/10 pt-3 flex justify-between">
                      <span>LIMIT:</span> <span className="text-white">{formatIDR(maxBudget)}</span>
                    </div>
                  </div>
                  {sortedCategories.slice(0, 3).map(([cat, amount]: any, idx) => (
                    <div key={cat} className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm transition hover:border-zinc-300">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{cat}</h4>
                      <div className="text-xl font-black tracking-tighter text-zinc-900">{formatIDR(amount)}</div>
                      <div className="text-[10px] font-bold text-zinc-400 mt-1 text-right">{totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0}% of Total</div>
                    </div>
                  ))}
                </div>

                {/* Disbursement History Table */}
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-50 text-[10px] text-zinc-500 border-b border-zinc-200 uppercase font-black tracking-widest">
                        <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Category</th><th className="px-6 py-4 min-w-[200px]">Description</th><th className="px-6 py-4 text-right">Amount (IDR)</th><th className="px-4 py-4 w-16"></th></tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {budgetData.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 font-bold text-xs uppercase tracking-widest">No spending recorded</td></tr>
                        ) : (
                          budgetData.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime() || 0).map((row: any, idx: number) => {
                            const origIdx = budgetData.indexOf(row);
                            return (
                              <tr key={idx} className="hover:bg-zinc-50 transition group">
                                <td className="px-6 py-5 font-bold whitespace-nowrap">{formatDate(row.date)}</td>
                                <td className="px-6 py-5"><span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-1 rounded inline-block whitespace-nowrap">{row.category}</span></td>
                                <td className="px-6 py-5 text-zinc-500 font-medium italic">{row.description || '-'}</td>
                                <td className="px-6 py-5 text-right font-mono font-bold text-zinc-900">{formatIDR(row.amount)}</td>
                                <td className="px-4 py-5">
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => openEditModal('budget', origIdx)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={12} /></button>
                                    <button onClick={() => handleDeleteItem('budget', origIdx)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={12} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
"""
    lines.insert(insertion_index, content)
    with open('app/b2c-campaigns/page.tsx', 'w') as f:
        f.writelines(lines)
    print("Successfully inserted budget UI.")
else:
    print("Could not find insertion point!")

