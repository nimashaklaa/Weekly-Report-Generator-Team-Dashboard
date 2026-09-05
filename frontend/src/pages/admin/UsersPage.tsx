import { useEffect, useState } from 'react'
import { usersApi } from '@/api/users'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Lock, Unlock, Shield } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const AVAILABLE_ROLES = ['TEAM_MEMBER', 'MANAGER', 'ADMIN']

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleUser, setRoleUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    usersApi.getAll({ size: 100 }).then((p) => setUsers(p.content)).finally(() => setLoading(false))
  }, [])

  const handleLock = async (user: User) => {
    if (user.accountLocked) {
      await usersApi.unlock(user.id)
    } else {
      await usersApi.lock(user.id)
    }
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, accountLocked: !u.accountLocked } : u))
  }

  const handleAssignRole = async () => {
    if (!roleUser || !selectedRole) return
    setSaving(true)
    try {
      const updated = await usersApi.assignRoles(roleUser.id, [selectedRole])
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u))
      setRoleUser(null)
    } finally { setSaving(false) }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm">Manage user roles and account status</p>
      </div>

      <Card>
        <CardHeader><CardTitle>All Users ({users.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((r) => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.accountLocked
                        ? <Badge variant="destructive">Locked</Badge>
                        : user.enabled
                          ? <Badge variant="outline">Active</Badge>
                          : <Badge variant="secondary">Inactive</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Assign role"
                          onClick={() => { setRoleUser(user); setSelectedRole(user.roles[0] ?? '') }}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={user.accountLocked ? 'Unlock' : 'Lock'}
                          onClick={() => handleLock(user)}
                        >
                          {user.accountLocked
                            ? <Unlock className="h-4 w-4 text-green-600" />
                            : <Lock className="h-4 w-4 text-destructive" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!roleUser} onOpenChange={() => setRoleUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role — {roleUser?.firstName} {roleUser?.lastName}</DialogTitle>
          </DialogHeader>
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v ?? '')}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {AVAILABLE_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleUser(null)}>Cancel</Button>
            <Button onClick={handleAssignRole} disabled={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
