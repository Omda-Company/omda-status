import ExcelJS from 'exceljs'
import { getStatus } from '@/lib/data'
import { RECURRING } from '@/lib/format'

// ملف Excel بكل حسابات المشروع (للإدارة المالية). مقفول بالـ middleware زي باقي اللوحة.
// الأرقام معادلات مش قيم ثابتة: المنصرف = الدولار × سعر الصرف، والرصيد بيتراكم سطر بسطر.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FONT = 'Arial'
const NAVY = 'FF1F4E78'
const thin = { style: 'thin' as const, color: { argb: 'FF999999' } }
const BORDER = { top: thin, left: thin, bottom: thin, right: thin }
const EGP = '#,##0;(#,##0);"-"'
const USD = '"$"#,##0;("$"#,##0);"-"'

type Row = { date: string; item: string; detail: string; kind: string; usd?: number; rate?: number; outEgp?: number; inEgp?: number }

export async function GET() {
  const { payments, reimbursements, meta } = await getStatus()

  // الوارد قبل المنصرف في نفس اليوم، زي دفتر الخزينة
  const rows: Row[] = [
    ...reimbursements.map((r) => ({ date: r.date, item: r.note ? `${r.note}` : 'دفعة سداد', detail: `من ${r.from}`, kind: 'وارد', inEgp: r.egp, o: 0 })),
    ...payments.map((p) => ({
      date: p.date,
      item: p.item,
      detail: p.detail ?? '',
      kind: RECURRING[p.recurring],
      usd: p.usd,
      rate: p.egp == null && p.usd != null ? p.rate : undefined,
      outEgp: p.egp ?? undefined,
      o: 1,
    })),
  ]
    .map((r, i) => ({ ...r, i }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.o - b.o || a.i - b.i)

  const wb = new ExcelJS.Workbook()
  wb.creator = meta.preparedBy
  const ws = wb.addWorksheet('حسابات المشروع', { views: [{ rightToLeft: true, state: 'frozen', ySplit: 4 }] })
  ws.columns = [12, 32, 30, 12, 11, 12, 14, 14, 14].map((width) => ({ width }))

  ws.mergeCells('A1:I1')
  ws.getCell('A1').value = `حسابات مشروع الذكاء الاصطناعي — ${meta.company}`
  ws.getCell('A1').font = { name: FONT, bold: true, size: 14, color: { argb: NAVY } }
  ws.mergeCells('A2:I2')
  ws.getCell('A2').value = `إعداد: ${meta.preparedBy} · تاريخ التنزيل: ${new Date().toISOString().slice(0, 10)}`
  ws.getCell('A2').font = { name: FONT, size: 9, color: { argb: 'FF666666' } }

  const head = ['التاريخ', 'البيان', 'التفاصيل', 'النوع', 'بالدولار', 'سعر الصرف', 'منصرف (ج.م)', 'وارد (ج.م)', 'الرصيد (ج.م)']
  const h = ws.getRow(4)
  head.forEach((t, i) => {
    const c = h.getCell(i + 1)
    c.value = t
    c.font = { name: FONT, bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
    c.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  const first = 5
  ws.getCell(`B${first}`).value = 'رصيد أول المدة'
  ws.getCell(`I${first}`).value = 0
  rows.forEach((r, k) => {
    const n = first + 1 + k
    const row = ws.getRow(n)
    row.getCell(1).value = new Date(r.date + 'T00:00:00Z')
    row.getCell(2).value = r.item
    row.getCell(3).value = r.detail
    row.getCell(4).value = r.kind
    if (r.usd != null) row.getCell(5).value = r.usd
    if (r.rate != null) row.getCell(6).value = r.rate
    if (r.outEgp != null) row.getCell(7).value = r.outEgp
    else if (r.usd != null && r.rate != null) row.getCell(7).value = { formula: `E${n}*F${n}` }
    if (r.inEgp != null) row.getCell(8).value = r.inEgp
    row.getCell(9).value = { formula: `I${n - 1}+G${n}-H${n}` }
  })
  const last = first + rows.length
  const t = last + 1
  const tot = ws.getRow(t)
  tot.getCell(2).value = 'الإجمالي'
  tot.getCell(5).value = { formula: `SUM(E${first}:E${last})` }
  tot.getCell(7).value = { formula: `SUM(G${first}:G${last})` }
  tot.getCell(8).value = { formula: `SUM(H${first}:H${last})` }
  tot.getCell(9).value = { formula: `I${last}` }

  for (let n = first; n <= t; n++) {
    const row = ws.getRow(n)
    for (let c = 1; c <= 9; c++) {
      const cell = row.getCell(c)
      cell.border = BORDER
      cell.font = { name: FONT, bold: n === t }
      if (n === t) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } }
      if (c === 1) cell.numFmt = 'dd/mm/yyyy'
      if (c === 5) cell.numFmt = USD
      if (c === 6) cell.numFmt = 'General'
      if (c >= 7) cell.numFmt = EGP
      if (c !== 2 && c !== 3) cell.alignment = { horizontal: 'center' }
    }
  }

  const notes = [
    'المنصرف = المبلغ بالدولار × سعر الصرف المسجل وقت الشراء، والبنود المدفوعة بالجنيه بقيمتها الفعلية.',
    'الرصيد = الرصيد السابق + المنصرف − الوارد. الرصيد الموجب مبلغ مستحق السداد، والسالب رصيد لم يُصرف بعد.',
  ]
  notes.forEach((txt, i) => {
    const n = t + 2 + i
    ws.mergeCells(`A${n}:I${n}`)
    ws.getCell(`A${n}`).value = txt
    ws.getCell(`A${n}`).font = { name: FONT, size: 9, italic: true, color: { argb: 'FF666666' } }
  })

  const buf = await wb.xlsx.writeBuffer()
  const name = `حسابات-مشروع-AI-${new Date().toISOString().slice(0, 10)}.xlsx`
  return new Response(buf as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="expenses.xlsx"; filename*=UTF-8''${encodeURIComponent(name)}`,
      'Cache-Control': 'no-store',
    },
  })
}
