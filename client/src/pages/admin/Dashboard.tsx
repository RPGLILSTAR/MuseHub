import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiUsers, HiChatBubbleLeftRight, HiFilm, HiBookOpen, HiMusicalNote, HiExclamationTriangle } from 'react-icons/hi2';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { adminApi } from '@/services/adminApi';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-muse-500 border-t-transparent rounded-full animate-spin" /></div>;

  const { overview, charts } = data;
  const cards = [
    { label: '总用户', value: overview.totalUsers, icon: HiUsers, color: 'from-blue-500 to-cyan-500', today: overview.todayUsers },
    { label: '总评论', value: overview.totalReviews, icon: HiChatBubbleLeftRight, color: 'from-muse-500 to-pink-500', today: overview.todayReviews },
    { label: '影视标记', value: overview.totalMovieMarks, icon: HiFilm, color: 'from-orange-500 to-red-500' },
    { label: '书籍标记', value: overview.totalBookMarks, icon: HiBookOpen, color: 'from-emerald-500 to-teal-500' },
    { label: '音乐喜欢', value: overview.totalMusicLikes, icon: HiMusicalNote, color: 'from-violet-500 to-purple-500' },
    { label: '待审核', value: overview.pendingReviews, icon: HiExclamationTriangle, color: 'from-yellow-500 to-amber-500' },
  ];

  const growthOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { textStyle: { color: '#9ca3af' }, top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category' as const, data: charts.userGrowth.map((d: any) => d.date.slice(5)), axisLabel: { color: '#6b7280' }, axisLine: { lineStyle: { color: '#374151' } } },
    yAxis: { type: 'value' as const, axisLabel: { color: '#6b7280' }, splitLine: { lineStyle: { color: '#1f2937' } } },
    series: [
      { name: '新增用户', type: 'line', data: charts.userGrowth.map((d: any) => d.count), smooth: true, lineStyle: { color: '#8b5cf6' }, itemStyle: { color: '#8b5cf6' }, areaStyle: { color: 'rgba(139,92,246,0.1)' } },
      { name: '新增评论', type: 'line', data: charts.reviewGrowth.map((d: any) => d.count), smooth: true, lineStyle: { color: '#ec4899' }, itemStyle: { color: '#ec4899' }, areaStyle: { color: 'rgba(236,72,153,0.1)' } },
      { name: '活跃用户', type: 'line', data: charts.activeUsers.map((d: any) => d.count), smooth: true, lineStyle: { color: '#06b6d4' }, itemStyle: { color: '#06b6d4' }, areaStyle: { color: 'rgba(6,182,212,0.1)' } },
    ],
    backgroundColor: 'transparent',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">仪表盘</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{c.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{c.value}</p>
                {c.today != null && <p className="text-xs text-gray-500 mt-1">今日 +{c.today}</p>}
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                <c.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 border border-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">30天增长趋势</h2>
        <ReactEChartsCore echarts={echarts} option={growthOption} style={{ height: 320 }} theme="dark" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6 border border-white/5 mt-6">
        <h2 className="text-lg font-semibold text-white mb-4">答辩演示检查清单</h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            `用户规模：${overview.totalUsers}（今日新增 ${overview.todayUsers}）`,
            `内容活跃：影视 ${overview.totalMovieMarks} / 书籍 ${overview.totalBookMarks}`,
            `社区互动：评论 ${overview.totalReviews}（待审核 ${overview.pendingReviews}）`,
            `音乐行为：喜欢 ${overview.totalMusicLikes}`,
          ].map((line) => (
            <div key={line} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-gray-300">
              {line}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4">
          建议演示顺序：仪表盘总览 → 推荐引擎面板（评估与调权）→ 前台推荐页与个人画像。
        </p>
      </motion.div>
    </div>
  );
}
