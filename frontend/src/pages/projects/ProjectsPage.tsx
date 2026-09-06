import { useEffect, useState } from 'react'
import { projectsApi, categoriesApi } from '@/api/projects'
import type { Project, Category } from '@/types'
import { useAppSelector } from '@/store/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Check } from 'lucide-react'

const PALETTE = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#64748b', '#78716c',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="h-7 w-7 rounded-md border-2 flex items-center justify-center transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: value === color ? 'white' : 'transparent',
              outline: value === color ? `2px solid ${color}` : 'none',
              outlineOffset: '1px',
            }}
          >
            {value === color && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
          </button>
        ))}
        <label
          className="h-7 w-7 rounded-md border-2 border-dashed border-muted-foreground flex items-center justify-center cursor-pointer hover:border-foreground transition-colors relative overflow-hidden"
          title="Custom color"
        >
          <span className="text-xs text-muted-foreground">+</span>
          <input
            type="color"
            value={value || '#3b82f6'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>
      {value && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-4 w-4 rounded border inline-block" style={{ backgroundColor: value }} />
          {value}
        </div>
      )}
    </div>
  )
}

function ColorDot({ color }: { color?: string }) {
  return color
    ? <span className="inline-block h-3 w-3 rounded-full border shrink-0" style={{ backgroundColor: color }} />
    : null
}

type FormState = { name: string; description: string; colorHex: string }
const emptyForm = (): FormState => ({ name: '', description: '', colorHex: '' })

export default function ProjectsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const canWrite = user?.roles?.some((r) => ['MANAGER', 'ADMIN'].includes(r))

  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [projectDialog, setProjectDialog] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [pForm, setPForm] = useState<FormState>(emptyForm())

  const [categoryDialog, setCategoryDialog] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [cForm, setCForm] = useState<FormState>(emptyForm())

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    projectsApi.getAll()
      .then((p) => setProjects(p.content))
      .catch(() => {})
    categoriesApi.getAll()
      .then((p) => setCategories(p.content))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openProjectDialog = (p?: Project) => {
    setEditProject(p ?? null)
    setPForm({ name: p?.name ?? '', description: p?.description ?? '', colorHex: p?.colorHex ?? '' })
    setError('')
    setProjectDialog(true)
  }

  const saveProject = async () => {
    if (!pForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      if (editProject) {
        const updated = await projectsApi.update(editProject.id, pForm)
        setProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p))
      } else {
        const created = await projectsApi.create(pForm)
        setProjects((prev) => [...prev, created])
      }
      setProjectDialog(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setError(msg ?? 'Failed to save')
    } finally { setSaving(false) }
  }

  const openCategoryDialog = (c?: Category) => {
    setEditCategory(c ?? null)
    setCForm({ name: c?.name ?? '', description: c?.description ?? '', colorHex: c?.colorHex ?? '' })
    setError('')
    setCategoryDialog(true)
  }

  const saveCategory = async () => {
    if (!cForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      if (editCategory) {
        const updated = await categoriesApi.update(editCategory.id, cForm)
        setCategories((prev) => prev.map((c) => c.id === updated.id ? updated : c))
      } else {
        const created = await categoriesApi.create(cForm)
        setCategories((prev) => [...prev, created])
      }
      setCategoryDialog(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setError(msg ?? 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Projects & Categories</h1>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4 mt-4">
          {canWrite && (
            <Button onClick={() => openProjectDialog()}>
              <Plus className="h-4 w-4 mr-2" /> New Project
            </Button>
          )}
          {loading ? <p className="text-muted-foreground text-sm">Loading…</p> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-3">No projects yet.</p>
              )}
              {projects.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ColorDot color={p.colorHex} />
                      {p.name}
                      {!p.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{p.description ?? 'No description'}</p>
                    {canWrite && (
                      <Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={() => openProjectDialog(p)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          {canWrite && (
            <Button onClick={() => openCategoryDialog()}>
              <Plus className="h-4 w-4 mr-2" /> New Category
            </Button>
          )}
          {loading ? <p className="text-muted-foreground text-sm">Loading…</p> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-3">No categories yet.</p>
              )}
              {categories.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ColorDot color={c.colorHex} />
                      {c.name}
                      {!c.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{c.description ?? 'No description'}</p>
                    {canWrite && (
                      <Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={() => openCategoryDialog(c)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Project dialog */}
      <Dialog open={projectDialog} onOpenChange={setProjectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editProject ? 'Edit' : 'New'} Project</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} placeholder="e.g. Mobile App" />
            </div>
            <div className="space-y-1">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={pForm.description} onChange={(e) => setPForm({ ...pForm, description: e.target.value })} placeholder="Short description" />
            </div>
            <div className="space-y-2">
              <Label>Color <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <ColorPicker value={pForm.colorHex} onChange={(v) => setPForm({ ...pForm, colorHex: v })} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialog(false)}>Cancel</Button>
            <Button onClick={saveProject} disabled={saving || !pForm.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCategory ? 'Edit' : 'New'} Category</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} placeholder="e.g. Bug Fix" />
            </div>
            <div className="space-y-1">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={cForm.description} onChange={(e) => setCForm({ ...cForm, description: e.target.value })} placeholder="Short description" />
            </div>
            <div className="space-y-2">
              <Label>Color <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <ColorPicker value={cForm.colorHex} onChange={(v) => setCForm({ ...cForm, colorHex: v })} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog(false)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={saving || !cForm.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
