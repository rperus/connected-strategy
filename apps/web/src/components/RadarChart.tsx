import React from 'react';
import ReactECharts from 'echarts-for-react';

interface Props { metrics: Record<string, number>; size?: number; }

const LABELS = [
  { name: 'CE', max: 100 },
  { name: 'CL', max: 100 },
  { name: 'SC', max: 100 },
  { name: 'WTP', max: 100 },
  { name: 'CR', max: 100 },
  { name: 'CP', max: 100 },
  { name: 'BM', max: 100 },
  { name: 'DS', max: 100 },
  { name: 'AR', max: 100 },
  { name: 'SAC', max: 100 },
];

export function RadarChart({ metrics, size = 260 }: Props) {
  const values = Object.values(metrics).slice(0, 10);
  
  const option = {
    radar: {
      indicator: LABELS,
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisName: { color: '#7b7f9a', fontSize: 10, fontFamily: 'Inter' },
      radius: '65%',
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        itemStyle: { color: '#818cf8' },
        lineStyle: { color: '#6366f1', width: 2 },
        areaStyle: { color: 'rgba(99,102,241,0.2)' },
      }],
      symbol: 'circle',
      symbolSize: 6,
    }]
  };

  return (
    <div className="radar-container" style={{ width: size, height: size, margin: '0 auto' }}>
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
