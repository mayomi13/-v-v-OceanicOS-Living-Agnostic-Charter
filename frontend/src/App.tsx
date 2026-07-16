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

  useEffect(()=>{
    fetch('/charter')
      .then(r=>r.json())
      .then(d=> setCharter(d.content || 'No content'))
      .catch(()=> setCharter('Unable to fetch charter'))

    fetch('/proposals')
      .then(r=>r.json())
      .then(d=> setProposals(d || []))
      .catch(()=> setProposals([]))
  },[])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return
    const res = await fetch('/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body })
    })
    if (res.ok) {
      const p = await res.json()
      setProposals(prev => [p, ...prev])
      setTitle('')
      setBody('')
    }
  }

  return (
    <div style={{padding:20,fontFamily:'sans-serif',maxWidth:900,margin:'0 auto'}}>
      <h1>vΩ∞v OceanicOS — Living Agnostic Charter</h1>
      <section>
        <h2>Charter</h2>
        <pre style={{whiteSpace:'pre-wrap'}}>{charter}</pre>
      </section>

      <section style={{marginTop:24}}>
        <h2>Proposals</h2>
        <form onSubmit={submit} style={{marginBottom:12}}>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Proposal title" style={{width:'100%',padding:8,marginBottom:8}} />
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Details (optional)" style={{width:'100%',padding:8,marginBottom:8}} rows={4} />
          <button type="submit">Create Proposal</button>
        </form>

        {proposals.length===0 ? <p>No proposals yet.</p> : (
          <ul style={{listStyle:'none',padding:0}}>
            {proposals.map(p=> (
              <li key={p.id} style={{border:'1px solid #eee',padding:12,borderRadius:6,marginBottom:8}}>
                <strong>{p.title}</strong>
                <div style={{fontSize:12,color:'#666'}}>{p.createdAt}</div>
                {p.body ? <p style={{marginTop:8}}>{p.body}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
