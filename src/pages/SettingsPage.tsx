import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '../components/ui/Card'

export default function SettingsPage() {
  const { user } = useAuth()
  return (
    <div>
      <PageHeader title="Impostazioni" subtitle="Gestisci il tuo account" />
      <div className="p-8 space-y-6">
        <Card>
          <CardHeader><h3 className="font-semibold text-white">Account</h3></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-white/40">Email</p>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">ID utente</p>
              <p className="text-white/60 text-xs font-mono">{user?.id}</p>
            </div>
            <div>
              <p className="text-sm text-white/40">Registrato il</p>
              <p className="text-white/60 text-sm">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('it-IT') : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
