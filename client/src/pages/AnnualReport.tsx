import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiFilm, HiBookOpen, HiMusicalNote } from 'react-icons/hi2';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { socialApi } from '@/services/socialApi';

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export default function AnnualReport() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    setError('');
    socialApi.getAnnualStats(parseInt(id || '0'), year).then(setData).catch(() => {
      setError('年度报告加载失败，请稍后重试');
    });
  }, [id, year]);

  if (error) return <div className="min-h-screen pt-24 flex items-center justify-center text-red-300">{error}</div>;
  if (!data) return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-10 h-10 border-2 border-muse-500 border-t-transparent rounded-full animate-spin" /></div>;

  const toMonthly = (arr: any[]) => {
    const m = new Array(12).fill(0);
    arr.forEach((r: any) => m[parseInt(r.month) - 1] = r.count);
    return m;
  };

  const option = {
    tooltip: { trigger: 'axis' as const },
    legend: { textStyle: { color: '#9ca3af' }, top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category' as const, data: months, axisLabel: { color: '#6b7280' }, axisLine: { lineStyle: { color: '#374151' } } },
    yAxis: { type: 'value' as const, axisLabel: { color: '#6b7280' }, splitLine: { lineStyle: { color: '#1f2937' } } },
    series: [
      { name: '观影', type: 'bar', data: toMonthly(data.moviesByMonth), itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] } },
      { name: '阅读', type: 'bar', data: toMonthly(data.booksByMonth), itemStyle: { color: '#06b6d4', borderRadius: [4, 4, 0, 0] } },
      { name: '听歌', type: 'line', data: toMonthly(data.songsByMonth), smooth: true, lineStyle: { color: '#ec4899' }, itemStyle: { color: '#ec4899' }, areaStyle: { color: 'rgba(236,72,153,0.1)' } },
    ],
    backgroundColor: 'transparent',
  };

  const statCards = [
    { label: '看过的电影', value: data.totalMovies, icon: HiFilm, color: 'from-orange-500 to-red-500' },
    { label: '读过的书', value: data.totalBooks, icon: HiBookOpen, color: 'from-cyan-500 to-teal-500' },
    { label: '听过的歌', value: data.totalSongs, icon: HiMusicalNote, color: 'from-pink-500 to-rose-500' },
  ];

  const monthlyMovies = toMonthly(data.moviesByMonth || []);
  const monthlyBooks = toMonthly(data.booksByMonth || []);
  const monthlySongs = toMonthly(data.songsByMonth || []);
  const activeScoreByMonth = monthlyMovies.map((v, idx) => v + monthlyBooks[idx] + monthlySongs[idx]);
  const bestMonthIndex = activeScoreByMonth.reduce((best, score, idx, arr) => score > arr[best] ? idx : best, 0);
  const bestMonthScore = activeScoreByMonth[bestMonthIndex] || 0;
  const totalActivities = data.totalMovies + data.totalBooks + data.totalSongs;
  const hasAnyData = totalActivities > 0;

  return (
    <div className="min-h-screen pt-24 pb-20 max-w-4xl mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white">你的 <span className="gradient-text">{year}</span></h1>
        <p className="text-gray-400 mt-2">年度文化消费报告</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {statCards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
            className="glass rounded-2xl p-6 border border-white/5 text-center">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center mx-auto mb-3`}>
              <c.icon className="w-7 h-7 text-white" />
            </div>
            <p className="text-4xl font-bold text-white">{c.value}</p>
            <p className="text-sm text-gray-400 mt-1">{c.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="glass rounded-2xl p-5 border border-white/5">
          <p className="text-xs text-gray-500">年度活跃月份</p>
          <p className="text-2xl font-bold text-white mt-1">{months[bestMonthIndex] || '-'}</p>
          <p className="text-xs text-gray-400 mt-1">
            活跃值 {bestMonthScore}（影视 + 书籍 + 音乐）
          </p>
        </div>
        <div className="glass rounded-2xl p-5 border border-white/5">
          <p className="text-xs text-gray-500">内容偏好摘要</p>
          <p className="text-sm text-gray-300 mt-2 leading-relaxed">
            {hasAnyData
              ? `今年你更偏向 ${data.totalMovies >= data.totalBooks ? '影视消费' : '阅读消费'}，共完成 ${data.totalMovies} 部影视、${data.totalBooks} 本书，并聆听 ${data.totalSongs} 首歌曲。`
              : '本年度数据较少，继续记录影视、书籍、音乐行为后可生成更完整画像。'}
          </p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6 border border-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">月度趋势</h2>
        <ReactEChartsCore echarts={echarts} option={option} style={{ height: 360 }} theme="dark" />
      </motion.div>

      {!hasAnyData && (
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          当前年度暂无完整行为数据。建议先在影视、书籍和音乐模块完成标记和收藏，再返回查看更准确的年度报告。
        </div>
      )}
    </div>
  );
}
