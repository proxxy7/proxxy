import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Artist25ohms from './Artist25ohms'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
  <Routes>
    <Route path="/" element={<App />} />
    <Route path="/artists/25ohms" element={<Artist25ohms />} />
  </Routes>
</BrowserRouter>
  </StrictMode>,
)
