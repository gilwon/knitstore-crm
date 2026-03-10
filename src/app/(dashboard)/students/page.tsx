'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StudentCard } from '@/features/students/components/StudentCard'
import { StudentForm } from '@/features/students/components/StudentForm'
import { useStudents } from '@/features/students/hooks/useStudents'
import { useShop } from '@/features/inventory/hooks/useShop'
import type { Student } from '@/types/database'

export default function StudentsPage() {
  const { data: students, isLoading } = useStudents()
  const { data: shop } = useShop()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)

  const filtered = useMemo(() => {
    if (!students) return []
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.phone ?? '').includes(q)
    )
  }, [students, search])

  function openCreate() {
    setEditStudent(null)
    setFormOpen(true)
  }

  function openEdit(student: Student) {
    setEditStudent(student)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div>
          <h1 className="text-xl font-semibold">수강생</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {students ? `${students.length}명 등록됨` : '로딩 중...'}
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} />
          수강생 등록
        </Button>
      </div>

      {/* 검색 */}
      <div className="px-6 py-3 border-b shrink-0">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="이름, 연락처 검색..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
            <Users size={32} className="opacity-30" />
            <p className="text-sm">{search ? '검색 결과가 없습니다' : '등록된 수강생이 없습니다'}</p>
            {!search && (
              <Button variant="outline" size="sm" onClick={openCreate}>
                첫 수강생 등록하기
              </Button>
            )}
          </div>
        ) : (
          <div className="max-w-2xl space-y-2">
            {filtered.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onEdit={() => openEdit(student)}
              />
            ))}
          </div>
        )}
      </div>

      {shop && (
        <StudentForm
          open={formOpen}
          onOpenChange={setFormOpen}
          shopId={shop.id}
          editStudent={editStudent}
        />
      )}
    </div>
  )
}
