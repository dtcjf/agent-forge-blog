import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/articles';

// 按时间归档 /api/text/archives
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  const articles = await getAllArticles();

  // JSON 格式
  const format = request.headers.get('accept');
  if (format?.includes('application/json')) {
    if (year && month) {
      const filtered = articles.filter(a => {
        const d = new Date(a.date);
        return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
      });
      return NextResponse.json({ year: parseInt(year), month: parseInt(month), articles: filtered });
    }
    if (year) {
      const filtered = articles.filter(a => new Date(a.date).getFullYear() === parseInt(year));
      return NextResponse.json({ year: parseInt(year), articles: filtered });
    }
    return NextResponse.json({ articles });
  }

  // 按年份分组
  const byYear: Record<string, typeof articles> = {};
  for (const article of articles) {
    const d = new Date(article.date);
    const y = d.getFullYear().toString();
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(article);
  }

  // 按月份筛选
  let filteredArticles = articles;
  let filterDesc = '';

  if (year && month) {
    filteredArticles = articles.filter(a => {
      const d = new Date(a.date);
      return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
    });
    filterDesc = `${year}年${month}月`;
  } else if (year) {
    filteredArticles = articles.filter(a => new Date(a.date).getFullYear() === parseInt(year));
    filterDesc = `${year}年`;
  }

  // 纯文本格式 - 使用更安全的方式构建
  const lines: string[] = [];

  // 年份列表
  if (!year && !month) {
    lines.push('');
    lines.push('┌───────────────────────────────────────────────────────┐');
    lines.push('│                    📅 时间归档                        │');
    lines.push('└───────────────────────────────────────────────────────┘');
    lines.push('');
    lines.push('按年份浏览:');
    lines.push('──────────────────────────────────────────────────');
    const years = Object.keys(byYear).sort((a, b) => parseInt(b) - parseInt(a));
    for (const y of years) {
      lines.push(`  📁 ${y}年 (${byYear[y].length} 篇)`);
      lines.push(`     curl /api/text/archives?year=${y}`);
    }
    lines.push('');
    lines.push('──────────────────────────────────────────────────');
    lines.push('示例: curl "/api/text/archives?year=2026&month=3"');
  } else {
    // 具体年份/月份的 文章列表
    const yearList = year ? (month ? byYear[year]?.filter(a => new Date(a.date).getMonth() + 1 === parseInt(month)) : byYear[year]) : articles;

    const titleText = filterDesc || '所有文章';
    const paddedTitle = titleText.slice(0, 26);

    lines.push('');
    lines.push('┌───────────────────────────────────────────────────────┐');
    lines.push(`│              📅 ${paddedTitle.padEnd(26)}│`);
    lines.push(`│              共 ${yearList?.length || 0} 篇                              │`);
    lines.push('└───────────────────────────────────────────────────────┘');
    lines.push('');

    if (yearList && yearList.length > 0) {
      // 按月份分组显示
      const byMonth: Record<string, typeof articles> = {};
      for (const article of yearList) {
        const d = new Date(article.date);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[m]) byMonth[m] = [];
        byMonth[m].push(article);
      }

      const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));
      for (const m of months) {
        const [y, monthNum] = m.split('-');
        lines.push('');
        lines.push(`📆 ${y}年${parseInt(monthNum)}月 (${byMonth[m].length} 篇)`);
        lines.push('──────────────────────────────────────────────────');
        byMonth[m].forEach((a) => {
          const day = new Date(a.date).getDate();
          const title = a.title.slice(0, 35);
          lines.push(`  ${String(day).padStart(2, '0')}日  ${title.padEnd(35)} /api/text/article?slug=${a.slug}`);
        });
      }
    } else {
      lines.push('  暂无文章');
    }
  }

  // 返回按钮
  if (year) {
    lines.push('');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('🔙 返回: curl /api/text/archives');
    lines.push(`📅 其他年份: curl /api/text/archives?year=${parseInt(year) - 1}`);
  }

  const text = lines.join('\n');

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
