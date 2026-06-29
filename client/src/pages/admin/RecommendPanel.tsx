import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiCpuChip, HiChartBar, HiAdjustmentsHorizontal, HiArrowPath, HiBeaker, HiCircleStack, HiTrash } from 'react-icons/hi2';
import ReactECharts from 'echarts-for-react';
import { recommendApi } from '@/services/recommendApi';
import toast from 'react-hot-toast';

export default function RecommendPanel() {
  const [stats, setStats] = useState<any>(null);
  const [evalMovie, setEvalMovie] = useState<any>(null);
  const [evalBook, setEvalBook] = useState<any>(null);
  const [weights, setWeights] = useState({ userCF: 0.4, itemCF: 0.35, content: 0.25 });
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await recommendApi.getAdminStats();
      setStats(data);
      if (data?.weights) setWeights(data.weights);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const runEvaluation = async (type: 'movie' | 'book') => {
    setEvaluating(true);
    try {
      const result = await recommendApi.evaluate(type);
      if (type === 'movie') setEvalMovie(result);
      else setEvalBook(result);
      toast.success(`${type === 'movie' ? '影视' : '书籍'}推荐评估完成`);
    } catch { toast.error('评估失败'); }
    setEvaluating(false);
  };

  const saveWeights = async () => {
    try {
      const result = await recommendApi.setWeights(weights);
      setWeights(result);
      toast.success('算法权重已更新');
    } catch { toast.error('更新失败'); }
  };

  const matrixChartOption = stats ? ({
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['用户数', '物品数', '交互数'], textStyle: { color: '#9ca3af' } },
    xAxis: { type: 'category' as const, data: ['影视', '书籍', '音乐'], axisLabel: { color: '#9ca3af' } },
    yAxis: { type: 'value' as const, axisLabel: { color: '#9ca3af' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    series: [
      { name: '用户数', type: 'bar', data: [stats.matrix.movie.users, stats.matrix.book.users, stats.matrix.music.users], itemStyle: { color: '#8b5cf6' } },
      { name: '物品数', type: 'bar', data: [stats.matrix.movie.items, stats.matrix.book.items, stats.matrix.music.items], itemStyle: { color: '#06b6d4' } },
      { name: '交互数', type: 'bar', data: [stats.matrix.movie.interactions, stats.matrix.book.interactions, stats.matrix.music.interactions], itemStyle: { color: '#ec4899' } },
    ],
    backgroundColor: 'transparent',
    grid: { containLabel: true, left: 10, right: 10 },
  }) : {};

  const sparsityOption = stats ? ({
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c}%' },
    series: [{
      type: 'pie',
      radius: ['50%', '70%'],
      label: { color: '#9ca3af', fontSize: 12 },
      data: [
        { value: stats.matrix.movie.sparsity, name: '影视稀疏度', itemStyle: { color: '#8b5cf6' } },
        { value: stats.matrix.book.sparsity, name: '书籍稀疏度', itemStyle: { color: '#06b6d4' } },
        { value: stats.matrix.music.sparsity, name: '音乐稀疏度', itemStyle: { color: '#ec4899' } },
      ],
    }],
    backgroundColor: 'transparent',
  }) : {};

  const renderEvalResult = (evalData: any, type: string) => {
    if (!evalData) return null;
    const radarOption = {
      radar: {
        indicator: [
          { name: '准确率', max: 1 },
          { name: '召回率', max: 1 },
          { name: '覆盖率', max: 1 },
        ],
        axisName: { color: '#9ca3af' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitArea: { areaStyle: { color: ['rgba(139,92,246,0.05)', 'rgba(139,92,246,0.1)'] } },
      },
      series: [{
        type: 'radar',
        data: [{
          value: [evalData.precision, evalData.recall, evalData.coverage],
          name: type,
          areaStyle: { color: 'rgba(139,92,246,0.3)' },
          lineStyle: { color: '#8b5cf6' },
          itemStyle: { color: '#8b5cf6' },
        }],
      }],
      backgroundColor: 'transparent',
    };

    const methodDist = evalData.methodDistribution || {};
    const distOption = {
      tooltip: { trigger: 'item' as const },
      series: [{
        type: 'pie', radius: '65%',
        label: { color: '#9ca3af', fontSize: 11 },
        data: Object.entries(methodDist).map(([k, v]) => ({
          name: k === 'user-cf' ? 'User-CF' : k === 'item-cf' ? 'Item-CF' : k === 'content' ? '内容过滤' : k === 'hybrid' ? '混合' : k,
          value: v as number,
        })),
      }],
      backgroundColor: 'transparent',
    };

    return (
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass rounded-xl border border-white/10 p-4">
          <h4 className="text-sm font-semibold text-white mb-3">评估指标（Precision / Recall / Coverage）</h4>
          <ReactECharts option={radarOption} style={{ height: 220 }} />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: '准确率', val: (evalData.precision * 100).toFixed(2) + '%' },
              { label: '召回率', val: (evalData.recall * 100).toFixed(2) + '%' },
              { label: '覆盖率', val: (evalData.coverage * 100).toFixed(2) + '%' },
            ].map(m => (
              <div key={m.label} className="text-center p-2 rounded-lg bg-white/5">
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className="text-sm font-bold text-white">{m.val}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            参评用户: {evalData.userCount} · 平均列表长度: {evalData.avgListLength?.toFixed(1)}
          </div>
        </div>
        <div className="glass rounded-xl border border-white/10 p-4">
          <h4 className="text-sm font-semibold text-white mb-3">推荐方法分布</h4>
          <ReactECharts option={distOption} style={{ height: 220 }} />
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-10 h-10 border-2 border-muse-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muse-500 to-pink-500 flex items-center justify-center">
            <HiCpuChip className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">推荐引擎管理</h2>
            <p className="text-sm text-gray-500">算法监控 · 效果评估 · 参数调优</p>
          </div>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-sm text-gray-300 hover:text-white transition-all">
          <HiArrowPath className="w-4 h-4" /> 刷新
        </button>
      </div>

      <div className="rounded-xl border border-muse-500/20 bg-muse-500/10 px-4 py-3">
        <p className="text-sm text-muse-200">
          演示建议：先展示交互矩阵与稀疏度，再演示种子数据生成，最后执行离线评估并说明权重调优对推荐分布的影响。
        </p>
      </div>

      {/* Matrix Stats */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <HiChartBar className="w-5 h-5 text-muse-400" />
            <h3 className="text-base font-semibold text-white">用户-物品交互矩阵</h3>
          </div>
          <ReactECharts option={matrixChartOption} style={{ height: 250 }} />
        </div>
        <div className="glass rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <HiChartBar className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">数据稀疏度</h3>
          </div>
          <ReactECharts option={sparsityOption} style={{ height: 250 }} />
          <p className="text-xs text-gray-500 text-center mt-1">稀疏度越低 = 交互数据越充分 = 推荐效果越好</p>
        </div>
      </div>

      {/* Detailed metrics cards */}
      {stats && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: '影视', data: stats.matrix.movie, color: 'violet', icon: '🎬' },
            { label: '书籍', data: stats.matrix.book, color: 'cyan', icon: '📚' },
            { label: '音乐', data: stats.matrix.music, color: 'pink', icon: '🎵' },
          ].map(({ label, data, color, icon }) => (
            <div key={label} className="glass rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{icon}</span>
                <h4 className="text-sm font-semibold text-white">{label}模块</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-xs text-gray-400">参与用户</span><span className="text-sm text-white font-medium">{data.users}</span></div>
                <div className="flex justify-between"><span className="text-xs text-gray-400">物品总数</span><span className="text-sm text-white font-medium">{data.items}</span></div>
                <div className="flex justify-between"><span className="text-xs text-gray-400">交互记录</span><span className="text-sm text-white font-medium">{data.interactions}</span></div>
                <div className="flex justify-between"><span className="text-xs text-gray-400">稀疏度</span><span className="text-sm text-white font-medium">{data.sparsity}%</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seed Data for Demo */}
      <div className="glass rounded-xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HiCircleStack className="w-5 h-5 text-fuchsia-400" />
            <h3 className="text-base font-semibold text-white">模拟数据生成</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={async () => {
              setSeeding(true);
              try {
                const result = await recommendApi.seedData();
                setSeedResult(result);
                toast.success('模拟数据已生成');
                fetchStats();
              } catch { toast.error('生成失败，请检查外部API连接'); }
              setSeeding(false);
            }} disabled={seeding}
              className="px-3 py-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 text-xs hover:bg-fuchsia-500/30 transition-colors disabled:opacity-50">
              {seeding ? '正在从 TMDB/OpenLibrary 拉取数据...' : '一键生成模拟数据'}
            </button>
            <button onClick={async () => {
              try { await recommendApi.clearSeed(); toast.success('已清除'); fetchStats(); setSeedResult(null); } catch { toast.error('清除失败'); }
            }}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs hover:bg-red-500/30 transition-colors flex items-center gap-1">
              <HiTrash className="w-3 h-3" /> 清除模拟数据
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3">从 TMDB / Open Library 拉取真实影视和书籍数据，生成模拟用户行为，保证推荐系统与前端展示数据 100% 同源</p>
        {seedResult && (
          <div className="p-3 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/10 text-xs text-gray-300">
            <p className="text-fuchsia-300 font-medium mb-1">{seedResult.message || '已完成'}</p>
            {seedResult.stats && (
              <div className="flex flex-wrap gap-3 mt-2">
                <span>模拟用户: {seedResult.stats.users}</span>
                <span>影视标记: {seedResult.stats.movieMarks}</span>
                <span>书籍标记: {seedResult.stats.bookMarks}</span>
                <span>真实影视: {seedResult.stats.movieItems}部</span>
                <span>真实书籍: {seedResult.stats.bookItems}本</span>
                <span>元数据缓存: {seedResult.stats.metaCached}条</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weight Tuning */}
      <div className="glass rounded-xl border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <HiAdjustmentsHorizontal className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-white">混合推荐权重调优</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">调整三种算法的混合权重，系统会自动归一化使总和为1</p>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          {[
            { key: 'userCF' as const, label: 'User-CF 权重', desc: '基于用户相似度', color: 'violet' },
            { key: 'itemCF' as const, label: 'Item-CF 权重', desc: '基于物品相似度', color: 'cyan' },
            { key: 'content' as const, label: '内容过滤权重', desc: '基于内容特征', color: 'emerald' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="p-3 rounded-xl bg-white/5 border border-white/5">
              <label className="text-sm text-white font-medium">{label}</label>
              <p className="text-xs text-gray-500 mb-2">{desc}</p>
              <input type="range" min="0" max="1" step="0.05" value={weights[key]}
                onChange={(e) => setWeights(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                className="w-full accent-muse-500" />
              <div className="text-center text-sm font-bold text-muse-300 mt-1">{weights[key].toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-400">
            当前比例: UCF {(weights.userCF / (weights.userCF + weights.itemCF + weights.content) * 100).toFixed(0)}%
            / ICF {(weights.itemCF / (weights.userCF + weights.itemCF + weights.content) * 100).toFixed(0)}%
            / CB {(weights.content / (weights.userCF + weights.itemCF + weights.content) * 100).toFixed(0)}%
          </p>
          <button onClick={saveWeights} className="px-4 py-2 rounded-xl bg-gradient-to-r from-muse-500 to-pink-500 text-white text-sm font-medium hover:shadow-neon-purple transition-all">
            保存权重
          </button>
        </div>
      </div>

      {/* Evaluation */}
      <div className="glass rounded-xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HiBeaker className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">离线评估 (Leave-One-Out)</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => runEvaluation('movie')} disabled={evaluating}
              className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-xs hover:bg-violet-500/30 transition-colors disabled:opacity-50">
              {evaluating ? '评估中...' : '评估影视'}
            </button>
            <button onClick={() => runEvaluation('book')} disabled={evaluating}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs hover:bg-cyan-500/30 transition-colors disabled:opacity-50">
              {evaluating ? '评估中...' : '评估书籍'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-4">对标记数≥5的用户执行 Leave-One-Out 交叉验证，隐去一个高分标记，检测推荐列表是否命中</p>
        {evalMovie && <div className="mb-4"><h4 className="text-sm text-violet-300 font-medium mb-2">影视评估结果</h4>{renderEvalResult(evalMovie, '影视')}</div>}
        {evalBook && <div><h4 className="text-sm text-cyan-300 font-medium mb-2">书籍评估结果</h4>{renderEvalResult(evalBook, '书籍')}</div>}
        {!evalMovie && !evalBook && (
          <div className="text-center py-8 text-gray-500 text-sm">点击上方按钮运行评估</div>
        )}
      </div>
    </div>
  );
}
