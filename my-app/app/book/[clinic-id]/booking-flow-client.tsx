'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Anchor,
  Calendar,
  User,
  Sailboat,
  CreditCard,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Users,
  DollarSign,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Clinic } from '@/lib/types'

interface BookingFlowClientProps {
  clinic: Clinic
  spotsRemaining: number
}

const STEPS = [
  { id: 1, label: 'Client Info', icon: User },
  { id: 2, label: 'Sailing Profile', icon: Sailboat },
  { id: 3, label: 'Equipment', icon: Anchor },
  { id: 4, label: 'Payment', icon: CreditCard },
]

export function BookingFlowClient({ clinic, spotsRemaining }: BookingFlowClientProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isComplete, setIsComplete] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Client info
    name: '',
    email: '',
    phone: '',
    emergencyName: '',
    emergencyPhone: '',
    // Sailing profile
    experienceLevel: '',
    weight: '',
    height: '',
    sailSize: '',
    sailingGoals: '',
    // Equipment
    equipmentOption: 'charter',
    bringOwnBoat: false,
    boatDetails: '',
    dietaryRestrictions: '',
  })

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    // Create client and booking
    const response = await fetch('/api/bookings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicId: clinic.id,
        ...formData,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      setBookingId(data.bookingId)
      
      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl
      } else {
        setIsComplete(true)
      }
    }
  }

  if (isComplete) {
    return <ConfirmationView clinic={clinic} formData={formData} />
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Anchor className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">International Sailing Academy</h1>
          </div>
          <p className="text-muted-foreground">Book your sailing clinic</p>
        </div>

        {/* Clinic Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{clinic.title}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(clinic.date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {clinic.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {spotsRemaining} spots remaining
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(clinic.price)}</div>
                <div className="text-sm text-muted-foreground">
                  Deposit: {formatCurrency(clinic.deposit_amount)}
                </div>
              </div>
            </div>
            
            {clinic.description && (
              <p className="mt-4 text-sm text-muted-foreground">{clinic.description}</p>
            )}
            
            {spotsRemaining <= 2 && spotsRemaining > 0 && (
              <Badge variant="destructive" className="mt-4">
                Only {spotsRemaining} spots left!
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep
            
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-2 ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].label}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about yourself and your emergency contact."}
              {currentStep === 2 && "Help us understand your sailing experience."}
              {currentStep === 3 && "Let us know your equipment needs."}
              {currentStep === 4 && "Secure your spot with a deposit."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <Step1ClientInfo formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 2 && (
              <Step2SailingProfile formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 3 && (
              <Step3Equipment formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 4 && (
              <Step4Payment clinic={clinic} formData={formData} />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          {currentStep < 4 ? (
            <Button onClick={handleNext}>
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              Pay Deposit
              <DollarSign className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function Step1ClientInfo({ formData, updateFormData }: { formData: any; updateFormData: any }) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="John Smith"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            placeholder="john@example.com"
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => updateFormData('phone', e.target.value)}
          placeholder="+1-555-123-4567"
          required
        />
      </div>

      <Separator className="my-2" />

      <p className="font-medium">Emergency Contact</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="emergencyName">Contact Name *</Label>
          <Input
            id="emergencyName"
            value={formData.emergencyName}
            onChange={(e) => updateFormData('emergencyName', e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="emergencyPhone">Contact Phone *</Label>
          <Input
            id="emergencyPhone"
            value={formData.emergencyPhone}
            onChange={(e) => updateFormData('emergencyPhone', e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  )
}

function Step2SailingProfile({ formData, updateFormData }: { formData: any; updateFormData: any }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>Experience Level</Label>
        <Select
          value={formData.experienceLevel}
          onValueChange={(value) => updateFormData('experienceLevel', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">
              Beginner - New to sailing or limited experience
            </SelectItem>
            <SelectItem value="intermediate">
              Intermediate - Comfortable with basics, some racing experience
            </SelectItem>
            <SelectItem value="advanced">
              Advanced - Experienced racer, looking to refine skills
            </SelectItem>
            <SelectItem value="pro">
              Pro - Competitive sailor seeking elite coaching
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="weight">Weight (lbs)</Label>
          <Input
            id="weight"
            type="number"
            value={formData.weight}
            onChange={(e) => updateFormData('weight', e.target.value)}
            placeholder="175"
          />
          <p className="text-xs text-muted-foreground">For equipment sizing</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="height">Height</Label>
          <Input
            id="height"
            value={formData.height}
            onChange={(e) => updateFormData('height', e.target.value)}
            placeholder="5'10\""
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Sail Size Preference</Label>
        <Select
          value={formData.sailSize}
          onValueChange={(value) => updateFormData('sailSize', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select preferred sail size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4.7">4.7 (Youth/Radial)</SelectItem>
            <SelectItem value="Standard">Standard (Full Rig)</SelectItem>
            <SelectItem value="unrestricted">Unrestricted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="goals">Sailing Goals</Label>
        <textarea
          id="goals"
          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.sailingGoals}
          onChange={(e) => updateFormData('sailingGoals', e.target.value)}
          placeholder="What do you hope to achieve in this clinic?"
        />
      </div>
    </div>
  )
}

function Step3Equipment({ formData, updateFormData }: { formData: any; updateFormData: any }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>Equipment Option</Label>
        <div className="grid grid-cols-2 gap-4">
          <label
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
              formData.equipmentOption === 'charter'
                ? 'border-primary bg-primary/5'
                : 'hover:bg-muted'
            }`}
          >
            <input
              type="radio"
              name="equipment"
              value="charter"
              checked={formData.equipmentOption === 'charter'}
              onChange={(e) => updateFormData('equipmentOption', e.target.value)}
              className="sr-only"
            />
            <Sailboat className="h-8 w-8" />
            <div className="text-center">
              <p className="font-medium">Charter Boat</p>
              <p className="text-sm text-muted-foreground">Use ISA equipment</p>
            </div>
          </label>

          <label
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
              formData.equipmentOption === 'own'
                ? 'border-primary bg-primary/5'
                : 'hover:bg-muted'
            }`}
          >
            <input
              type="radio"
              name="equipment"
              value="own"
              checked={formData.equipmentOption === 'own'}
              onChange={(e) => updateFormData('equipmentOption', e.target.value)}
              className="sr-only"
            />
            <Anchor className="h-8 w-8" />
            <div className="text-center">
              <p className="font-medium">Bring Own</p>
              <p className="text-sm text-muted-foreground">Use your own boat</p>
            </div>
          </label>
        </div>
      </div>

      {formData.equipmentOption === 'own' && (
        <div className="grid gap-2">
          <Label htmlFor="boatDetails">Boat Details</Label>
          <textarea
            id="boatDetails"
            className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.boatDetails}
            onChange={(e) => updateFormData('boatDetails', e.target.value)}
            placeholder="Boat model, sail number, any special requirements..."
          />
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="dietary">Dietary Restrictions</Label>
        <Input
          id="dietary"
          value={formData.dietaryRestrictions}
          onChange={(e) => updateFormData('dietaryRestrictions', e.target.value)}
          placeholder="Any allergies or dietary requirements?"
        />
      </div>
    </div>
  )
}

function Step4Payment({ clinic, formData }: { clinic: Clinic; formData: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted p-4">
        <h3 className="font-medium mb-3">Booking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Clinic</span>
            <span>{clinic.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{formatDate(clinic.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Participant</span>
            <span>{formData.name}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Price</span>
            <span className="font-medium">{formatCurrency(clinic.price)}</span>
          </div>
          <div className="flex justify-between text-destructive">
            <span>Deposit Due Now</span>
            <span className="font-bold">{formatCurrency(clinic.deposit_amount)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Balance Due Later</span>
            <span>{formatCurrency(clinic.price - clinic.deposit_amount)}</span>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>By completing this booking, you agree to:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Pay the remaining balance 30 days before the clinic</li>
          <li>Sign the liability waiver before participating</li>
          <li>Cancellation policy: Full refund with 60 days notice</li>
        </ul>
      </div>
    </div>
  )
}

function ConfirmationView({ clinic, formData }: { clinic: Clinic; formData: any }) {
  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
        <p className="text-muted-foreground">
          Thank you for your booking. We've sent a confirmation email to {formData.email}.
        </p>

        <Card>
          <CardContent className="pt-6 text-left space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Clinic</p>
              <p className="font-medium">{clinic.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(clinic.date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{clinic.location}</p>
            </div>
          </CardContent>
        </Card>

        <Button asChild className="w-full">
          <Link href="/">Return to Website</Link>
        </Button>
      </div>
    </div>
  )
}
