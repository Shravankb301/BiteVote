"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { Calculator, DollarSign, Users, Receipt, Split, Share2, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
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
  const [results, setResults] = useState<{
    subtotal: number;
    tipAmount: number;
    total: number;
    perPerson: number;
  } | null>(null)

  const calculateSplit = () => {
    setIsCalculating(true)
    const amount = parseFloat(totalAmount)
    const people = parseInt(numberOfPeople)
    const tipAmount = (amount * (parseInt(tip) / 100))
    const total = amount + tipAmount
    const perPerson = total / people

    setResults({
      subtotal: amount,
      tipAmount,
      total,
      perPerson
    })
    setIsCalculating(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const generatePaymentData = () => {
    if (!results || !venmoId) return '';
    
    // Generate Venmo deep link
    const amount = results.perPerson.toFixed(2)
    const note = encodeURIComponent('Split bill payment')
    const venmoLink = `venmo://paycharge?txn=pay&recipients=${venmoId}&amount=${amount}&note=${note}`
    
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
        await navigator.share({
          title: 'Split Bill Payment',
          text: `Your share is ${formatCurrency(results.perPerson)}. Pay to Venmo: ${venmoId}`,
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
                disabled={!totalAmount || !numberOfPeople || isCalculating}
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
                      <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-2">
                          <Split className="w-4 h-4 text-pink-500" />
                          <span className="text-white font-medium">Each Person Pays:</span>
                        </div>
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                          {formatCurrency(results.perPerson)}
                        </span>
                      </div>
                      
                      <Button
                        onClick={handleShare}
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
              Scan this QR code to pay via Venmo
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
            <QRCodeSVG
              value={generatePaymentData()}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="text-center text-slate-400 mt-4">
            <p>Pay to: @{venmoId}</p>
            <p>Amount: {results ? formatCurrency(results.perPerson) : '$0.00'}</p>
            <p className="text-sm">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 