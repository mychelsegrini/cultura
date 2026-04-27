import './ReadPosts.css'
import { supabase } from '../client.js'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Post from '../components/Post.jsx'

const SORT_OPTIONS = {
  popular: { label: 'Most Popular', column: 'votes', ascending: false },
  newest: { label: 'Newest First', column: 'created_at', ascending: false },
  oldest: { label: 'Oldest First', column: 'created_at', ascending: true },
}

// Escape characters with special meaning to Postgres `ilike`
const escapeForIlike = (raw) =>
  raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')

const ReadPosts = (props) => {
  const { category } = useParams()
  const [posts, setPosts] = useState([])
  const [sortKey, setSortKey] = useState('popular')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Debounce typing into the search field so we don't query Supabase
  // on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput.trim()), 250)
    return () => clearTimeout(id)
  }, [searchInput])

  const fetchPosts = async () => {
    setLoading(true)
    const sort = SORT_OPTIONS[sortKey]

    let query = supabase
      .from('Posts')
      .select()
      .eq('category', category)

    if (searchQuery) {
      query = query.ilike('title', `%${escapeForIlike(searchQuery)}%`)
    }

    const { data, error } = await query.order(sort.column, {
      ascending: sort.ascending,
    })

    if (error) {
      console.error(error)
      setPosts([])
    } else {
      setPosts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [category, sortKey, searchQuery])

  // Reset search when the category changes so users start with a clean slate.
  useEffect(() => {
    setSearchInput('')
    setSearchQuery('')
  }, [category])

  const isSearching = !!searchQuery
  const showEmptyState = !loading && posts.length === 0

  return (
    <section className="feed">
      <header className="feed__header">
        <h2 className="feed__title">
          <small>Conversations on</small>
          {category}
        </h2>
        <Link to={`/new/${category}`} className="feed__cta">
          What are you thinking today?
        </Link>
      </header>

      <div className="feed__toolbar">
        <div className="feed__search" role="search">
          <svg
            className="feed__search-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <line
              x1="16.2"
              y1="16.2"
              x2="20.5"
              y2="20.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            id="feed-search"
            className="feed__search-input"
            placeholder={`Search ${category} by title…`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label={`Search ${category} posts by title`}
          />
          {searchInput && (
            <button
              type="button"
              className="feed__search-clear"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="feed__toolbar-spacer" />

        <label htmlFor="feed-sort" className="feed__sort-label">
          Sort by
        </label>
        <div className="feed__sort">
          <select
            id="feed-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <svg
            className="feed__sort-caret"
            viewBox="0 0 12 8"
            aria-hidden="true"
          >
            <path
              d="M1 1l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {isSearching && !loading && (
        <p className="feed__search-summary">
          {posts.length === 0
            ? `No matches for “${searchQuery}”.`
            : `${posts.length} ${posts.length === 1 ? 'result' : 'results'} for “${searchQuery}”.`}
        </p>
      )}

      <div className="feed__list">
        {loading ? (
          <p className="feed__empty feed__empty--quiet">Gathering thoughts…</p>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Post props={post} key={post.id} session={props.session} />
          ))
        ) : showEmptyState && isSearching ? (
          <p className="feed__empty">
            {`No ${category} posts match “${searchQuery}”. Try a different word.`}
          </p>
        ) : (
          <p className="feed__empty">{`No posts about ${category} right now.`}</p>
        )}
      </div>
    </section>
  )
}

export default ReadPosts
