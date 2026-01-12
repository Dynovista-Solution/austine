import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminContext.jsx'
import { ArrowLeftIcon, ArrowDownTrayIcon, CubeIcon } from '@heroicons/react/24/outline'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function safeNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function buildInventoryRows(products) {
  const rows = []

  for (const product of products) {
    const productId = product.id || product._id || ''
    const productName = product.name || ''
    const sku = product.sku || '' 
    const category = product.category || ''

    const inventory = Array.isArray(product.inventory) ? product.inventory : []

    if (inventory.length === 0) {
      rows.push({
        productId,
        productName,
        sku,
        category,
        color: '-',
        size: '-',
        quantity: 0
      })
      continue
    }

    for (const item of inventory) {
      rows.push({
        productId,
        productName,
        sku,
        category,
        color: item?.color || '-',
        size: item?.size || '-',
        quantity: safeNumber(item?.quantity)
      })
    }
  }

  return rows
}

export default function AdminTotalProductsInventory() {
  const navigate = useNavigate()
  const { products } = useAdmin()
  const [downloading, setDownloading] = useState(false)

  const activeProducts = useMemo(() => {
    const arr = Array.isArray(products) ? products : []
    return arr.filter(p => p?.isActive !== false)
  }, [products])

  const inventoryRows = useMemo(() => buildInventoryRows(activeProducts), [activeProducts])

  const totalStock = useMemo(() => inventoryRows.reduce((sum, r) => sum + safeNumber(r.quantity), 0), [inventoryRows])

  const totalProducts = activeProducts.length

  const totalInventoryEntries = useMemo(() => {
    // Exclude placeholder '-' rows from the count
    return inventoryRows.filter(r => r.color !== '-' || r.size !== '-').length
  }, [inventoryRows])

  const downloadPdf = async () => {
    try {
      setDownloading(true)

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

      const title = 'Total Products Inventory'
      const generatedAt = new Date().toLocaleString()

      doc.setFontSize(16)
      doc.text(title, 40, 40)

      doc.setFontSize(10)
      doc.text(`Generated: ${generatedAt}`, 40, 58)
      doc.text(`Products: ${totalProducts}  |  Inventory entries: ${totalInventoryEntries}  |  Total stock: ${totalStock}`, 40, 74)

      const body = inventoryRows.map(r => [
        r.productName,
        r.sku,
        r.category,
        r.color,
        r.size,
        String(safeNumber(r.quantity))
      ])

      autoTable(doc, {
        startY: 90,
        head: [[ 'Product', 'SKU', 'Category', 'Color', 'Size', 'Qty' ]],
        body,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 220 },
          1: { cellWidth: 90 },
          2: { cellWidth: 110 },
          3: { cellWidth: 90 },
          4: { cellWidth: 70 },
          5: { cellWidth: 50, halign: 'right' }
        }
      })

      doc.save('total-products-inventory.pdf')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Products
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Total Products Inventory</h1>
              <p className="mt-2 text-sm text-gray-600">View inventory across all products and download as PDF.</p>
            </div>

            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloading}
              className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-60"
              title="Download PDF"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              {downloading ? 'Preparing…' : 'Download PDF'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Active Products</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Inventory Entries</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalInventoryEntries}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Total Stock</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalStock}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {inventoryRows.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CubeIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-sm text-gray-500">There are no active products to display.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryRows.map((row, idx) => {
                    const qty = safeNumber(row.quantity)
                    const isOutOfStock = qty === 0
                    const isLowStock = qty > 0 && qty <= 5

                    return (
                      <tr key={`${row.productId}-${row.color}-${row.size}-${idx}`} className={isOutOfStock ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.productName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.sku || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.category || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{row.color}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.size}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={`font-semibold ${
                            isOutOfStock ? 'text-red-700' : isLowStock ? 'text-orange-700' : 'text-green-700'
                          }`}>
                            {qty}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
