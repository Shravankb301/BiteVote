"use client"

import { useState, useMemo, useEffect, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { Calculator, DollarSign, Users, Receipt, Split, Share2, QrCode, Plus, Minus, AlertCircle, ChevronLeft, ChevronRight, Download, Copy, Check } from 'lucide-react'
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

export default function SplitBillPage() {
  const [totalAmount, setTotalAmount] = useState('')
  const [numberOfPeople, setNumberOfPeople] = useState('')
  const [tip, setTip] = useState('15')
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

  useEffect(() => {
    if (isCustomSplit && totalAmount && customSplits.length === 1) {
      setCustomSplits([{ name: customSplits[0].name, amount: totalAmount }])
    }
  }, [isCustomSplit, totalAmount])

  const customSplitTotal = useMemo(() => {
    return customSplits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0)
  }, [customSplits])

  const remainingAmount = useMemo(() => {
    if (!totalAmount) return 0
    const total = parseFloat(totalAmount)
    return Math.max(0, total - customSplitTotal)
  }, [totalAmount, customSplitTotal])

  const isOverBudget = useMemo(() => {
    if (!totalAmount) return false
    return customSplitTotal > parseFloat(totalAmount)
  }, [totalAmount, customSplitTotal])

  const addPerson = () => {
    // Check if the first person has a valid amount
    const firstPersonAmount = parseFloat(customSplits[0].amount)
    if (isNaN(firstPersonAmount) || firstPersonAmount <= 0) {
      alert('Please enter an amount for the first person before adding more people')
      return
    }

    const newAmount = remainingAmount.toFixed(2)
    // Only add new person if there's remaining amount
    if (parseFloat(newAmount) <= 0) {
      alert('No remaining amount to split')
      return
    }

    setCustomSplits([
      ...customSplits.map(split => ({ ...split })),
      { name: '', amount: newAmount }
    ])
  }

  const removePerson = (index: number) => {
    if (customSplits.length > 1) {
      const newSplits = customSplits.filter((_, i) => i !== index)
      setCustomSplits(newSplits)
    }
  }

  const updateCustomSplit = (index: number, field: 'name' | 'amount', value: string) => {
    const newSplits = [...customSplits]
    
    if (field === 'amount') {
      // Allow empty string and initial decimal point
      if (value === '' || value === '.') {
        newSplits[index][field] = value
        setCustomSplits(newSplits)
        return
      }
      
      // Basic number validation
      const numValue = parseFloat(value)
      if (isNaN(numValue) || numValue < 0) return
      
      // Format to max 2 decimal places if there's a decimal point
      if (value.includes('.')) {
        const [whole, decimal] = value.split('.')
        if (decimal && decimal.length > 2) return
      }

      newSplits[index][field] = value
      setCustomSplits(newSplits)

      // Calculate if we should auto-add a new person
      const currentTotal = newSplits.reduce((sum, split) => {
        const amount = parseFloat(split.amount) || 0
        return sum + amount
      }, 0)

      const billTotal = parseFloat(totalAmount || '0')
      const remaining = billTotal - currentTotal

      // If there's still amount to split and this is a valid entry, add a new person
      if (remaining > 0 && !isNaN(numValue) && numValue > 0) {
        // Add new person with remaining amount
        setTimeout(() => {
          setCustomSplits([
            ...newSplits,
            { name: '', amount: remaining.toFixed(2) }
          ])
        }, 100) // Small delay to ensure smooth UI update
      }
    } else {
      newSplits[index][field] = value
      setCustomSplits(newSplits)
    }
  }

  const calculateSplit = () => {
    setIsCalculating(true)
    const amount = parseFloat(totalAmount)
    const tipAmount = (amount * (parseInt(tip) / 100))
    const total = amount + tipAmount

    if (isCustomSplit) {
      // Validate total matches
      if (Math.abs(customSplitTotal - parseFloat(totalAmount)) > 0.01) {
        alert('The sum of individual amounts must equal the total bill amount')
        setIsCalculating(false)
        return
      }

      const customAmounts = customSplits.map(split => ({
        name: split.name || 'Anonymous',
        amount: (parseFloat(split.amount) || 0) + ((parseFloat(split.amount) || 0) * (parseInt(tip) / 100))
      }))

      setResults({
        subtotal: amount,
        tipAmount,
        total,
        customAmounts
      })
    } else {
      const people = parseInt(numberOfPeople)
      const perPerson = total / people

      setResults({
        subtotal: amount,
        tipAmount,
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
    
    const note = encodeURIComponent('Split bill payment')
    const venmoLink = `venmo://paycharge?txn=pay&recipients=${venmoId}&amount=${amount.toFixed(2)}&note=${note}`
    
    return venmoLink
  }

  const handleShare = async () => {
    if (!results) return;
    if (!venmoId.trim()) {
      alert('Please enter a Venmo ID to generate payment QR code');
      return;
    }

    if (navigator.share) {
      try {
        const shareText = isCustomSplit 
          ? `Split bill payment details for ${results.customAmounts?.[0]?.name}. Amount: ${formatCurrency(results.customAmounts?.[0]?.amount)}. Pay to Venmo: ${venmoId}`
          : `Your share is ${formatCurrency(results.perPerson)}. Pay to Venmo: ${venmoId}`;

        await navigator.share({
          title: 'Split Bill Payment',
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
        setShowQRDialog(true);
      }
    } else {
      setShowQRDialog(true);
    }
  }

  const handleCustomSplitToggle = (checked: boolean) => {
    setIsCustomSplit(checked)
    if (checked && totalAmount) {
      // When enabling custom split, set first person with empty values
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
    const paymentText = `Pay ${formatCurrency(amount)} to @${venmoId}${name ? ` (${name})` : ''} via Venmo`
    const venmoLink = generatePaymentData(amount)
    const textToCopy = `${paymentText}\n\nOpen in Venmo app:\n${venmoLink}\n\nOr click this link on your phone to open Venmo:\nhttps://venmo.com/${venmoId}?txn=pay&amount=${amount.toFixed(2)}&note=${encodeURIComponent('Split bill payment')}`
    
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
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
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
              Split the Bill
            </h1>
            <p className="text-slate-400">
              Calculate how much each person owes
            </p>
          </div>

          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="venmoId" className="text-white">Host's Venmo ID</Label>
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
                    <span className="text-sm text-slate-400">
                      Remaining: {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                  
                  {isOverBudget && (
                    <Alert variant="destructive" className="bg-red-900/50 border-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Total split amount exceeds the bill total
                      </AlertDescription>
                    </Alert>
                  )}

                  {remainingAmount === 0 && !isOverBudget && customSplitTotal > 0 && (
                    <Alert className="bg-green-900/50 border-green-500 text-green-200">
                      <AlertDescription>
                        Perfect split! All amounts add up to the total.
                      </AlertDescription>
                    </Alert>
                  )}

                  {customSplits.map((split, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        placeholder="Name"
                        value={split.name}
                        onChange={(e) => updateCustomSplit(index, 'name', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white w-[70%]"
                      />
                      <div className="relative w-[30%]">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*[.]?[0-9]*"
                          placeholder="0.00"
                          value={split.amount}
                          onChange={(e) => updateCustomSplit(index, 'amount', e.target.value)}
                          className={`pl-10 bg-slate-800 border-slate-700 text-white text-lg ${
                            parseFloat(split.amount) > remainingAmount + parseFloat(split.amount) 
                              ? 'border-red-500' 
                              : ''
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
                    onClick={addPerson}
                    variant="outline"
                    className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white"
                    disabled={remainingAmount === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Person
                  </Button>

                  {remainingAmount > 0 && customSplitTotal > 0 && (
                    <p className="text-sm text-slate-400">
                      Tip: Add another person or adjust amounts to match the total bill
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="tip" className="text-white">Tip Percentage</Label>
                <div className="relative">
                  <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="tip"
                    type="number"
                    placeholder="15"
                    value={tip}
                    onChange={(e) => setTip(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
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
                        <span className="text-slate-400">Tip ({tip}%):</span>
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
          <DialogHeader>
            <DialogTitle className="text-white">Venmo Payment QR Code</DialogTitle>
            <DialogDescription className="text-slate-400">
              {isCustomSplit ? "Scan the QR code for your payment" : "Scan this QR code to pay via Venmo"}
            </DialogDescription>
          </DialogHeader>
          {isCustomSplit && results?.customAmounts ? (
            <div className="relative">
              <div className="space-y-6" ref={qrCodeRef}>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">
                    {results.customAmounts[currentQRIndex].name}
                  </h3>
                  <p className="text-slate-400">
                    {formatCurrency(results.customAmounts[currentQRIndex].amount)}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG
                    value={generatePaymentData(results.customAmounts[currentQRIndex].amount)}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentQRIndex((prev) => (prev - 1 + results.customAmounts!.length) % results.customAmounts!.length)}
                  disabled={results.customAmounts.length <= 1}
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
                  disabled={results.customAmounts.length <= 1}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-center gap-2 mt-4">
                <Button
                  onClick={downloadQRCode}
                  variant="outline"
                  className="text-slate-400 hover:text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => copyToClipboard(
                    isCustomSplit ? results!.customAmounts![currentQRIndex].amount : results!.perPerson!,
                    isCustomSplit ? results!.customAmounts![currentQRIndex].name : undefined
                  )}
                  variant="outline"
                  className="text-slate-400 hover:text-white"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                {navigator.share && (
                  <Button
                    onClick={() => {
                      const amount = isCustomSplit ? results!.customAmounts![currentQRIndex].amount : results!.perPerson!
                      const name = isCustomSplit ? results!.customAmounts![currentQRIndex].name : undefined
                      const text = `Pay ${formatCurrency(amount)} to @${venmoId}${name ? ` (${name})` : ''} via Venmo`
                      navigator.share({
                        title: 'Split Bill Payment',
                        text,
                        url: window.location.href
                      })
                    }}
                    variant="outline"
                    className="text-slate-400 hover:text-white"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                )}
              </div>
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
              <div className="text-center text-slate-400">
                <p>Pay to: @{venmoId}</p>
                <p>Amount: {results ? formatCurrency(results.perPerson) : '$0.00'}</p>
                <p className="text-sm">Generated on {new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex justify-center gap-2">
                <Button
                  onClick={downloadQRCode}
                  variant="outline"
                  className="text-slate-400 hover:text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => copyToClipboard(results?.perPerson || 0)}
                  variant="outline"
                  className="text-slate-400 hover:text-white"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                {navigator.share && (
                  <Button
                    onClick={() => {
                      const text = `Pay ${formatCurrency(results?.perPerson)} to @${venmoId} via Venmo`
                      navigator.share({
                        title: 'Split Bill Payment',
                        text,
                        url: window.location.href
                      })
                    }}
                    variant="outline"
                    className="text-slate-400 hover:text-white"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 