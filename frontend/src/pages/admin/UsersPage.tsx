import { useEffect, useState, useCallback } from 'react'
import { usersApi } from '@/api/users'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Lock, Unlock, Shield, Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const AVAILABLE_ROLES = ['TEAM_MEMBER', 'MANAGER', 'ADMIN']
const PAGE_SIZE = 10

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [page, setPage] = useState(0)

  const [roleUser, setRoleUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchUsers = useCallback(() => {
    setLoading(true)
    usersApi.getAll({
      search: search || undefined,
      role: roleFilter === 'ALL' ? undefined : roleFilter,
      page,
      size: PAGE_SIZE,
    }).then((p) => {
      setUsers(p.content)
      setTotalPages(p.totalPages)
      setTotalElements(p.totalElements)
    }).finally(() => setLoading(false))
  }, [search, roleFilter, page])

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0)
  }, [search, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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

      {/* Search + filter bar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? 'ALL')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            {AVAILABLE_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || roleFilter !== 'ALL') && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => { setSearch(''); setRoleFilter('ALL') }}
          >
            <X className="h-4 w-4 mr-1" /> Reset
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Users
            {!loading && (
              <span className="text-muted-foreground text-sm font-normal ml-2">
                ({totalElements} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
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
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No users match your search.
                      </TableCell>
                    </TableRow>
                  ) : users.map((user) => (
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
                      <Button
                        key={i}
                        variant={i === page ? 'default' : 'outline'}
                        size="icon"
                        className="w-9 h-9 text-sm"
                        onClick={() => setPage(i)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
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
