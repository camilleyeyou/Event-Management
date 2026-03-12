import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'

interface Org {
  id: string
  name: string
  slug: string
  description: string
  logo_url: string
  primary_color: string
  role: string
}

export function OrgList() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/organizations/').then((res) => {
      setOrgs(res.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Organizations</h1>
        <Link to="/manage/org/new">
          <Button>Create Organization</Button>
        </Link>
      </div>

      {orgs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-4">You haven't created any organizations yet.</p>
          <Link to="/manage/org/new">
            <Button>Create your first organization</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => (
            <Link
              key={org.id}
              to={`/manage/org/${org.slug}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-(--color-primary) transition-colors"
            >
              <div className="flex items-center gap-4">
                {org.logo_url ? (
                  <img src={org.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: org.primary_color }}
                  >
                    {org.name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">{org.name}</h2>
                  {org.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">{org.description}</p>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase">{org.role}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
