import React, {useEffect, useState} from 'react'

type Proposal = {
  id: string
  title: string
  body?: string
  status?: string
  createdAt?: string
}

export default function App(){
  const [charter, setCharter] = useState<string>('Loading...')
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const charterRes = await fetch('/charter')
      if (!charterRes.ok) throw new Error('Failed to load charter')
      const charterData = await charterRes.json()
      setCharter(charterData.content || 'No content')

      const proposalsRes = await fetch('/proposals')
      if (!proposalsRes.ok) throw new Error('Failed to load proposals')
      const proposalsData = await proposalsRes.json()
      setProposals(proposalsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setCharter('Unable to fetch charter')
      setProposals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body })
      })
      if (!res.ok) throw new Error('Failed to create proposal')
      const p = await res.json()
      setProposals(prev => [p, ...prev])
      setTitle('')
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create proposal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{padding:20,fontFamily:'sans-serif',maxWidth:900,margin:'0 auto'}}>
      <h1>vΩ∞v OceanicOS — Living Agnostic Charter</h1>
      
      {error && (
        <div style={{padding:12,backgroundColor:'#fee',color:'#c33',borderRadius:6,marginBottom:16}}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <section>
        <h2>Charter</h2>
        {loading ? (
          <div style={{color:'#999'}}>Loading charter...</div>
        ) : (
          <pre style={{whiteSpace:'pre-wrap'}}>{charter}</pre>
        )}
      </section>

      <section style={{marginTop:24}}>
        <h2>Proposals</h2>
        <form onSubmit={submit} style={{marginBottom:12}}>
          <input 
            value={title} 
            onChange={e=>setTitle(e.target.value)} 
            placeholder="Proposal title" 
            disabled={submitting}
            style={{width:'100%',padding:8,marginBottom:8,boxSizing:'border-box'}} 
          />
          <textarea 
            value={body} 
            onChange={e=>setBody(e.target.value)} 
            placeholder="Details (optional)" 
            disabled={submitting}
            style={{width:'100%',padding:8,marginBottom:8,boxSizing:'border-box'}} 
            rows={4} 
          />
          <button type="submit" disabled={submitting || !title.trim()}>
            {submitting ? 'Creating...' : 'Create Proposal'}
          </button>
        </form>

        {loading ? (
          <div style={{color:'#999'}}>Loading proposals...</div>
        ) : proposals.length===0 ? (
          <p style={{color:'#999'}}>No proposals yet. Be the first to create one!</p>
        ) : (
          <ul style={{listStyle:'none',padding:0}}>
            {proposals.map(p=> (
              <li key={p.id} style={{border:'1px solid #eee',padding:12,borderRadius:6,marginBottom:8,backgroundColor:'#fafafa'}}>
                <strong>{p.title}</strong>
                <div style={{fontSize:12,color:'#666',marginTop:4}}>
                  {p.createdAt && new Date(p.createdAt).toLocaleString()}
                  {p.status && <span style={{marginLeft:8}}>Status: <em>{p.status}</em></span>}
                </div>
                {p.body && <p style={{marginTop:8,marginBottom:0}}>{p.body}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
