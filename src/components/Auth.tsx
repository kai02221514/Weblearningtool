import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Lock, Mail, User, AlertCircle } from 'lucide-react'
import { signup, signin } from '../utils/auth'

interface AuthProps {
  onSigninSuccess: (email: string, name: string, accessToken: string, userId: string) => void
}

export function Auth({ onSigninSuccess }: AuthProps) {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setIsLoading(true)

    try {
      if (isSignup) {
        // バリデーション
        if (!name || !email || !password) {
          setError('すべてのフィールドを入力してください')
          setIsLoading(false)
          return
        }
        if (password.length < 6) {
          setError('パスワードは6文字以上で入力してください')
          setIsLoading(false)
          return
        }

        // サインアップ処理
        await signup({ email, password, name })
        setIsSignup(false)
        setPassword('')
        setNotice('アカウントを作成しました。ログインしてください。')
      } else {
        // サインイン処理
        if (!email || !password) {
          setError('メールアドレスとパスワードを入力してください')
          setIsLoading(false)
          return
        }

        const result = await signin({ email, password })
        onSigninSuccess(email, result.name, result.accessToken, result.userId)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              {isSignup ? <User className="w-8 h-8 text-primary" /> : <Lock className="w-8 h-8 text-primary" />}
            </div>
            <CardTitle className="text-2xl">
              {isSignup ? 'アカウント作成' : 'ログイン'}
            </CardTitle>
            <CardDescription>
              {isSignup 
                ? 'プログラミング学習を始めましょう' 
                : 'アカウントにログインしてください'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {notice && (
                <Alert>
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              )}

              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name">お名前</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="山田太郎"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={isSignup ? '6文字以上' : 'パスワード'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? '処理中...' : (isSignup ? 'アカウント作成' : 'ログイン')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup)
                  setError('')
                  setNotice('')
                }}
                className="text-sm text-primary hover:underline"
              >
                {isSignup 
                  ? 'すでにアカウントをお持ちの方はこちら' 
                  : 'アカウントをお持ちでない方はこちら'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
