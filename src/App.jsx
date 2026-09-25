import React from 'react'
import { Routes, Route } from 'react-router-dom'
import PublicProfile from './user/PublicProfile'
import AdminPanel from './admin/AdminPanel'
import NotFound from './NotFound'

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/" element={<PublicProfile />} />
      <Route path="/:pageId" element={<PublicProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
