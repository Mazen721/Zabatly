import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ─── Brand tokens ─── */
const C = {
  primary800: '#1b2b44',
  primary700: '#243a5a',
  primary600: '#2d4a72',
  primary500: '#3a5e90',
  primary100: '#dce4f0',
  primary50: '#eef2f7',
  signal500: '#dd8f24',
  signal400: '#e6a63c',
  signal100: '#f9edcf',
  signal50: '#fdf8ed',
  sand950: '#2c2723',
  sand500: '#a49888',
  sand200: '#e6e1d9',
  sand100: '#f2efea',
  sand50: '#faf8f5',
  green600: '#16a34a',
  green50: '#f0fdf4',
  red600: '#dc2626',
  red50: '#fef2f2',
  white: '#ffffff',
};

const FONT_STACK = "'Cairo','Manrope','Segoe UI',system-ui,sans-serif";
const PAGE_W = 210;   // A4 mm
const PAGE_H = 297;
const CONTENT_W = 794; // px render width
const MARGIN = 10;     // mm side margin for body sections
const BODY_W = PAGE_W - MARGIN * 2; // mm usable width for body

const money = (v) => `${Number(v || 0).toLocaleString()} EGP`;
const shortDate = (v, locale = 'en-GB') =>
  v ? new Date(v).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) : '\u2014';
const fileDate = () => new Date().toISOString().slice(0, 10);

/* ─── Status helpers ─── */

/** Maps Arabic status text → English key for color matching */
const AR_STATUS_MAP = {
  'متاحة': 'available', 'نشط': 'active', 'مفعّل': 'active', 'تم التحقق': 'verified',
  'مدفوع': 'paid', 'مرفوض': 'rejected', 'فشل': 'failed',
  'قيد الانتظار': 'pending', 'مؤكد': 'confirmed', 'قادم': 'upcoming',
  'منتهي': 'expired', 'مكتمل': 'completed', 'ملغي': 'cancelled',
  'مأجرة': 'rented', 'معطّلة': 'disabled', 'محذوفة': 'deleted',
  'أونلاين': 'active', 'مشغول': 'pending', 'أوفلاين': 'offline',
};

const statusCSS = (s = '') => {
  const l = (AR_STATUS_MAP[s] || s).toLowerCase();
  if (['active', 'available', 'verified', 'paid'].includes(l))
    return `color:${C.green600};background:${C.green50}`;
  if (['rejected', 'failed'].includes(l))
    return `color:${C.red600};background:${C.red50}`;
  if (['pending', 'manual_review', 'confirmed', 'upcoming'].includes(l))
    return `color:${C.signal500};background:${C.signal50}`;
  return `color:${C.primary600};background:${C.primary50}`;
};

/* ─── Canvas-rendered badge (pixel-perfect centering) ─── */

function renderBadgeCanvas(text, cssStr) {
  const colorMatch = cssStr.match(/color:(#[0-9a-fA-F]+)/);
  const bgMatch = cssStr.match(/background:(#[0-9a-fA-F]+)/);
  const fg = colorMatch ? colorMatch[1] : C.primary600;
  const bg = bgMatch ? bgMatch[1] : C.primary50;
  const isAr = /[\u0600-\u06FF]/.test(text);

  const scale = 2;
  const fontSize = 10 * scale;
  const padX = 14 * scale;
  const padY = 5 * scale;
  const font = `700 ${fontSize}px 'Cairo','Manrope','Segoe UI',sans-serif`;

  // Measure text width
  const mc = document.createElement('canvas');
  const mx = mc.getContext('2d');
  mx.font = font;
  const tw = mx.measureText(text).width;

  const w = Math.ceil(tw + padX * 2);
  const h = Math.ceil(fontSize + padY * 2);
  const r = h / 2;

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (isAr) ctx.direction = 'rtl';

  // Rounded pill background
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);
  ctx.arcTo(w, h, w - r, h, r);
  ctx.lineTo(r, h);
  ctx.arcTo(0, h, 0, h - r, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();

  // Text at exact center
  ctx.font = font;
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);

  const cssW = Math.round(w / scale);
  const cssH = Math.round(h / scale);
  return `<img src="${c.toDataURL('image/png')}" width="${cssW}" height="${cssH}" style="vertical-align:middle;" />`;
}

function buildBadgeMap(rows, headers) {
  const set = new Set();
  rows.forEach((row) => row.forEach((cell, ci) => {
    const hdr = headers[ci]?.toLowerCase() || '';
    if ((hdr === 'status' || hdr === '\u0627\u0644\u062d\u0627\u0644\u0629') && cell) set.add(String(cell));
  }));
  const map = new Map();
  set.forEach((t) => map.set(t, renderBadgeCanvas(t, statusCSS(t))));
  return map;
}

/* ─── Section HTML builders ─── */

/** Wraps inner HTML in a sized container for html2canvas */
function wrap(inner, fullWidth = false, rtl = false) {
  const w = fullWidth ? PAGE_W * (CONTENT_W / PAGE_W) : CONTENT_W;
  const dirAttr = rtl ? ' dir="rtl"' : '';
  return `<div${dirAttr} style="width:${w}px;font-family:${FONT_STACK};background:${C.white};color:${C.sand950};line-height:1.55;">${inner}</div>`;
}

function headerSection(title, userName, rtl = false) {
  const generated = shortDate(new Date(), rtl ? 'ar-EG' : 'en-GB');
  const gradDir = rtl ? '225deg' : '135deg';
  const stripeDir = rtl ? '270deg' : '90deg';

  // For RTL: title+date on RIGHT, brand on LEFT (visually). Achieved via flex row-reverse.
  const flexDir = rtl ? 'flex-direction:row-reverse;' : '';
  const infoAlign = rtl ? 'text-align:left;' : 'text-align:right;';

  return wrap(`
    <div style="padding:28px 36px 22px;background:linear-gradient(${gradDir},${C.primary800} 0%,${C.primary600} 100%);display:flex;align-items:center;justify-content:space-between;${flexDir}">
      <div>
        <div style="display:flex;align-items:baseline;gap:10px;">
          <span style="font-size:26px;font-weight:800;color:${C.white};letter-spacing:-0.02em;">Zabatly</span>
          <span style="font-size:22px;font-weight:700;color:${C.signal400};font-family:'Cairo',sans-serif;">\u0638\u0628\u0637\u0644\u064A</span>
        </div>
        <div style="font-size:11px;color:${C.primary100};margin-top:2px;${rtl ? '' : 'letter-spacing:0.04em;text-transform:uppercase;'}">${rtl ? 'منصة تأجير سيارات' : 'Car Rental Platform'}</div>
      </div>
      <div style="${infoAlign}">
        <div dir="${rtl ? 'rtl' : 'ltr'}" style="font-size:16px;font-weight:700;color:${C.white};">${title}</div>
        <div style="font-size:11px;color:${C.primary100};margin-top:3px;">${generated}${userName ? ` \u00B7 ${userName}` : ''}</div>
      </div>
    </div>
    <div style="height:3px;background:linear-gradient(${stripeDir},${C.signal500},${C.signal400},transparent);"></div>
  `, true, false);
}

function metricsSection(metrics, rtl = false) {
  const flexDir = rtl ? 'flex-direction:row-reverse;' : '';
  const cards = metrics.map((m) => {
    const accent = m.accent;
    const bg = accent ? C.signal50 : C.sand50;
    const border = accent ? C.signal100 : C.sand200;
    const valColor = accent ? C.signal500 : C.primary800;
    return `<div style="flex:1;padding:16px 18px;background:${bg};border:1px solid ${border};border-radius:8px;">
      <div style="font-size:10px;${rtl ? '' : 'text-transform:uppercase;letter-spacing:0.06em;'}color:${C.sand500};font-weight:600;margin-bottom:6px;">${m.label}</div>
      <div style="font-size:22px;font-weight:800;color:${valColor};letter-spacing:-0.01em;">${m.value}</div>
    </div>`;
  }).join('');
  return wrap(`<div style="display:flex;gap:12px;padding:4px 0;${flexDir}">${cards}</div>`, false, rtl);
}

function tableSection(title, headers, rows, rtl = false, badgeMap) {
  const txtAlign = rtl ? 'text-align:right;' : 'text-align:left;';

  const ths = headers.map((h) =>
    `<th style="padding:9px 12px;font-size:10px;${rtl ? '' : 'text-transform:uppercase;letter-spacing:0.05em;'}font-weight:700;color:${C.sand500};background:${C.sand100};border-bottom:1px solid ${C.sand200};${txtAlign}">${h}</th>`
  ).join('');

  let body;
  if (!rows.length) {
    body = `<tr><td colspan="${headers.length}" style="padding:16px 12px;font-size:12px;color:${C.sand500};text-align:center;font-style:italic;">${rtl ? `لا يوجد ${title} بعد.` : `No ${title.toLowerCase()} yet.`}</td></tr>`;
  } else {
    body = rows.map((row, ri) => {
      const bg = ri % 2 === 0 ? C.white : C.sand50;
      const tds = row.map((cell, ci) => {
        const hdr = headers[ci]?.toLowerCase() || '';
        const isStatus = hdr === 'status' || hdr === '\u0627\u0644\u062d\u0627\u0644\u0629';
        const content = isStatus && badgeMap && badgeMap.has(String(cell))
          ? badgeMap.get(String(cell))
          : cell;
        return `<td style="padding:9px 12px;font-size:11.5px;color:${C.sand950};border-bottom:1px solid ${C.sand200};vertical-align:middle;${txtAlign}">${content}</td>`;
      }).join('');
      return `<tr style="background:${bg};">${tds}</tr>`;
    }).join('');
  }

  const titleUnderlineStyle = rtl ? 'margin-right:0;margin-left:auto;' : '';

  return wrap(`
    <div style="margin-bottom:6px;">
      <div style="font-size:14px;font-weight:700;color:${C.primary700};${rtl ? '' : 'letter-spacing:-0.01em;'}">${title}</div>
      <div style="width:32px;height:2px;background:${C.signal500};border-radius:1px;margin-top:4px;${titleUnderlineStyle}"></div>
    </div>
    <table dir="${rtl ? 'rtl' : 'ltr'}" style="width:100%;border-collapse:collapse;border:1px solid ${C.sand200};border-radius:6px;overflow:hidden;">
      <thead><tr>${ths}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `, false, rtl);
}

/* ─── Section-based PDF renderer ─── */

async function captureSection(html) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
  el.innerHTML = html;
  document.body.appendChild(el);

  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 120));

  const canvas = await html2canvas(el.firstElementChild, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: C.white,
    logging: false,
  });

  document.body.removeChild(el);
  return canvas;
}

async function renderSectionsToPdf(sections, filename) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let curY = 0;
  const footerH = 12;

  for (let i = 0; i < sections.length; i++) {
    const { html, fullWidth } = sections[i];
    const canvas = await captureSection(html);

    const drawW = fullWidth ? PAGE_W : BODY_W;
    const drawX = fullWidth ? 0 : MARGIN;
    const drawH = (canvas.height * drawW) / canvas.width;

    // If this section won't fit on the current page and we're not at the top, start a new page
    if (curY > 0 && curY + drawH > PAGE_H - footerH) {
      doc.addPage();
      curY = MARGIN;
    }

    // If a single section is taller than one full page, slice it across pages
    if (drawH > PAGE_H - footerH - (curY === 0 ? 0 : MARGIN)) {
      const scaleX = canvas.width / drawW;
      let srcY = 0;

      while (srcY < canvas.height) {
        if (curY <= 0) curY = fullWidth ? 0 : MARGIN;
        const availH = PAGE_H - footerH - curY;
        const srcH = Math.min(availH * scaleX, canvas.height - srcY);
        const dH = srcH / scaleX;

        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = Math.ceil(srcH);
        slice.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

        doc.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', drawX, curY, drawW, dH);
        srcY += srcH;
        curY += dH;

        if (srcY < canvas.height) {
          doc.addPage();
          curY = MARGIN;
        }
      }
    } else {
      doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', drawX, curY, drawW, drawH);
      curY += drawH + 4; // 4mm gap between sections
    }
  }

  // Footer on every page
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(164, 152, 136);
    doc.text(`Zabatly  |  ${p} / ${pages}`, PAGE_W / 2, PAGE_H - 6, { align: 'center' });
  }

  doc.save(filename);
}

/* ─── Admin report ─── */

export async function exportAdminReport({ user, pending, platform, contactMessages, t }) {
  const stats = platform.stats || {};
  const rtl = /[\u0600-\u06FF]/.test(t('status'));
  const dateLoc = rtl ? 'ar-EG' : 'en-GB';

  const userHeaders = [t('user'), t('email'), t('role'), t('kyc'), t('joined')];
  const userRows = (platform.users || []).map((u) => [u.name || '\u2014', u.email || '\u2014', t(`roles.${u.role}`, u.role), u.kyc_status || 'unsubmitted', shortDate(u.createdAt, dateLoc)]);

  const bookingHeaders = [t('booking'), t('renter'), t('provider'), t('status'), t('total')];
  const bookingRows = (platform.bookings || []).map((b) => [b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : t('driverRequest'), b.renter?.name || t('unknown'), b.owner?.name || b.driver?.name || t('unknown'), t(`statuses.${b.status}`, b.status) || '\u2014', money(b.totalPrice)]);

  const fleetHeaders = [t('vehicle'), t('owner'), t('status'), t('kyc'), t('dailyPrice')];
  const fleetRows = (platform.vehicles || []).map((v) => [`${v.make || ''} ${v.model || ''}`.trim() || '\u2014', v.owner?.name || t('unknown'), v.isAvailable === false ? t('rented') : t('available'), v.kyc_status || 'unsubmitted', money(v.price_per_day)]);

  const reviewHeaders = [t('author'), t('rating'), t('target'), t('date')];
  const reviewRows = (platform.reviews || []).map((r) => [r.author?.name || t('unknown'), `${r.rating || 0}/5`, r.targetVehicle ? `${r.targetVehicle.make} ${r.targetVehicle.model}` : r.targetUser?.name || t('unknown'), shortDate(r.createdAt, dateLoc)]);

  const contactHeaders = [t('from'), t('subject'), t('email'), t('status'), t('received')];
  const contactRows = (contactMessages || []).map((m) => [m.name || '\u2014', m.subject || '\u2014', m.email || '\u2014', m.isRead ? t('read') : t('unread'), shortDate(m.createdAt, dateLoc)]);

  // Pre-render all badge images
  const allBadges = new Map([
    ...buildBadgeMap(bookingRows, bookingHeaders),
    ...buildBadgeMap(fleetRows, fleetHeaders),
    ...buildBadgeMap(contactRows, contactHeaders),
  ]);

  const sections = [
    { html: headerSection(rtl ? 'تقرير لوحة تحكم الأدمن' : 'Admin Dashboard Report', user?.name, rtl), fullWidth: true },
    { html: metricsSection([
      { label: t('totalQueue'), value: (pending.identity?.length || 0) + (pending.licenses?.length || 0) + (pending.vehicles?.length || 0), accent: true },
      { label: t('users'), value: stats.users?.total || 0 },
      { label: t('vehicles'), value: stats.vehicles?.total || 0 },
      { label: t('revenue'), value: money(stats.bookings?.revenue) },
    ], rtl), fullWidth: false },
    { html: tableSection(t('userManagement'), userHeaders, userRows, rtl, allBadges), fullWidth: false },
    { html: tableSection(t('bookings'), bookingHeaders, bookingRows, rtl, allBadges), fullWidth: false },
    { html: tableSection(t('fleetOverview'), fleetHeaders, fleetRows, rtl, allBadges), fullWidth: false },
    { html: tableSection(t('reviews'), reviewHeaders, reviewRows, rtl, allBadges), fullWidth: false },
    { html: tableSection(t('contactMessages'), contactHeaders, contactRows, rtl, allBadges), fullWidth: false },
  ];

  await renderSectionsToPdf(sections, `zabatly-admin-report-${fileDate()}.pdf`);
}

/* ─── Owner report ─── */

export async function exportOwnerReport({ user, vehicles, stats, groups, transactions, t, locale = 'en-GB' }) {
  const rtl = locale.startsWith('ar');

  const vHeaders = [t('common.vehicle'), t('common.status'), t('renter.dailyRate'), t('owner.bookings')];
  const vRows = vehicles.map((v) => [`${v.make || ''} ${v.model || ''}`.trim() || '\u2014', v.isActive === false ? t('status.disabled') : v.isAvailable === false ? t('status.rented') : t('status.available'), money(v.price_per_day), v.bookingCount || 0]);

  const bHeaders = [t('common.vehicle'), t('owner.renter'), t('owner.startDate'), t('owner.endDate'), t('common.status'), t('common.amount')];
  const bRows = groups.flat().map((b) => [`${b.vehicle?.make || ''} ${b.vehicle?.model || ''}`.trim() || '\u2014', b.renter?.name || t('common.user'), shortDate(b.startDate, locale), shortDate(b.endDate, locale), t(`status.${b.status}`, b.status) || '\u2014', money(b.ownerAmount)]);

  const tHeaders = [t('common.vehicle'), t('owner.renter'), t('owner.date'), t('common.amount')];
  const tRows = transactions.map((b) => [`${b.vehicle?.make || ''} ${b.vehicle?.model || ''}`.trim() || '\u2014', b.renter?.name || t('common.user'), shortDate(b.endDate, locale), money(b.ownerAmount)]);

  // Pre-render all badge images
  const badgeMap = new Map([...buildBadgeMap(vRows, vHeaders), ...buildBadgeMap(bRows, bHeaders)]);

  const sections = [
    { html: headerSection(rtl ? 'تقرير لوحة تحكم المالك' : 'Owner Dashboard Report', user?.name, rtl), fullWidth: true },
    { html: metricsSection([
      { label: t('owner.listed'), value: stats.listed },
      { label: t('owner.available'), value: stats.available, accent: true },
      { label: t('owner.activeRentals'), value: stats.active },
      { label: t('owner.revenue'), value: money(stats.revenue) },
    ], rtl), fullWidth: false },
    { html: tableSection(t('owner.myVehicles'), vHeaders, vRows, rtl, badgeMap), fullWidth: false },
    { html: tableSection(t('owner.bookings'), bHeaders, bRows, rtl, badgeMap), fullWidth: false },
    { html: tableSection(t('owner.transactionHistory'), tHeaders, tRows, rtl, badgeMap), fullWidth: false },
  ];

  await renderSectionsToPdf(sections, `zabatly-owner-report-${fileDate()}.pdf`);
}
