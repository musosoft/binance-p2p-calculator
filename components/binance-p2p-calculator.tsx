"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export function BinanceP2pCalculator() {
  const [eurUsdRate, setEurUsdRate] = useState<number>(1.08)
  const [eurTargetRate, setEurTargetRate] = useState<number>(37.50)
  const [usdTargetRate, setUsdTargetRate] = useState<number>(34.72)
  const [depositFee, setDepositFee] = useState<string>("1")
  const [isDepositFeePercentage, setIsDepositFeePercentage] = useState<boolean>(false)
  const [eurUsdcRate, setEurUsdcRate] = useState<number>(1.05)
  const [usdcTargetRate, setUsdcTargetRate] = useState<number>(35.00)
  const [minP2PAmount, setMinP2PAmount] = useState<number>(3500)
  const [eurAmount, setEurAmount] = useState<number>(100)
  const [alignWithMinP2P, setAlignWithMinP2P] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [targetCurrency, setTargetCurrency] = useState<string>("THB")
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>([])

  const [targetReceived, setTargetReceived] = useState<number>(0)
  const [minEurDeposit, setMinEurDeposit] = useState<number>(0)
  const [totalFees, setTotalFees] = useState<number>(0)
  const [profitLoss, setProfitLoss] = useState<number>(0)

  useEffect(() => {
    fetchSupportedCurrencies()
  }, [])

  useEffect(() => {
    if (supportedCurrencies.length > 0) {
      fetchExchangeRates()
    }
  }, [targetCurrency, supportedCurrencies])

  useEffect(() => {
    calculateResults()
  }, [eurUsdRate, eurTargetRate, usdTargetRate, depositFee, isDepositFeePercentage, eurUsdcRate, usdcTargetRate, minP2PAmount, eurAmount, alignWithMinP2P, targetCurrency])

  const fetchSupportedCurrencies = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR')
      const data = await response.json()
      const currencies = Object.keys(data.rates).filter(currency => currency !== 'EUR')
      setSupportedCurrencies(currencies)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching supported currencies:', error)
      setIsLoading(false)
    }
  }

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/EUR`)
      const data = await response.json()
      setEurUsdRate(Number(data.rates.USD.toFixed(2)))
      setEurTargetRate(Number(data.rates[targetCurrency].toFixed(2)))
      setUsdTargetRate(Number((data.rates[targetCurrency] / data.rates.USD).toFixed(2)))
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
      setIsLoading(false)
    }
  }

  const calculateResults = () => {
    let calculatedEurAmount = eurAmount
    if (alignWithMinP2P) {
      calculatedEurAmount = Number((minP2PAmount / (eurUsdcRate * usdcTargetRate)).toFixed(2))
    }

    // Calculate deposit fee
    let actualDepositFee = parseFloat(depositFee)
    if (isDepositFeePercentage) {
      actualDepositFee = Number(((calculatedEurAmount * actualDepositFee) / 100).toFixed(2))
    }

    // Calculate EUR after deposit fee
    const eurAfterFee = Number((calculatedEurAmount - actualDepositFee).toFixed(2))

    // Calculate USDC equivalent
    const usdcEquivalent = Number((eurAfterFee * eurUsdcRate).toFixed(2))

    // Calculate target currency received
    const targetReceived = Number((usdcEquivalent * usdcTargetRate).toFixed(2))
    setTargetReceived(targetReceived)

    // Calculate minimum EUR deposit
    const minUsdcRequired = Number((minP2PAmount / usdcTargetRate).toFixed(2))
    const minEurRequired = Number((minUsdcRequired / eurUsdcRate).toFixed(2))
    const minEurDeposit = isDepositFeePercentage
      ? Number((minEurRequired / (1 - parseFloat(depositFee) / 100)).toFixed(2))
      : Number((minEurRequired + parseFloat(depositFee)).toFixed(2))
    setMinEurDeposit(minEurDeposit)

    // Calculate total fees
    setTotalFees(Number(actualDepositFee.toFixed(2)))

    // Calculate profit/loss
    const directExchangeAmount = Number((calculatedEurAmount * eurTargetRate).toFixed(2))
    setProfitLoss(Number((targetReceived - directExchangeAmount).toFixed(2)))

    if (alignWithMinP2P) {
      setEurAmount(calculatedEurAmount)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Binance P2P Fees Calculator</CardTitle>
        <CardDescription>Calculate fees and exchange rates for Binance P2P transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetCurrency">Target Currency</Label>
                <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                  <SelectTrigger id="targetCurrency">
                    <SelectValue placeholder="Select target currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedCurrencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eurUsdRate">Current EUR &gt; USD rate</Label>
                <Input
                  id="eurUsdRate"
                  type="number"
                  step="0.01"
                  value={eurUsdRate.toFixed(2)}
                  onChange={(e) => setEurUsdRate(Number(parseFloat(e.target.value).toFixed(2)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eurTargetRate">Current EUR &gt; {targetCurrency} rate</Label>
                <Input
                  id="eurTargetRate"
                  type="number"
                  step="0.01"
                  value={eurTargetRate.toFixed(2)}
                  onChange={(e) => setEurTargetRate(Number(parseFloat(e.target.value).toFixed(2)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usdTargetRate">Current USD &gt; {targetCurrency} rate</Label>
                <Input
                  id="usdTargetRate"
                  type="number"
                  step="0.01"
                  value={usdTargetRate.toFixed(2)}
                  onChange={(e) => setUsdTargetRate(Number(parseFloat(e.target.value).toFixed(2)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositFee">Current Deposit fee</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="depositFee"
                    type="text"
                    value={depositFee}
                    onChange={(e) => setDepositFee(e.target.value)}
                  />
                  <Label htmlFor="isPercentage" className="flex items-center space-x-2">
                    <Checkbox
                      id="isPercentage"
                      checked={isDepositFeePercentage}
                      onCheckedChange={(checked) => setIsDepositFeePercentage(checked as boolean)}
                    />
                    <span>%</span>
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eurUsdcRate">Current EUR &gt; USDC rate in Binance deposit</Label>
                <Input
                  id="eurUsdcRate"
                  type="number"
                  step="0.01"
                  value={eurUsdcRate.toFixed(2)}
                  onChange={(e) => setEurUsdcRate(Number(parseFloat(e.target.value).toFixed(2)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usdcTargetRate">Current best USDC/{targetCurrency} P2P offer</Label>
                <Input
                  id="usdcTargetRate"
                  type="number"
                  step="0.01"
                  value={usdcTargetRate.toFixed(2)}
                  onChange={(e) => setUsdcTargetRate(Number(parseFloat(e.target.value).toFixed(2)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minP2PAmount">Minimum required amount for P2P offer ({targetCurrency})</Label>
                <Input
                  id="minP2PAmount"
                  type="number"
                  step="1"
                  value={minP2PAmount.toFixed(2)}
                  onChange={(e) => setMinP2PAmount(Number(parseFloat(e.target.value).toFixed(2)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eurAmount">EUR amount to exchange</Label>
                <Input
                  id="eurAmount"
                  type="number"
                  step="0.01"
                  value={eurAmount.toFixed(2)}
                  onChange={(e) => setEurAmount(Number(parseFloat(e.target.value).toFixed(2)))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alignWithMinP2P"
                  checked={alignWithMinP2P}
                  onCheckedChange={(checked) => setAlignWithMinP2P(checked as boolean)}
                />
                <Label htmlFor="alignWithMinP2P">Align EUR amount with minimum P2P offer</Label>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <div>
                <Label>You will receive:</Label>
                <p className="text-2xl font-bold">{targetReceived.toFixed(2)} {targetCurrency}</p>
              </div>
              <div>
                <Label>Minimum EUR deposit for P2P offer:</Label>
                <p className="text-2xl font-bold">{minEurDeposit.toFixed(2)} EUR</p>
              </div>
              <div>
                <Label>Total fees:</Label>
                <p className="text-2xl font-bold">{totalFees.toFixed(2)} EUR</p>
              </div>
              <div>
                <Label>Profit/Loss compared to direct exchange:</Label>
                <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitLoss.toFixed(2)} {targetCurrency}
                </p>
              </div>
              <div>
                <Label>Effective exchange rate:</Label>
                <p className="text-2xl font-bold">{(targetReceived / eurAmount).toFixed(2)} {targetCurrency}/EUR</p>
              </div>
            </div>
          </>
        )}
        <div className="mt-4">
          <Button onClick={fetchExchangeRates}>Refresh Exchange Rates</Button>
        </div>
      </CardContent>
    </Card>
  )
}