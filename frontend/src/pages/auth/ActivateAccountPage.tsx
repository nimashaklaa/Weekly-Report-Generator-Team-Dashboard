import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

type State = 'loading' | 'success' | 'error'

export default function ActivateAccountPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [state, setState] = useState<State>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setErrorMsg('No activation token found in the link.')
      setState('error')
      return
    }

    authApi.activateAccount(token)
      .then(() => setState('success'))
      .catch((err) => {
        setErrorMsg(err?.response?.data?.message ?? 'Activation failed. The link may have expired.')
        setState('error')
      })
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Account Activation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Activating your account…</p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium text-lg">Your account is now active!</p>
              <p className="text-muted-foreground text-sm">You can sign in with your credentials.</p>
              <Button className="mt-2 w-full" onClick={() => navigate('/login')}>
                Go to sign in
              </Button>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="font-medium text-lg">Activation failed</p>
              <p className="text-muted-foreground text-sm">{errorMsg}</p>
              <Button variant="outline" className="mt-2 w-full" onClick={() => navigate('/login')}>
                Back to sign in
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
