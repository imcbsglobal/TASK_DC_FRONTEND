import { useEffect, useState } from 'react'
import clientApi from '../api/clientApi'
import { useClientAuth } from '../auth/ClientAuthContext'

const PAGE_SIZE = 50

const money = (v) =>
  Number(v ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const qtyFmt = (v) => Number(v ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 4 })
const dash = (v) => (v === null || v === undefined || v === '' ? '-' : v)
const fmtDate = (d) => {
  if (!d) return '-'
  const [y, m, day] = d.split('-')
  return `${day}-${m}-${y}`
}
const taxTotal = (i) => Number(i.cgst_amount) + Number(i.sgst_amount) + Number(i.igst_amount)

const field =
  'rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

export default function Dashboard() {
  const { user, logout } = useClientAuth()
  const [invoices, setInvoices] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewing, setViewing] = useState(null)

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    clientApi
      .get('/my-invoices/', {
        params: {
          page,
          search: query || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      })
      .then(({ data }) => {
        if (cancelled) return
        setInvoices(data.results)
        setCount(data.count)
      })
      .catch((err) => {
        if (cancelled) return
        const d = err.response?.data
        setError(d?.detail || (d && JSON.stringify(d)) || 'Could not load invoices.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [page, query, dateFrom, dateTo])

  const hasFilters = search || dateFrom || dateTo
  const clearFilters = () => {
    setSearch(''); setQuery(''); setDateFrom(''); setDateTo(''); setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="w-full px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
            <p className="text-xs text-slate-500">Client {user?.client_id}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">
              Signed in as <b>{user?.full_name || user?.username}</b>
            </span>
            <button onClick={logout} className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-6 py-6 space-y-4">
        <h2 className="font-medium text-slate-700">Uploaded invoices</h2>

        {/* filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-64">
            <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
            <input
              className={`${field} w-full`}
              placeholder="Invoice no, company, GSTIN, address, phone..."
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Invoice date from</label>
            <input type="date" className={field} value={dateFrom} max={dateTo || undefined}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">to</label>
            <input type="date" className={field} value={dateTo} min={dateFrom || undefined}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }} />
          </div>
          {hasFilters && (
            <button onClick={clearFilters}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">
              Clear
            </button>
          )}
        </div>

        {error && <div className="rounded bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

        {/* table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3">Invoice no.</th>
                <th className="px-4 py-3">Invoice date</th>
                <th className="px-4 py-3">Due date</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Taxable</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan="12" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
              )}
              {!loading && invoices.length === 0 && (
                <tr>
                  <td colSpan="12" className="px-4 py-6 text-center text-slate-400">
                    {hasFilters ? 'No invoices match your filters.' : 'No invoices uploaded yet.'}
                  </td>
                </tr>
              )}
              {!loading && invoices.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">
                    {i.invoice_number}
                    {i.warnings?.length > 0 && (
                      <span title={i.warnings.join('\n')}
                        className="ml-2 rounded bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 cursor-help">
                        Check
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{fmtDate(i.invoice_date)}</td>
                  <td className="px-4 py-3">{fmtDate(i.due_date)}</td>
                  <td className="px-4 py-3">{i.company_name}</td>
                  <td className="px-4 py-3">{i.gstin}</td>
                  <td className="px-4 py-3">{dash(i.phone)}</td>
                  <td className="px-4 py-3 capitalize">{i.entry_type}</td>
                  <td className="px-4 py-3 text-right">{money(i.taxable_amount)}</td>
                  <td className="px-4 py-3 text-right">{money(taxTotal(i))}</td>
                  <td className="px-4 py-3 text-right font-medium">{money(i.total_amount)}</td>
                  <td className="px-4 py-3 text-right">{i.items?.length ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setViewing(i)} className="text-indigo-600 hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{count} invoice{count === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="rounded border border-slate-300 bg-white px-3 py-1 disabled:opacity-40">Prev</button>
            <span>Page {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
              className="rounded border border-slate-300 bg-white px-3 py-1 disabled:opacity-40">Next</button>
          </div>
        </div>
      </main>

      {viewing && <InvoiceModal invoice={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

function Info({ label, children }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm text-slate-800 break-words">{children}</div>
    </div>
  )
}

const ITEM_COLUMNS = [
  ['#', null],
  ['Item name', 'item_name'],
  ['HSN', 'hsn_code'],
  ['Qty', 'qty', 'qty'],
  ['Rate', 'rate', 'money'],
  ['GST %', 'gst_percent', 'money'],
  ['GST amt', 'gst_amount', 'money'],
  ['Disc %', 'discount_percent', 'money'],
  ['Disc amt', 'discount_amount', 'money'],
  ['MRP', 'mrp', 'money'],
  ['Barcode', 'barcode'],
  ['MFD', 'mfd'],
  ['EXP', 'exp'],
  ['Company', 'company'],
  ['Sales price', 'sales_price', 'money'],
  ['Amount', 'amount', 'money'],
]

function InvoiceModal({ invoice: inv, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const cell = (item, key, kind) => {
    const v = item[key]
    if (v === null || v === undefined || v === '') return '-'
    if (kind === 'money') return money(v)
    if (kind === 'qty') return qtyFmt(v)
    return v
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-10" onClick={onClose}>
      <div
        className="w-full max-w-[96vw] max-h-[94vh] bg-white rounded-xl shadow-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Invoice {inv.invoice_number}</h2>
            <p className="text-xs text-slate-500">Uploaded {new Date(inv.created_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-6">
          {inv.warnings?.length > 0 && (
            <div className="rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 space-y-1">
              {inv.warnings.map((w, idx) => <div key={idx}>{w}</div>)}
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Header</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Info label="Company">{inv.company_name}</Info>
              <Info label="GSTIN">{inv.gstin}</Info>
              <Info label="Phone">{dash(inv.phone)}</Info>
              <Info label="Entry type"><span className="capitalize">{inv.entry_type}</span></Info>
              <Info label="Address 1">{dash(inv.address1)}</Info>
              <Info label="Address 2">{dash(inv.address2)}</Info>
              <Info label="Invoice number">{inv.invoice_number}</Info>
              <Info label="PO number">{dash(inv.po_number)}</Info>
              <Info label="Invoice date">{fmtDate(inv.invoice_date)}</Info>
              <Info label="Due date">{fmtDate(inv.due_date)}</Info>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Amounts</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Info label="Taxable">{money(inv.taxable_amount)}</Info>
              <Info label="CGST">{money(inv.cgst_amount)}</Info>
              <Info label="SGST">{money(inv.sgst_amount)}</Info>
              <Info label="IGST">{money(inv.igst_amount)}</Info>
              <Info label="Round off">{money(inv.round_off)}</Info>
              <Info label="Total"><b>{money(inv.total_amount)}</b></Info>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Items ({inv.items?.length ?? 0})
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 text-left">
                  <tr>
                    {ITEM_COLUMNS.map(([label, , kind]) => (
                      <th key={label}
                        className={`px-3 py-2 ${kind ? 'text-right' : ''}`}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(inv.items || []).map((it, idx) => (
                    <tr key={it.id ?? idx} className="hover:bg-slate-50">
                      {ITEM_COLUMNS.map(([label, key, kind]) => (
                        <td key={label} className={`px-3 py-2 ${kind ? 'text-right' : ''}`}>
                          {key ? cell(it, key, kind) : idx + 1}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}