import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { InteractiveHelp } from './components/InteractiveHelp'
import { Layout } from './components/Layout'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<InteractiveHelp />} />
        <Route path="/help" element={<InteractiveHelp />} />
      </Routes>
    </Layout>
  )
}

export default App
