"use client"

import { useState, useMemo, useEffect, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { Calculator, DollarSign, Users, Receipt, Split, Share2, Plus, Minus, AlertCircle, ChevronLeft, ChevronRight, Download, Copy, Check, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import html2canvas from 'html2canvas'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import Image from 'next/image'

export default function SplitBillPage() {
  const [totalAmount, setTotalAmount] = useState('')
  const [numberOfPeople, setNumberOfPeople] = useState('')
  const [tip, setTip] = useState('15')
  const [isTipAmount, setIsTipAmount] = useState(false)
  const [venmoId, setVenmoId] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [isCustomSplit, setIsCustomSplit] = useState(false)
  const [customSplits, setCustomSplits] = useState<{ name: string; amount: string }[]>([
    { name: '', amount: '' }
  ])
  const [results, setResults] = useState<{
    subtotal: number;
    tipAmount: number;
    total: number;
    perPerson?: number;
    customAmounts?: { name: string; amount: number }[];
  } | null>(null)
  const [currentQRIndex, setCurrentQRIndex] = useState(0)
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [showDistributeButton, setShowDistributeButton] = useState(false)

  useEffect(() => {
    if (typeof navigator.share !== 'undefined') {
      console.log('Web Share API is supported')
    }
  }, [])

  const customSplitTotal = useMemo(() => {
    return customSplits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0)
  }, [customSplits])

  const remainingAmount = useMemo(() => {
    if (!totalAmount) return 0
    const total = parseFloat(totalAmount)
    return Math.max(0, total - customSplitTotal)
  }, [totalAmount, customSplitTotal])

  useEffect(() => {
    if (isCustomSplit && totalAmount && customSplits.length === 1 && !customSplits[0].amount) {
      setCustomSplits([{ name: customSplits[0].name, amount: totalAmount }])
    }
    const shouldShowDistribute = remainingAmount > 0 && remainingAmount < 1 && customSplits.some(split => parseFloat(split.amount) > 0)
    setShowDistributeButton(shouldShowDistribute)
  }, [isCustomSplit, totalAmount, customSplits, remainingAmount]);

  const handleAddPerson = () => {
    setCustomSplits([...customSplits, { name: '', amount: '' }])
  }

  const removePerson = (index: number) => {
    if (customSplits.length > 1) {
      const newSplits = customSplits.filter((_, i) => i !== index)
      setCustomSplits(newSplits)
    }
  }

  const updateCustomSplit = (index: number, amount: string) => {
    const newSplits = [...customSplits];
    newSplits[index].amount = amount;
    setCustomSplits(newSplits);
  };

  // Move the validation status check to a separate function
  const getOverallValidationStatus = () => {
    if (!totalAmount) return null
    
    const total = parseFloat(totalAmount)
    const currentTotal = customSplits.reduce((sum, split) => {
      const amount = parseFloat(split.amount) || 0
      return sum + amount
    }, 0)
    
    if (Math.abs(currentTotal - total) < 0.01) {
      return {
        status: 'success',
        message: 'Perfect split! All amounts add up to the total.'
      }
    }
    
    if (currentTotal > total) {
      return {
        status: 'error',
        message: `Total split amount exceeds the bill total by ${formatCurrency(currentTotal - total)}`
      }
    }
    
    if (currentTotal < total && currentTotal > 0) {
      return {
        status: 'warning',
        message: `Still need to allocate ${formatCurrency(total - currentTotal)}`
      }
    }
    
    return null
  }

  const calculateSplit = () => {
    setIsCalculating(true)
    const amount = parseFloat(totalAmount)
    const calculatedTipAmount = isTipAmount ? parseFloat(tip) : (amount * (parseInt(tip) / 100))
    const total = amount + calculatedTipAmount

    if (isCustomSplit) {
      // Validate total matches with a small tolerance for floating point errors
      const tolerance = 0.01
      const difference = Math.abs(customSplitTotal - parseFloat(totalAmount))
      
      if (difference > tolerance) {
        const remaining = parseFloat(totalAmount) - customSplitTotal
        alert(`The sum of individual amounts ${remaining > 0 ? 'is less than' : 'exceeds'} the total bill amount by ${formatCurrency(Math.abs(remaining))}. Please adjust the amounts to match the total.`)
        setIsCalculating(false)
        return
      }

      const customAmounts = customSplits.map(split => ({
        name: split.name || 'Anonymous',
        amount: (parseFloat(split.amount) || 0) + ((parseFloat(split.amount) || 0) * (parseInt(tip) / 100))
      }))

      setResults({
        subtotal: amount,
        tipAmount: calculatedTipAmount,
        total,
        customAmounts
      })
    } else {
      const people = parseInt(numberOfPeople)
      const perPerson = total / people

      setResults({
        subtotal: amount,
        tipAmount: calculatedTipAmount,
        total,
        perPerson
      })
    }
    setIsCalculating(false)
  }

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const generatePaymentData = (amount: number) => {
    if (!venmoId) return '';
    
    const note = encodeURIComponent('Bitevote bill payment')
    const venmoLink = `venmo://paycharge?txn=pay&recipients=${venmoId}&amount=${amount.toFixed(2)}&note=${note}`
    
    return venmoLink
  }

  const handleShare = async () => {
    if (!results) return;
    if (!venmoId.trim()) {
      alert('Please enter a Venmo ID to generate payment QR code');
      return;
    }
    setShowQRDialog(true);
  }

  const handleCustomSplitToggle = (checked: boolean) => {
    setIsCustomSplit(checked)
    if (checked && totalAmount) {
      // When enabling custom split, initialize with the total amount
      setCustomSplits([{ name: '', amount: totalAmount }])
    } else {
      setCustomSplits([{ name: '', amount: '' }])
    }
  }

  const downloadQRCode = async () => {
    if (!qrCodeRef.current) return;
    
    try {
      const canvas = await html2canvas(qrCodeRef.current);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'venmo-qr-code.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  const copyToClipboard = async (amount: number, name?: string) => {
    if (typeof navigator === 'undefined') return;
    
    const paymentText = `Pay ${formatCurrency(amount)} to @${venmoId}${name ? ` (${name})` : ''} via Venmo`
    const venmoLink = generatePaymentData(amount)
    const textToCopy = `${paymentText}\n\nOpen in Venmo app:\n${venmoLink}\n\nOr click this link on your phone to open Venmo:\nhttps://venmo.com/${venmoId}?txn=pay&amount=${amount.toFixed(2)}&note=${encodeURIComponent('Bitevote bill payment')}`
    
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const distributeRemainder = () => {
    if (remainingAmount <= 0) return

    const newSplits = [...customSplits]
    const validSplits = newSplits.filter(split => parseFloat(split.amount) > 0)
    
    if (validSplits.length === 0) return

    // Distribute remainder equally among participants with non-zero amounts
    const remainderPerPerson = (remainingAmount / validSplits.length).toFixed(2)
    
    newSplits.forEach((split, index) => {
      if (parseFloat(split.amount) > 0) {
        const currentAmount = parseFloat(split.amount)
        newSplits[index].amount = (currentAmount + parseFloat(remainderPerPerson)).toFixed(2)
      }
    })

    setCustomSplits(newSplits)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
                Split better with
              </h1>
              <Image 
                src="/venmo.png"
                alt="Venmo"
                width={32}
                height={32}
                className="mb-2"
              />
              {/* <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
                enmo
              </h1> */}
            </div>
            <p className="text-slate-400">
            Seamless Split: Add Venmo ID & Your Share!
            </p>
          </div>

          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="venmoId" className="text-white">Host&apos;s Venmo ID</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                  <Input
                    id="venmoId"
                    placeholder="username"
                    value={venmoId}
                    onChange={(e) => setVenmoId(e.target.value.replace('@', ''))}
                    className="pl-8 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">Bill Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="custom-split" className="text-white">Custom Split</Label>
                <Switch
                  id="custom-split"
                  checked={isCustomSplit}
                  onCheckedChange={handleCustomSplitToggle}
                />
              </div>

              {!isCustomSplit ? (
                <div className="space-y-2">
                  <Label htmlFor="people" className="text-white">Number of People</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="people"
                      type="number"
                      placeholder="2"
                      value={numberOfPeople}
                      onChange={(e) => setNumberOfPeople(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label className="text-white">Custom Amounts</Label>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Total Bill: {formatCurrency(parseFloat(totalAmount) || 0)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">
                        Sum: {formatCurrency(customSplitTotal)}
                      </span>
                      {remainingAmount !== 0 && (
                        <span className={`text-sm font-medium ${
                          remainingAmount > 0 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          ({remainingAmount > 0 ? '+' : ''}{formatCurrency(remainingAmount)})
                        </span>
                      )}
                    </div>
                  </div>

                  {getOverallValidationStatus() && (
                    <Alert 
                      variant={
                        getOverallValidationStatus()?.status === 'error' ? 'destructive' :
                        getOverallValidationStatus()?.status === 'warning' ? 'default' :
                        'default'
                      }
                      className={
                        getOverallValidationStatus()?.status === 'error' ? 'bg-red-900/50 border-red-500 text-white' :
                        getOverallValidationStatus()?.status === 'warning' ? 'bg-yellow-900/50 border-yellow-500 text-white' :
                        'bg-green-900/50 border-green-500 text-green-200'
                      }
                    >
                      {getOverallValidationStatus()?.status !== 'success' && (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription className="text-white">
                        {getOverallValidationStatus()?.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {showDistributeButton && (
                    <Button
                      onClick={distributeRemainder}
                      variant="outline"
                      size="sm"
                      className="w-full text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10"
                    >
                      Distribute {formatCurrency(remainingAmount)} equally
                    </Button>
                  )}

                  {customSplits.map((split, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        type="text"
                        placeholder="Enter name"
                        value={split.name}
                        onChange={(e) => {
                          const newSplits = [...customSplits];
                          newSplits[index].name = e.target.value;
                          setCustomSplits(newSplits);
                        }}
                        className="bg-slate-800 border-slate-700 text-white flex-1"
                      />
                      <div className="relative w-1/3">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={split.amount}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                              updateCustomSplit(index, value);
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value) {
                              const formattedValue = parseFloat(value).toFixed(2);
                              updateCustomSplit(index, formattedValue);
                            }
                          }}
                          className={`pl-10 bg-slate-800 border-slate-700 text-white ${
                            parseFloat(split.amount) > parseFloat(totalAmount) ? 'border-red-500' : ''
                          }`}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePerson(index)}
                        className="text-slate-400 hover:text-white"
                        disabled={customSplits.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    onClick={handleAddPerson}
                    variant="outline"
                    className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Person
                  </Button>

                  {remainingAmount > 0 && customSplitTotal > 0 && (
                    <p className="text-sm text-white">
                      Tip: Add another person or adjust amounts to match the total bill
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="tip" className="text-white">Tip {isTipAmount ? 'Amount' : 'Percentage'}</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="tip-type" className="text-sm text-slate-400">Amount</Label>
                    <Switch
                      id="tip-type"
                      checked={isTipAmount}
                      onCheckedChange={setIsTipAmount}
                    />
                  </div>
                </div>
                <div className="relative">
                  {isTipAmount ? (
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  ) : (
                    <>
                      <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                    </>
                  )}
                  <Input
                    id="tip"
                    type="number"
                    placeholder={isTipAmount ? "0.00" : "15"}
                    value={tip}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (!isTipAmount && /^\d+$/.test(value)) || (isTipAmount && /^\d*\.?\d{0,2}$/.test(value))) {
                        setTip(value);
                      }
                    }}
                    className={`${isTipAmount ? 'pl-10' : 'pl-10 pr-8'} bg-slate-800 border-slate-700 text-white`}
                  />
                </div>
              </div>

              <Button
                onClick={calculateSplit}
                disabled={!totalAmount || ((!numberOfPeople && !isCustomSplit) || (isCustomSplit && !customSplits.some(s => s.amount))) || isCalculating}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Split
              </Button>

              <AnimatePresence>
                {results && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-6 border-t border-slate-800"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Subtotal:</span>
                        <span className="text-white font-medium">{formatCurrency(results.subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Tip {isTipAmount ? '' : `(${tip}%)`}:</span>
                        <span className="text-white font-medium">{formatCurrency(results.tipAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total:</span>
                        <span className="text-white font-medium">{formatCurrency(results.total)}</span>
                      </div>
                      <div className="pt-4 border-t border-slate-800">
                        {!isCustomSplit ? (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Split className="w-4 h-4 text-pink-500" />
                              <span className="text-white font-medium">Each Person Pays:</span>
                            </div>
                            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                              {results.perPerson !== undefined ? formatCurrency(results.perPerson) : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Split className="w-4 h-4 text-pink-500" />
                              <span className="text-white font-medium">Individual Amounts:</span>
                            </div>
                            {results.customAmounts?.map((split, index) => (
                              <div key={index} className="flex justify-between items-center pl-6">
                                <span className="text-slate-400">{split.name}:</span>
                                <span className="text-white font-medium">{formatCurrency(split.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => handleShare()}
                        disabled={!venmoId.trim()}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 mt-4"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Payment Details
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </div>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800">
          <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQRDialog(false)}
              className="text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle className="text-white">Payment QR Code</DialogTitle>
            <DialogDescription className="text-slate-400">
              {isCustomSplit 
                ? "Scan or share this QR code to pay your share" 
                : "Scan or share this QR code to make the payment"}
            </DialogDescription>
          </DialogHeader>
          {isCustomSplit && results?.customAmounts && results.customAmounts.length > 0 ? (
            <div className="relative">
              <div className="space-y-4" ref={qrCodeRef}>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">
                    {results.customAmounts[currentQRIndex]?.name || 'Anonymous'}
                  </h3>
                  <p className="text-slate-400">
                    {formatCurrency(results.customAmounts[currentQRIndex]?.amount)}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG
                    value={generatePaymentData(results.customAmounts[currentQRIndex]?.amount || 0)}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              {results.customAmounts.length > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentQRIndex((prev) => (prev - 1 + results.customAmounts!.length) % results.customAmounts!.length)}
                    className="text-slate-400 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex space-x-2">
                    {results.customAmounts.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          index === currentQRIndex ? 'bg-white' : 'bg-slate-600'
                        }`}
                        onClick={() => setCurrentQRIndex(index)}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentQRIndex((prev) => (prev + 1) % results.customAmounts!.length)}
                    className="text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg" ref={qrCodeRef}>
                <QRCodeSVG
                  value={generatePaymentData(results?.perPerson || 0)}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-slate-400">Pay to: <span className="text-white font-medium">@{venmoId}</span></p>
                <p className="text-slate-400">Amount: <span className="text-white font-medium">{results ? formatCurrency(results.perPerson) : '$0.00'}</span></p>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
            <Button
              onClick={downloadQRCode}
              variant="outline"
              className="text-slate-400 hover:text-white w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Save QR Code
            </Button>
            {results && (
              <Button
                onClick={() => {
                  const amount = isCustomSplit && results.customAmounts && results.customAmounts.length > 0
                    ? results.customAmounts[currentQRIndex]?.amount
                    : results.perPerson;
                  const name = isCustomSplit && results.customAmounts && results.customAmounts.length > 0
                    ? results.customAmounts[currentQRIndex]?.name
                    : undefined;
                  copyToClipboard(amount || 0, name);
                }}
                variant="outline"
                className="text-slate-400 hover:text-white w-full sm:w-auto"
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 