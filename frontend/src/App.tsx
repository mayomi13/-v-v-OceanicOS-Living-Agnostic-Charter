import React, {useEffect, useState} from 'react'

export default function App(){
  const [charter, setCharter] = useState<string>('Loading...')
  useEffect(()=>{
    fetch('/charter')
      .then(r=>r.json())
      .then(d=> setCharter(d.content || 'No content'))
      .catch(()=> setCharter('Unable to fetch charter'))
  },[])
  return (
    <div style={{padding:20,fontFamily:'sans-serif'}}>
      <h1>vΩ∞v OceanicOS — Living Agnostic Charter</h1>
      <pre style={{whiteSpace:'pre-wrap'}}>{charter}</pre>
    </div>
  )
}
