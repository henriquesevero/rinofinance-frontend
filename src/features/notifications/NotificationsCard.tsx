import { useState } from "react"
import { Bell, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toErrorMessage } from "@/lib/errors"
import { usePushNotifications } from "./usePushNotifications"

export function NotificationsCard() {
  const { status, subscribe, unsubscribe, sendTest } = usePushNotifications()
  const [testing, setTesting] = useState(false)

  async function handleSubscribe() {
    try {
      await subscribe()
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleTest() {
    setTesting(true)
    try {
      await sendTest()
      toast.success("Lembrete de teste enviado")
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          Lembretes diários
        </CardTitle>
        <CardDescription>
          Um lembrete por dia no seu iPhone pra atualizar as finanças — com dicas dos seus cartões (fatura fechando,
          melhor dia de compra).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando...
          </div>
        )}

        {status === "unsupported" && (
          <p className="text-sm text-muted-foreground">
            No iPhone, adicione o app à Tela de Início e abra por lá (PWA, iOS 16.4+) para ativar os lembretes.
          </p>
        )}

        {status === "denied" && (
          <p className="text-sm text-muted-foreground">
            As notificações estão bloqueadas. Habilite nas configurações do sistema/navegador e recarregue.
          </p>
        )}

        {status === "unsubscribed" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Ative para receber o lembrete diário às 20h.</p>
            <Button onClick={handleSubscribe} className="w-fit">
              <Bell className="size-4" />
              Ativar lembretes
            </Button>
          </div>
        )}

        {status === "subscribed" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-emerald-500">Lembretes ativados neste dispositivo.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
                {testing ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
                Enviar teste
              </Button>
              <Button variant="ghost" size="sm" onClick={unsubscribe}>
                Desativar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
