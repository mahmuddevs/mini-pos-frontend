import { useState, useEffect } from "react"
import { useGetQuery } from "../../hooks/useGetQuery"
import { useQueryMutation } from "../../hooks/useQueryMutation"
import Button from "../../components/common/button"
import Modal from "../../components/common/modal"
import {
  PrinterIcon,
  WarningCircleIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { useAppSelector } from "../../store/store"
import { invalidateQuery } from "../../utils/query-client"
import { handlePrintReceipt } from "../../utils/print-receipt"
import type { ProductItem, GetProductsResponse } from "../../types/product-types"
import type { CartItem, SaleDoc } from "../../types/sales-types"
import POSCatalog from "../../components/root/pos-catalog"
import POSCart from "../../components/root/pos-cart"


export default function CreateSale() {
  const user = useAppSelector((state) => state.auth.user)
  const userPermissionNames = user?.permissions?.map((p) => p.name

  ) ?? []
  const canCreateSale = userPermissionNames.includes("sales.create")

  // Catalog Filters State
  const [searchVal, setSearchVal] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [page, setPage] = useState(1)

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [paidAmountInput, setPaidAmountInput] = useState<string>("")

  // Checkout Receipt Modal
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [completedSale, setCompletedSale] = useState<SaleDoc | null>(null)

  // Debounce search query changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal)
      setPage(1)
    }, 350)
    return () => clearTimeout(handler)
  }, [searchVal])

  // Reset page when category changes
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    setPage(1)
  }

  // Fetch Products
  const { data, isLoading } = useGetQuery<GetProductsResponse>({
    url: "/products",
    isPrivate: true,
    queryParams: {
      page,
      limit: 9, // POS friendly layout grid (3x3)
      search: debouncedSearch || undefined,
      category: selectedCategory === "All" ? undefined : selectedCategory,
    },
    refetchOnMount: "always",
    keys: [page, debouncedSearch, selectedCategory],
    enabled: canCreateSale,
  })

  // POS Create Sale Mutation
  const { mutate: completeSale, isPending: isSubmitting } = useQueryMutation<
    SaleDoc,
    Error,
    { products: { product: string; quantity: number }[]; paidAmount: number }
  >({
    url: "/sales",
    method: "POST",
    isPrivate: true,
    mutationOptions: {
      onSuccess: (resData) => {
        toast.success("Sale processed successfully")
        setCompletedSale(resData)
        setIsReceiptOpen(true)
        setCart([])
        setPaidAmountInput("")
        invalidateQuery("/products")
        invalidateQuery("/sales")
      },
      onError: (error) => {
        toast.error(error.message || "Failed to process sale transaction.")
      },
    },
  })

  // Cart Operations
  const addToCart = (product: ProductItem) => {
    if (product.stockQuantity <= 0) {
      toast.error(`"${product.name}" is out of stock.`)
      return
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id)
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast.error(`Cannot exceed stock limit (${product.stockQuantity} available).`)
          return prev
        }
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateCartQty = (productId: string, qty: number, stockLimit: number) => {
    if (qty > stockLimit) {
      toast.error(`Cannot exceed stock limit (${stockLimit} available).`)
      qty = stockLimit
    }

    if (qty < 1) {
      removeFromCart(productId)
      return
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product._id === productId ? { ...item, quantity: qty } : item
      )
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId))
  }

  // Calculations
  const paidAmount = paidAmountInput === "" ? 0 : parseFloat(paidAmountInput) || 0

  // Submit Handler
  const handleCheckout = (e: React.SubmitEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      toast.error("Cart is empty.")
      return
    }

    const payload = {
      products: cart.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      })),
      paidAmount,
    }

    completeSale(payload)
  }


  // Denied access check
  if (!canCreateSale) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-background-card rounded-2xl border border-border text-center max-w-md mx-auto mt-12 shadow-sm animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-500 mb-4">
          <WarningCircleIcon size={32} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-secondary text-sm mt-2 leading-relaxed">
          You do not have permission to process sales transactions. Please contact your administrator to request access.
        </p>
      </div>
    )
  }

  const productsList = data?.products || []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Create Sale</h1>
          <p className="text-xs md:text-sm text-secondary mt-1">Select items to build a transaction and process checkout.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left pane: Products Catalog */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <POSCatalog
            searchVal={searchVal}
            setSearchVal={setSearchVal}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            page={page}
            onPageChange={setPage}
            products={productsList}
            meta={meta}
            isLoading={isLoading}
            cart={cart}
            onAddToCart={addToCart}
          />
        </div>

        {/* Right pane: Cart panel */}
        <div className="xl:col-span-5">
          <POSCart
            cart={cart}
            onClearCart={() => setCart([])}
            onUpdateQty={updateCartQty}
            onRemoveItem={removeFromCart}
            paidAmountInput={paidAmountInput}
            setPaidAmountInput={setPaidAmountInput}
            isSubmitting={isSubmitting}
            onSubmit={handleCheckout}
          />
        </div>
      </div>

      {/* Checkout Receipt Dialog */}
      <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} className="max-w-md">
        {completedSale && (
          <div className="flex flex-col flex-1 overflow-hidden select-none">
            <Modal.Header title="Sales Receipt Generated" onClose={() => setIsReceiptOpen(false)} />

            <Modal.Body className="overflow-y-auto py-6 bg-slate-50 dark:bg-slate-950/40 p-5 flex flex-col justify-center items-center">
              {/* Receipt mockup card */}
              <div className="w-full max-w-[320px] bg-white text-slate-900 border border-slate-200 rounded-xl shadow-md p-5 font-mono text-[11px] leading-relaxed relative overflow-hidden">
                {/* Visual design elements for receipt paper */}
                <div className="absolute top-0 inset-s-0 inset-e-0 h-1 bg-linear-to-r from-primary to-indigo-500 opacity-20" />

                <div className="text-center">
                  <h3 className="text-sm font-extrabold tracking-tight uppercase">iCLASSIC IT ERP</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Custom POS Transaction Terminal</p>
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                <div className="space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span>Invoice ID:</span>
                    <span className="font-bold text-slate-900 font-sans">{completedSale.invoiceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(completedSale.createdAt).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operator:</span>
                    <span>
                      {user ? `${user.firstName} ${user.lastName}`.trim() : "Cashier"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Items */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="pb-1 font-bold">Item</th>
                      <th className="pb-1 font-bold text-center">Qty</th>
                      <th className="pb-1 font-bold text-right">Price</th>
                      <th className="pb-1 font-bold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedSale.products.map((item, idx) => (
                      <tr key={idx} className="text-slate-800">
                        <td className="py-1 max-w-30 truncate">
                          {item.product?.name || "Product"}</td>
                        <td className="py-1 text-center">{item.quantity}</td>
                        <td className="py-1 text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-1 text-right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {/* Totals */}
                <table className="w-full text-slate-700">
                  <tbody>
                    <tr className="text-slate-900 font-bold font-sans">
                      <td className="py-0.5">Grand Total:</td>
                      <td className="py-0.5 text-right text-base">${completedSale.grandTotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Paid Amount:</td>
                      <td className="py-0.5 text-right font-semibold text-green-600">${completedSale.paidAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Change Given:</td>
                      <td className="py-0.5 text-right">${completedSale.changeAmount.toFixed(2)}</td>
                    </tr>
                    {completedSale.dueAmount > 0 && (
                      <tr className="text-red-600 font-bold">
                        <td className="py-0.5">Due Amount:</td>
                        <td className="py-0.5 text-right">${completedSale.dueAmount.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-slate-300 my-3" />

                <div className="text-center text-slate-500 mt-2">
                  <p className="font-semibold text-slate-700">Thank you for your business!</p>
                  <p className="text-[9px] mt-1">iClassic IT ERP. All rights reserved.</p>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer className="flex gap-3 justify-end border-t border-border">
              <Button type="secondary" onClick={() => setIsReceiptOpen(false)} className="flex items-center gap-1.5">
                <CheckCircleIcon size={16} />
                New Sale
              </Button>
              <Button
                onClick={() =>
                  handlePrintReceipt(
                    completedSale,
                    user ? `${user.firstName} ${user.lastName}`.trim() : "Cashier"
                  )
                }
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700!"
              >
                <PrinterIcon size={16} />
                Print Receipt
              </Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>
    </div>
  )
}