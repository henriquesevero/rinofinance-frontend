import { useRef, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/UserAvatar"
import { toErrorMessage } from "@/lib/errors"
import { resizeImageToDataUrl } from "@/lib/image"
import { useAuthStore } from "./store"

export function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const changeEmail = useAuthStore((s) => s.changeEmail)
  const changePassword = useAuthStore((s) => s.changePassword)
  const deleteAccount = useAuthStore((s) => s.deleteAccount)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(user?.name ?? "")
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl ?? "")
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const [newEmail, setNewEmail] = useState(user?.email ?? "")
  const [emailPassword, setEmailPassword] = useState("")
  const [isSavingEmail, setIsSavingEmail] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      setAvatarPreview(await resizeImageToDataUrl(file))
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault()
    setIsSavingProfile(true)
    try {
      await updateProfile(name, avatarPreview)
      toast.success("Perfil atualizado")
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleSaveEmail(event: FormEvent) {
    event.preventDefault()
    setIsSavingEmail(true)
    try {
      await changeEmail(newEmail, emailPassword)
      setEmailPassword("")
      toast.success("Email atualizado")
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setIsSavingEmail(false)
    }
  }

  async function handleSavePassword(event: FormEvent) {
    event.preventDefault()
    if (newPassword !== confirmNewPassword) {
      toast.error("As senhas não coincidem")
      return
    }
    setIsSavingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      toast.success("Senha atualizada")
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setIsSavingPassword(false)
    }
  }

  async function handleDeleteAccount(event: FormEvent) {
    event.preventDefault()
    setIsDeleting(true)
    try {
      await deleteAccount(deletePassword)
      toast.success("Conta excluída")
      navigate("/login", { replace: true })
    } catch (err) {
      toast.error(toErrorMessage(err))
      setIsDeleting(false)
    }
  }

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/dashboard" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Voltar ao painel
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Configurações da conta</h1>
      </div>

      <Card>
        <form onSubmit={handleSaveProfile}>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Sua foto e nome de exibição</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <UserAvatar name={name} avatarUrl={avatarPreview} className="size-16 text-base" />
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Alterar foto
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-name">Nome</Label>
              <Input id="settings-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? "Salvando..." : "Salvar perfil"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={handleSaveEmail}>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>Usado para entrar na sua conta</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-email">Novo email</Label>
              <Input
                id="settings-email"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-email-password">Senha atual</Label>
              <Input
                id="settings-email-password"
                type="password"
                autoComplete="current-password"
                required
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSavingEmail}>
              {isSavingEmail ? "Salvando..." : "Salvar email"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={handleSavePassword}>
          <CardHeader>
            <CardTitle>Senha</CardTitle>
            <CardDescription>Recomendado trocar periodicamente</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-current-password">Senha atual</Label>
              <Input
                id="settings-current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-new-password">Nova senha</Label>
              <Input
                id="settings-new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-confirm-password">Confirmar nova senha</Label>
              <Input
                id="settings-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSavingPassword}>
              {isSavingPassword ? "Salvando..." : "Salvar senha"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Zona de perigo</CardTitle>
          <CardDescription>Sair da conta ou excluí-la permanentemente</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={handleLogout}>
            Sair da conta
          </Button>
          <Button type="button" variant="destructive" onClick={() => setIsDeleteOpen(true)}>
            Excluir conta
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conta permanentemente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDeleteAccount} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Essa ação não pode ser desfeita. Todas as suas entradas, saídas, cartões e investimentos serão
              apagados. Digite sua senha para confirmar.
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="delete-password">Senha atual</Label>
              <Input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={isDeleting}>
                {isDeleting ? "Excluindo..." : "Excluir minha conta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
