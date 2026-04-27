import './App.css';
import React from 'react';
import { useRoutes, NavLink, Link } from 'react-router-dom'
import ReadPosts from './pages/ReadPosts'
import CreatePost from './pages/CreatePost'
import EditPost from './pages/EditPost'
import HomePage from './pages/HomePage'
import Auth from './pages/Auth'
import Details from './pages/Details'

import { supabase } from './client'
import { useEffect, useState } from 'react'

function App() {
  const posts = []

  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const navLinkClass = ({ isActive }) =>
    isActive ? 'nav-link is-active' : 'nav-link'

  let element = useRoutes([
    {
      path: "/:category",
      element: <ReadPosts data={posts} session ={session}/>
    },
    {
      path: "/edit/:id",
      element: <EditPost data={posts} session={session} />
    },
    {
      path: "/new/:category",
      element: <CreatePost session={session}/>
    },
    {
      path: "/",
      element: <HomePage session={session} />
    },
    {
      path: "/details/:id",
      element: <Details session={session} />
    }
  ]);

  return (
    <div className="App">
      <header className="app-header">
        <div className="app-header__inner">
          <h1 className="app-header__brand">
            <Link to="/">Cultura</Link>
          </h1>
          <nav className="app-header__nav">
            <NavLink to="/books" className={navLinkClass}>Books</NavLink>
            <NavLink to="/movies" className={navLinkClass}>Movies</NavLink>
            <NavLink to="/music" className={navLinkClass}>Music</NavLink>
            {session && (
              <button onClick={handleSignOut} className="btn btn-ghost">
                Sign Out
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="app-main">
        {element}
      </main>
    </div>
  )
}

export default App
