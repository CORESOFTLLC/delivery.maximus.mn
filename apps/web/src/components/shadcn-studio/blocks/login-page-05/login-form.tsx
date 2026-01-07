'use client'

import { useState } from 'react'

import { EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

const LoginForm = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [corporateId, setCorporateId] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error, setError } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!corporateId || !password) {
      setError('Байгууллагын ID болон нууц үг оруулна уу')
      return
    }

    await login({ corporate_id: corporateId, password })
  }

  return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Corporate ID */}
      <div className='space-y-1'>
        <Label className='leading-5' htmlFor='corporateId'>
          Байгууллагын ID*
        </Label>
        <Input
          type='text'
          id='corporateId'
          placeholder='Байгууллагын ID оруулна уу'
          value={corporateId}
          onChange={(e) => setCorporateId(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      {/* Password */}
      <div className='w-full space-y-1'>
        <Label className='leading-5' htmlFor='password'>
          Нууц үг*
        </Label>
        <div className='relative'>
          <Input
            id='password'
            type={isVisible ? 'text' : 'password'}
            placeholder='••••••••••••••••'
            className='pr-9'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <Button
            variant='ghost'
            size='icon'
            type='button'
            onClick={() => setIsVisible(prevState => !prevState)}
            className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
          >
            {isVisible ? <EyeOffIcon /> : <EyeIcon />}
            <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
          </Button>
        </div>
      </div>

      {/* Remember Me and Forgot Password */}
      <div className='flex items-center justify-between gap-y-2'>
        <div className='flex items-center gap-3'>
          <Checkbox id='rememberMe' className='size-6' />
          <Label htmlFor='rememberMe' className='text-muted-foreground'>
            Намайг сана
          </Label>
        </div>

        <a href='#' className='hover:underline'>
          Нууц үг мартсан?
        </a>
      </div>

      <Button className='w-full' type='submit' disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Нэвтэрч байна...
          </>
        ) : (
          'Нэвтрэх'
        )}
      </Button>
    </form>
  )
}

export default LoginForm
