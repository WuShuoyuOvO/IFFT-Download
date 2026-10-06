/**
 * IFFT · 智能填表工具
 * Copyright (c) 2026 小宇. All rights reserved.
 * 专有软件，未开源。未经书面许可不得复制、修改、分发或用于二次开发。
 */
// IFFT 扩展后台（MV3 service worker）
// 只做两件事：点工具栏图标唤起面板；按 alarms 检查 24 小时回填到点并提醒。
// 所有业务逻辑都在 content.js 里，这里不重复实现。

const ALARM = 'ifft.recall';
const KEY = 'ifft.submissions';

function notify(title, message) {
  try {
    // 不指定 iconUrl：扩展未提供图标资源，让它回落到默认图标
    chrome.notifications.create('ifft-' + Date.now(), {
      type: 'basic',
      title: String(title || 'IFFT'),
      message: String(message || ''),
    });
  } catch (e) { /* 通知不可用时静默 */ }
}

chrome.runtime.onInstalled.addListener(() => {
  // MV3 的 service worker 非常驻，回填检查只能靠 alarms 周期唤醒；
  // 周期取 30 分钟，避免过密被浏览器节流
  chrome.alarms.create(ALARM, { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm || alarm.name !== ALARM) return;
  chrome.storage.local.get([KEY], (o) => {
    const list = (o && o[KEY]) || [];
    const now = Date.now();
    const due = list.filter((s) => s && s.status !== 'done' && s.recallAt && s.recallAt <= now);
    if (!due.length) return;
    notify('IFFT · 待回填提醒', due.length + ' 条作品已到 24 小时，打开原作品页提取一次即可更新点赞数');
  });
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab || !tab.id) return;
  try { chrome.tabs.sendMessage(tab.id, { type: 'ifft.open' }); } catch (e) { /* 页面未注入时忽略 */ }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'ifft.notify') notify(msg.title, msg.message);
});
