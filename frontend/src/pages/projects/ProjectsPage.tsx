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
import { Plus, Pencil } from 'lucide-react'

function ColorDot({ color }: { color?: string }) {
  return color
    ? <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: color }} />
    : null
}

export default function ProjectsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const canWrite = user?.roles.some((r) => ['MANAGER', 'ADMIN'].includes(r))

  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [projectDialog, setProjectDialog] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [pForm, setPForm] = useState({ name: '', description: '', colorHex: '' })

  const [categoryDialog, setCategoryDialog] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [cForm, setCForm] = useState({ name: '', description: '', colorHex: '' })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      projectsApi.getAll().then((p) => p.content),
      categoriesApi.getAll().then((p) => p.content),
    ]).then(([p, c]) => { setProjects(p); setCategories(c) })
      .finally(() => setLoading(false))
  }, [])

  const openProjectDialog = (p?: Project) => {
    setEditProject(p ?? null)
    setPForm({ name: p?.name ?? '', description: p?.description ?? '', colorHex: p?.colorHex ?? '' })
    setProjectDialog(true)
  }

  const saveProject = async () => {
    setSaving(true)
    try {
      if (editProject) {
        const updated = await projectsApi.update(editProject.id, pForm)
        setProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p))
      } else {
        const created = await projectsApi.create(pForm)
        setProjects((prev) => [...prev, created])
      }
      setProjectDialog(false)
    } finally { setSaving(false) }
  }

  const openCategoryDialog = (c?: Category) => {
    setEditCategory(c ?? null)
    setCForm({ name: c?.name ?? '', description: c?.description ?? '', colorHex: c?.colorHex ?? '' })
    setCategoryDialog(true)
  }

  const saveCategory = async () => {
    setSaving(true)
    try {
      if (editCategory) {
        const updated = await categoriesApi.update(editCategory.id, cForm)
        setCategories((prev) => prev.map((c) => c.id === updated.id ? updated : c))
      } else {
        const created = await categoriesApi.create(cForm)
        setCategories((prev) => [...prev, created])
      }
      setCategoryDialog(false)
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
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={pForm.description} onChange={(e) => setPForm({ ...pForm, description: e.target.value })} /></div>
            <div><Label>Color (hex)</Label><Input value={pForm.colorHex} placeholder="#3b82f6" onChange={(e) => setPForm({ ...pForm, colorHex: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialog(false)}>Cancel</Button>
            <Button onClick={saveProject} disabled={saving || !pForm.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCategory ? 'Edit' : 'New'} Category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={cForm.description} onChange={(e) => setCForm({ ...cForm, description: e.target.value })} /></div>
            <div><Label>Color (hex)</Label><Input value={cForm.colorHex} placeholder="#3b82f6" onChange={(e) => setCForm({ ...cForm, colorHex: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog(false)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={saving || !cForm.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
