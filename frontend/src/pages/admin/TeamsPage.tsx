import { useEffect, useState } from 'react'
import { teamsApi } from '@/api/teams'
import { usersApi } from '@/api/users'
import type { Team, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Users, Trash2 } from 'lucide-react'

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Create/edit dialog
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [managerId, setManagerId] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Members dialog
  const [membersTeam, setMembersTeam] = useState<Team | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [savingMembers, setSavingMembers] = useState(false)

  useEffect(() => {
    Promise.all([
      teamsApi.getAll({ size: 100 }),
      usersApi.getAll({ size: 100 }),
    ]).then(([t, u]) => {
      setTeams(t.content)
      setUsers(u.content)
    }).finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setEditTeam(null)
    setName('')
    setDescription('')
    setManagerId('')
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (team: Team) => {
    setEditTeam(team)
    setName(team.name)
    setDescription(team.description ?? '')
    setManagerId(String(team.manager.id))
    setFormError('')
    setShowForm(true)
  }

  const openMembers = (team: Team) => {
    setMembersTeam(team)
    setSelectedMembers(team.members.map((m) => m.id))
  }

  const handleSave = async () => {
    if (!name.trim()) { setFormError('Team name is required'); return }
    if (!managerId) { setFormError('Select a manager'); return }
    setSaving(true)
    setFormError('')
    try {
      if (editTeam) {
        const updated = await teamsApi.update(editTeam.id, {
          name: name.trim(),
          description: description || undefined,
          managerId: Number(managerId),
        })
        setTeams((prev) => prev.map((t) => t.id === updated.id ? updated : t))
      } else {
        const created = await teamsApi.create({
          name: name.trim(),
          description: description || undefined,
          managerId: Number(managerId),
        })
        setTeams((prev) => [...prev, created])
      }
      setShowForm(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setFormError(msg ?? 'Failed to save team')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMembers = async () => {
    if (!membersTeam) return
    setSavingMembers(true)
    try {
      const updated = await teamsApi.updateMembers(membersTeam.id, selectedMembers)
      setTeams((prev) => prev.map((t) => t.id === updated.id ? updated : t))
      setMembersTeam(null)
    } finally {
      setSavingMembers(false)
    }
  }

  const handleDeactivate = async (team: Team) => {
    if (!confirm(`Deactivate team "${team.name}"?`)) return
    await teamsApi.deactivate(team.id)
    setTeams((prev) => prev.filter((t) => t.id !== team.id))
  }

  const toggleMember = (userId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground text-sm">Create and manage teams</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Team
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Teams ({teams.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No teams yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">
                      {team.name}
                      {team.description && (
                        <p className="text-xs text-muted-foreground font-normal">{team.description}</p>
                      )}
                    </TableCell>
                    <TableCell>{team.manager.firstName} {team.manager.lastName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{team.memberCount} member{team.memberCount !== 1 ? 's' : ''}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.active ? 'outline' : 'secondary'}>
                        {team.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Edit team" onClick={() => openEdit(team)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Manage members" onClick={() => openMembers(team)}>
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Deactivate" onClick={() => handleDeactivate(team)}
                          className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
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

      {/* Create / Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTeam ? 'Edit Team' : 'New Team'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input placeholder="e.g. Backend Engineering" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input placeholder="What does this team work on?" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Manager</Label>
              <Select value={managerId} onValueChange={(v) => setManagerId(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members dialog */}
      <Dialog open={!!membersTeam} onOpenChange={() => setMembersTeam(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Members — {membersTeam?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-1 py-2">
            {users.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selectedMembers.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                />
                <span className="text-sm">{u.firstName} {u.lastName}</span>
                <span className="text-xs text-muted-foreground ml-auto">{u.email}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersTeam(null)}>Cancel</Button>
            <Button onClick={handleSaveMembers} disabled={savingMembers}>
              {savingMembers ? 'Saving…' : `Save (${selectedMembers.length} members)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
