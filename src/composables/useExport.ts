import type { PlantRecord, Activity, RiskIssue, DeliveryConfirmationSummary } from '@/types'
import { PROOFREAD_STATUSES } from '@/types'

export function useExport() {
  function exportCSV(records: PlantRecord[], activity: Activity) {
    const BOM = '\uFEFF'
    const headers = ['展示序号', '植物名', '拉丁名', '适合光照', '浇水提醒', '责任人', '校对状态', '校对备注']
    const rows = records.map((r) => [
      r.displayOrder,
      r.plantName,
      r.latinName,
      r.lightType,
      r.wateringReminder,
      r.responsiblePerson,
      r.status,
      r.proofreadNote,
    ])

    const csvContent =
      BOM +
      [headers.join(','), ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `${activity.name || '植物插牌'}_校对数据.csv`)
  }

  function exportPrintHTML(records: PlantRecord[], activity: Activity) {
    const html = generatePrintHTML(records, activity)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 500)
    }
  }

  function exportChecklist(records: PlantRecord[], activity: Activity, issues: RiskIssue[]) {
    const html = generateChecklistHTML(records, activity, issues)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 500)
    }
  }

  function generatePrintHTML(records: PlantRecord[], activity: Activity): string {
    const cards = records
      .filter((r) => r.status === '可打印')
      .map(
        (r) => `
      <div class="card">
        <div class="card-order">${r.displayOrder}</div>
        <div class="card-name">${r.plantName}</div>
        <div class="card-latin">${r.latinName}</div>
        <div class="card-info">
          <span class="tag">${r.lightType}</span>
          <span class="water">${r.wateringReminder}</span>
        </div>
        <div class="card-person">责任人：${r.responsiblePerson}</div>
      </div>`,
      )
      .join('')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${activity.name || '植物插牌'} - 打印版</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans SC', sans-serif; padding: 20px; background: #fff; }
    h1 { text-align: center; font-size: 24px; margin-bottom: 8px; color: #1B4332; }
    .meta { text-align: center; color: #666; margin-bottom: 24px; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .card {
      border: 2px solid #2D6A4F; border-radius: 12px; padding: 16px;
      page-break-inside: avoid; position: relative;
    }
    .card-order { position: absolute; top: 8px; right: 12px; font-size: 20px; font-weight: bold; color: #52B788; }
    .card-name { font-size: 18px; font-weight: bold; color: #1B4332; margin-bottom: 4px; }
    .card-latin { font-style: italic; color: #666; font-size: 14px; margin-bottom: 8px; }
    .card-info { display: flex; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .tag { background: #D8F3DC; color: #1B4332; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .water { color: #2D6A4F; font-size: 13px; }
    .card-person { font-size: 12px; color: #888; }
    @media print { body { padding: 0; } .grid { gap: 12px; } }
  </style>
</head>
<body>
  <h1>${activity.name || '植物插牌校对'}</h1>
  <div class="meta">${activity.date ? `日期：${activity.date}` : ''} ${activity.location ? `| 地点：${activity.location}` : ''}</div>
  <div class="grid">${cards}</div>
</body>
</html>`
  }

  function generateChecklistHTML(records: PlantRecord[], activity: Activity, issues: RiskIssue[]): string {
    const statusSummary = PROOFREAD_STATUSES.map(
      (s) => `<div class="stat-item"><span class="stat-label">${s}</span><span class="stat-value">${records.filter((r) => r.status === s).length}</span></div>`,
    ).join('')

    const handedOverCount = records.filter((r) => r.isHandedOver).length
    const notHandedOverCount = records.length - handedOverCount
    const handoverProgress = records.length > 0 ? ((handedOverCount / records.length) * 100).toFixed(1) : '0'

    const personMap = new Map<string, { total: number; handed: number; notHanded: number }>()
    records.forEach((r) => {
      if (!r.responsiblePerson) return
      if (!personMap.has(r.responsiblePerson)) {
        personMap.set(r.responsiblePerson, { total: 0, handed: 0, notHanded: 0 })
      }
      const p = personMap.get(r.responsiblePerson)!
      p.total++
      if (r.isHandedOver) {
        p.handed++
      } else {
        p.notHanded++
      }
    })

    let personHandoverSummary = ''
    if (personMap.size > 0) {
      const personRows = Array.from(personMap.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .map(([name, data]) => {
          const progress = data.total > 0 ? ((data.handed / data.total) * 100).toFixed(0) : '0'
          return `<tr>
            <td>${name}</td>
            <td>${data.total}</td>
            <td class="status-handed">${data.handed}</td>
            <td class="status-not-handed">${data.notHanded}</td>
            <td>
              <div class="mini-progress">
                <div class="mini-progress-fill" style="width: ${progress}%"></div>
              </div>
              <span class="mini-progress-text">${progress}%</span>
            </td>
          </tr>`
        })
        .join('')

      personHandoverSummary = `
        <h2>责任人交接情况</h2>
        <table class="person-table">
          <thead><tr><th>责任人</th><th>总数</th><th>已交接</th><th>待交接</th><th>完成进度</th></tr></thead>
          <tbody>${personRows}</tbody>
        </table>
      `
    }

    const issueList = issues.length
      ? issues
          .map(
            (i) => `<div class="issue level-${i.level}">
        <span class="issue-level">${i.level >= 3 ? '🔴' : i.level === 2 ? '🟡' : '🟠'}</span>
        <span>${i.message}</span>
      </div>`,
          )
          .join('')
      : '<div class="no-issue">✅ 未检测到任何风险问题</div>'

    const recordRows = records
      .map(
        (r) => `<tr>
        <td>${r.displayOrder}</td>
        <td>${r.plantName || '<em>未填写</em>'}</td>
        <td>${r.latinName}</td>
        <td>${r.lightType}</td>
        <td>${r.wateringReminder || '<em class="warn">缺失</em>'}</td>
        <td>${r.responsiblePerson}</td>
        <td class="status-${r.status}">${r.status}</td>
        <td class="${r.isHandedOver ? 'handover-done' : 'handover-pending'}">
          ${r.isHandedOver ? '✅ 已交接' : '⏳ 待交接'}
        </td>
        <td>${r.proofreadNote}</td>
      </tr>`,
      )
      .join('')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${activity.name || '植物插牌'} - 打印前校对清单</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans SC', sans-serif; padding: 24px; background: #fff; color: #333; }
    h1 { text-align: center; font-size: 22px; color: #1B4332; margin-bottom: 4px; }
    .meta { text-align: center; color: #666; margin-bottom: 20px; font-size: 13px; }
    .stats { display: flex; gap: 16px; margin-bottom: 16px; justify-content: center; flex-wrap: wrap; }
    .stat-item { text-align: center; padding: 8px 16px; border: 1px solid #ddd; border-radius: 8px; }
    .stat-value { display: block; font-size: 24px; font-weight: bold; color: #1B4332; }
    .stat-label { font-size: 12px; color: #888; }
    .handover-overview {
      background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px;
      padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;
    }
    .handover-overview-left { display: flex; align-items: center; gap: 12px; }
    .handover-icon { font-size: 24px; }
    .handover-text { font-size: 14px; color: #166534; font-weight: 500; }
    .handover-subtext { font-size: 12px; color: #4ADE80; }
    .handover-counts { display: flex; gap: 16px; }
    .handover-count { text-align: center; }
    .handover-count-value { font-size: 18px; font-weight: bold; color: #166534; }
    .handover-count-label { font-size: 11px; color: #86EFAC; }
    h2 { font-size: 16px; color: #1B4332; margin: 16px 0 8px; border-bottom: 2px solid #52B788; padding-bottom: 4px; }
    .issue { padding: 6px 12px; border-radius: 6px; margin-bottom: 6px; font-size: 13px; display: flex; gap: 8px; align-items: center; }
    .issue.level-3 { background: #FDE8E8; color: #C53030; }
    .issue.level-2 { background: #FEF3C7; color: #92400E; }
    .issue.level-1 { background: #FFF7ED; color: #C2410C; }
    .no-issue { text-align: center; padding: 16px; color: #52B788; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #1B4332; color: #fff; padding: 6px 8px; text-align: left; }
    td { padding: 5px 8px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #F9FAFB; }
    em { color: #999; }
    em.warn { color: #E76F51; font-weight: bold; }
    .status-待补充 { color: #9CA3AF; }
    .status-待校对 { color: #E9C46A; font-weight: bold; }
    .status-可打印 { color: #52B788; font-weight: bold; }
    .status-暂不展示 { color: #E76F51; }
    .handover-done { color: #52B788; font-weight: bold; }
    .handover-pending { color: #D97706; }
    .person-table { margin-top: 8px; }
    .status-handed { color: #52B788; font-weight: bold; }
    .status-not-handed { color: #D97706; }
    .mini-progress {
      display: inline-block; width: 80px; height: 8px; background: #E5E7EB;
      border-radius: 4px; overflow: hidden; vertical-align: middle; margin-right: 6px;
    }
    .mini-progress-fill { height: 100%; background: linear-gradient(90deg, #52B788, #2D6A4F); border-radius: 4px; }
    .mini-progress-text { font-size: 11px; color: #6B7280; vertical-align: middle; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>📋 打印前校对清单</h1>
  <div class="meta">${activity.name || '植物插牌校对'} ${activity.date ? `| ${activity.date}` : ''} ${activity.location ? `| ${activity.location}` : ''}</div>
  
  <div class="handover-overview">
    <div class="handover-overview-left">
      <span class="handover-icon">🤝</span>
      <div>
        <div class="handover-text">交接进度概览</div>
        <div class="handover-subtext">整体完成度 ${handoverProgress}%</div>
      </div>
    </div>
    <div class="handover-counts">
      <div class="handover-count">
        <div class="handover-count-value">${handedOverCount}</div>
        <div class="handover-count-label">已交接</div>
      </div>
      <div class="handover-count">
        <div class="handover-count-value">${notHandedOverCount}</div>
        <div class="handover-count-label">待交接</div>
      </div>
      <div class="handover-count">
        <div class="handover-count-value">${records.length}</div>
        <div class="handover-count-label">总计</div>
      </div>
    </div>
  </div>

  <div class="stats">${statusSummary}</div>
  
  ${personHandoverSummary}
  
  <h2>风险检查</h2>
  ${issueList}
  <h2>记录明细（共 ${records.length} 条）</h2>
  <table>
    <thead><tr><th>序号</th><th>植物名</th><th>拉丁名</th><th>光照</th><th>浇水</th><th>责任人</th><th>状态</th><th>交接</th><th>备注</th></tr></thead>
    <tbody>${recordRows}</tbody>
  </table>
</body>
</html>`
  }

  function exportDeliveryConfirmation(summary: DeliveryConfirmationSummary) {
    const html = generateDeliveryConfirmationHTML(summary)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 500)
    }
  }

  function generateDeliveryConfirmationHTML(summary: DeliveryConfirmationSummary): string {
    function formatDate(timestamp: number): string {
      return new Date(timestamp).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const activity = summary.activityInfo
    const personRows = summary.personSummaries
      .map(
        (ps) => `
      <tr>
        <td>${ps.personName}</td>
        <td>${ps.totalCount}</td>
        <td>${ps.printableCount}</td>
        <td class="status-handed">${ps.handedOverCount}</td>
        <td class="status-not-handed">${ps.notHandedOverCount}</td>
        <td>
          <div class="mini-progress">
            <div class="mini-progress-fill" style="width: ${ps.completionRate}%; ${ps.completionRate >= 100 ? 'background: linear-gradient(90deg, #52B788, #2D6A4F);' : ps.completionRate >= 50 ? 'background: linear-gradient(90deg, #F59E0B, #D97706);' : 'background: linear-gradient(90deg, #EF4444, #DC2626);'}"></div>
          </div>
          <span class="mini-progress-text" style="${ps.completionRate >= 100 ? 'color: #166534;' : ps.completionRate >= 50 ? 'color: #92400E;' : 'color: #991B1B;'}">${ps.completionRate.toFixed(1)}%</span>
        </td>
      </tr>`,
      )
      .join('')

    const unhandedRows = summary.unhandedReasons.length
      ? summary.unhandedReasons
          .map(
            (ur) => `
        <tr>
          <td>${ur.plantName}</td>
          <td>${ur.personName}</td>
          <td class="unhanded-reason">${ur.reason}</td>
        </tr>`,
          )
          .join('')
      : '<tr><td colspan="3" class="empty-row">✅ 所有可打印记录均已完成交付确认</td></tr>'

    const reminderItems = summary.printReminders
      .map(
        (r) => `
      <div class="reminder-item ${r.includes('高风险') ? 'reminder-high' : r.includes('中风险') || r.includes('缺少') ? 'reminder-medium' : r.includes('已通过') ? 'reminder-success' : ''}">
        <span class="reminder-icon">${r.includes('高风险') ? '🔴' : r.includes('中风险') || r.includes('缺少') ? '🟡' : r.includes('暂不展示') || r.includes('尚未完成') ? 'ℹ️' : '✅'}</span>
        <span>${r}</span>
      </div>`,
      )
      .join('')

    const statusBadge = summary.allPrintableDelivered
      ? '<span class="badge badge-success">全部已交付</span>'
      : '<span class="badge badge-warning">待交付</span>'

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${activity.name || '植物插牌'} - 交付确认闭环摘要</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans SC', sans-serif; padding: 24px; background: #fff; color: #333; }
    .header { text-align: center; margin-bottom: 24px; }
    h1 { font-size: 22px; color: #1B4332; margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .header-icon { font-size: 24px; }
    .meta { color: #666; font-size: 13px; }
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin-left: 8px; }
    .badge-success { background: #D1FAE5; color: #065F46; }
    .badge-warning { background: #FEF3C7; color: #92400E; }
    
    .activity-card {
      background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 12px;
      padding: 16px; margin-bottom: 20px;
    }
    .activity-name { font-size: 18px; font-weight: bold; color: #166534; margin-bottom: 8px; }
    .activity-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: #065F46; }
    .meta-item { display: flex; align-items: center; gap: 4px; }
    
    .overview-section {
      background: linear-gradient(135deg, #ECFDF5, #CCFBF1);
      border: 1px solid #6EE7B7; border-radius: 12px;
      padding: 20px; margin-bottom: 20px;
    }
    .overview-title { font-size: 15px; font-weight: 600; color: #065F46; margin-bottom: 16px; }
    .overview-stats { display: flex; justify-content: space-around; gap: 16px; flex-wrap: wrap; }
    .overview-stat { text-align: center; flex: 1; min-width: 100px; }
    .stat-number { font-size: 28px; font-weight: bold; font-family: 'Playfair Display', serif; }
    .stat-number.printable { color: #059669; }
    .stat-number.handed { color: #10B981; }
    .stat-number.pending { color: #D97706; }
    .stat-label { font-size: 12px; color: #6B7280; margin-top: 4px; }
    
    .progress-ring-container {
      display: flex; justify-content: center; margin-bottom: 20px;
    }
    .progress-ring {
      width: 120px; height: 120px; position: relative;
    }
    .progress-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .progress-ring-bg { fill: none; stroke: #E5E7EB; stroke-width: 8; }
    .progress-ring-fill {
      fill: none; stroke-width: 8; stroke-linecap: round;
      stroke: ${summary.overallCompletionRate >= 100 ? '#10B981' : summary.overallCompletionRate >= 50 ? '#F59E0B' : '#EF4444'};
      stroke-dasharray: ${2 * Math.PI * 45};
      stroke-dashoffset: ${2 * Math.PI * 45 * (1 - summary.overallCompletionRate / 100)};
      transition: stroke-dashoffset 1s ease;
    }
    .progress-text {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
    }
    .progress-percent { font-size: 24px; font-weight: bold; color: ${summary.overallCompletionRate >= 100 ? '#059669' : summary.overallCompletionRate >= 50 ? '#D97706' : '#DC2626'}; }
    .progress-label { font-size: 11px; color: #6B7280; }
    
    h2 { font-size: 16px; color: #1B4332; margin: 20px 0 10px; border-bottom: 2px solid #52B788; padding-bottom: 6px; }
    
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    th { background: #1B4332; color: #fff; padding: 8px 10px; text-align: left; }
    td { padding: 7px 10px; border-bottom: 1px solid #E5E7EB; }
    tr:nth-child(even) { background: #F9FAFB; }
    .status-handed { color: #10B981; font-weight: bold; }
    .status-not-handed { color: #D97706; font-weight: bold; }
    .unhanded-reason { color: #92400E; }
    .empty-row { text-align: center; color: #10B981; padding: 16px; font-weight: 500; }
    
    .mini-progress {
      display: inline-block; width: 80px; height: 8px; background: #E5E7EB;
      border-radius: 4px; overflow: hidden; vertical-align: middle; margin-right: 6px;
    }
    .mini-progress-fill { height: 100%; background: linear-gradient(90deg, #52B788, #2D6A4F); border-radius: 4px; }
    .mini-progress-text { font-size: 11px; color: #6B7280; vertical-align: middle; font-weight: 500; }
    
    .reminder-list { space-y: 8px; }
    .reminder-item {
      display: flex; gap: 8px; padding: 10px 12px; border-radius: 8px;
      margin-bottom: 8px; font-size: 13px; align-items: flex-start;
    }
    .reminder-high { background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; }
    .reminder-medium { background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; }
    .reminder-success { background: #F0FDF4; border: 1px solid #BBF7D0; color: #166534; }
    .reminder-item:not(.reminder-high):not(.reminder-medium):not(.reminder-success) {
      background: #F9FAFB; border: 1px solid #E5E7EB; color: #374151;
    }
    .reminder-icon { flex-shrink: 0; font-size: 14px; }
    
    .alert-section {
      padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;
      display: flex; gap: 12px; align-items: flex-start;
    }
    .alert-warning { background: #FFFBEB; border: 1px solid #FDE68A; }
    .alert-info { background: #EFF6FF; border: 1px solid #BFDBFE; }
    .alert-success { background: #F0FDF4; border: 1px solid #BBF7D0; }
    .alert-icon { font-size: 20px; flex-shrink: 0; }
    .alert-content h4 { font-size: 14px; margin-bottom: 4px; }
    .alert-content p { font-size: 12px; opacity: 0.8; }
    
    .footer {
      margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB;
      text-align: center; font-size: 11px; color: #9CA3AF;
    }
    
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>
      <span class="header-icon">🤝</span>
      交付确认闭环摘要
      ${statusBadge}
    </h1>
    <div class="meta">
      生成时间：${formatDate(summary.generatedAt)} | 生成人：${summary.generatedBy}
    </div>
  </div>

  <div class="activity-card">
    <div class="activity-name">${activity.name || '未命名活动'}</div>
    <div class="activity-meta">
      ${activity.date ? `<span class="meta-item">📅 ${activity.date}</span>` : ''}
      ${activity.location ? `<span class="meta-item">📍 ${activity.location}</span>` : ''}
      ${activity.participantCount ? `<span class="meta-item">👥 ${activity.participantCount} 人参与</span>` : ''}
    </div>
  </div>

  <div class="overview-section">
    <div class="overview-title">整体交付进度</div>
    <div class="progress-ring-container">
      <div class="progress-ring">
        <svg viewBox="0 0 100 100">
          <circle class="progress-ring-bg" cx="50" cy="50" r="45" />
          <circle class="progress-ring-fill" cx="50" cy="50" r="45" />
        </svg>
        <div class="progress-text">
          <span class="progress-percent">${summary.overallCompletionRate.toFixed(1)}%</span>
          <span class="progress-label">完成率</span>
        </div>
      </div>
    </div>
    <div class="overview-stats">
      <div class="overview-stat">
        <div class="stat-number printable">${summary.totalPrintableCount}</div>
        <div class="stat-label">可打印总数</div>
      </div>
      <div class="overview-stat">
        <div class="stat-number handed">${summary.totalHandedOverCount}</div>
        <div class="stat-label">已交付</div>
      </div>
      <div class="overview-stat">
        <div class="stat-number pending">${summary.totalNotHandedOverCount}</div>
        <div class="stat-label">待交付</div>
      </div>
    </div>
  </div>

  ${summary.unhandedReasons.length > 0 ? `
  <div class="alert-section alert-warning">
    <span class="alert-icon">⚠️</span>
    <div class="alert-content">
      <h4>存在未交付项</h4>
      <p>还有 ${summary.unhandedReasons.length} 条记录未完成交付确认，请查看"未交付项"部分</p>
    </div>
  </div>` : ''}

  ${summary.printReminders.length > 0 ? `
  <div class="alert-section alert-info">
    <span class="alert-icon">ℹ️</span>
    <div class="alert-content">
      <h4>打印前提醒</h4>
      <p>有 ${summary.printReminders.length} 项注意事项需要关注，请查看"打印前提醒"部分</p>
    </div>
  </div>` : ''}

  ${summary.allPrintableDelivered ? `
  <div class="alert-section alert-success">
    <span class="alert-icon">✅</span>
    <div class="alert-content">
      <h4>全部已交付</h4>
      <p>所有可打印记录均已完成责任人交付确认，可以进行打印</p>
    </div>
  </div>` : ''}

  <h2>责任人完成情况</h2>
  <table>
    <thead>
      <tr>
        <th>责任人</th>
        <th>负责总数</th>
        <th>可打印数</th>
        <th>已交付</th>
        <th>待交付</th>
        <th>完成率</th>
      </tr>
    </thead>
    <tbody>${personRows}</tbody>
  </table>

  <h2>未交付项清单 (${summary.unhandedReasons.length} 项)</h2>
  <table>
    <thead>
      <tr>
        <th>植物名</th>
        <th>责任人</th>
        <th>未交付原因</th>
      </tr>
    </thead>
    <tbody>${unhandedRows}</tbody>
  </table>

  <h2>打印前提醒 (${summary.printReminders.length} 项)</h2>
  <div class="reminder-list">${reminderItems}</div>

  <div class="footer">
    本摘要由植物插牌校对系统自动生成
  </div>
</body>
</html>`
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return { exportCSV, exportPrintHTML, exportChecklist, exportDeliveryConfirmation }
}
