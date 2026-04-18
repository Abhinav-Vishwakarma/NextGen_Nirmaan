"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const USERS = [
  { id: '1', name: 'Aditya Sharma', role: 'Admin', avatar: 'AS', color: 'bg-blue-600' },
  { id: '2', name: 'Vikram Mehta', role: 'Project Manager', avatar: 'VM', color: 'bg-purple-600' },
  { id: '3', name: 'Sara Khan', role: 'Compliance Officer', avatar: 'SK', color: 'bg-emerald-600' },
]

export function UserSelector() {
  const router = useRouter()
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(USERS[0])

  // Hydration handling and localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('nextgen_user')
    if (savedUser) {
      const found = USERS.find(u => u.id === savedUser)
      if (found) setCurrentUser(found)
    }
  }, [])

  const handleUserChange = (user: typeof USERS[0]) => {
    setCurrentUser(user)
    localStorage.setItem('nextgen_user', user.id)
    setIsOpen(false)
    // Optional: Refresh page or trigger a store update if needed
    window.dispatchEvent(new Event('storage')) 
  }

  const handleLogout = (): void => {
    logout()
    setIsOpen(false)
    router.push('/login')
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all active:scale-95 group"
      >
        <div className={`w-9 h-9 rounded-full ${currentUser.color} flex items-center justify-center font-bold text-sm shadow-lg shadow-black/20 ring-2 ring-white/5 group-hover:ring-blue-500/50 transition-all`}>
          {currentUser.avatar}
        </div>
        <div className="text-left hidden lg:block">
          <p className="text-sm font-bold text-white leading-none">{currentUser.name}</p>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">{currentUser.role}</p>
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-64 bg-[#12121a] border border-[#ffffff14] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            <div className="p-4 border-b border-[#ffffff14] bg-[#ffffff03]">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Switch Account</p>
              <div className="space-y-1">
                {USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserChange(user)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${
                      currentUser.id === user.id 
                        ? 'bg-blue-600/10 text-blue-400' 
                        : 'hover:bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${user.color} flex items-center justify-center font-bold text-xs shrink-0`}>
                      {user.avatar}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold leading-none">{user.name}</p>
                      <p className="text-[10px] opacity-60 mt-1">{user.role}</p>
                    </div>
                    {currentUser.id === user.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all text-sm font-medium"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
