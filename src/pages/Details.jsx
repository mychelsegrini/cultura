import './Details.css'
import { supabase } from '../client'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Comment from '../components/Comment'

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const datePart = d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${datePart} at ${timePart}`
}

export default function Details({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const username = session?.user?.user_metadata?.username
  const isAuthenticated = !!session

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [error, setError] = useState('')

  const [votedUp, setVotedUp] = useState(false)
  const [votedDown, setVotedDown] = useState(false)

  const fetchPost = async () => {
    const { data, error: fetchError } = await supabase
      .from('Posts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      setError('Could not load this post.')
      setLoading(false)
      return
    }
    setPost(data)
    setVotedUp(!!username && data.voted_up?.includes(username))
    setVotedDown(!!username && data.voted_down?.includes(username))
    setLoading(false)
  }

  const fetchComments = async () => {
    const { data, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', id)

    if (fetchError) {
      console.error(fetchError)
      return
    }
    setComments(data || [])
  }

  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [id])

  const persistPostVote = async (newPost) => {
    await supabase
      .from('Posts')
      .update({
        votes: newPost.votes,
        voted_up: newPost.voted_up,
        voted_down: newPost.voted_down,
      })
      .eq('id', id)
  }

  const handleUp = async () => {
    if (!isAuthenticated || !post) return
    let newVotes = post.votes
    let newVotedUp = [...(post.voted_up || [])]
    let newVotedDown = [...(post.voted_down || [])]

    if (votedUp) {
      newVotes--
      setVotedUp(false)
      newVotedUp = newVotedUp.filter((u) => u !== username)
    } else {
      if (votedDown) {
        newVotes += 2
        newVotedDown = newVotedDown.filter((u) => u !== username)
        setVotedDown(false)
      } else newVotes++
      setVotedUp(true)
      newVotedUp.push(username)
    }
    const updated = {
      ...post,
      votes: newVotes,
      voted_up: newVotedUp,
      voted_down: newVotedDown,
    }
    setPost(updated)
    await persistPostVote(updated)
  }

  const handleDown = async () => {
    if (!isAuthenticated || !post) return
    let newVotes = post.votes
    let newVotedUp = [...(post.voted_up || [])]
    let newVotedDown = [...(post.voted_down || [])]

    if (votedDown) {
      newVotes++
      setVotedDown(false)
      newVotedDown = newVotedDown.filter((u) => u !== username)
    } else {
      if (votedUp) {
        newVotes -= 2
        newVotedUp = newVotedUp.filter((u) => u !== username)
        setVotedUp(false)
      } else newVotes--
      setVotedDown(true)
      newVotedDown.push(username)
    }
    const updated = {
      ...post,
      votes: newVotes,
      voted_up: newVotedUp,
      voted_down: newVotedDown,
    }
    setPost(updated)
    await persistPostVote(updated)
  }

  const submitComment = async (event) => {
    event.preventDefault()
    if (!isAuthenticated) return
    if (!newComment.trim()) return

    setPostingComment(true)
    const { error: insertError } = await supabase.from('comments').insert({
      post_id: Number(id),
      parent_comment_id: null,
      username,
      content: newComment.trim(),
      votes: 0,
      voted_up: [],
      voted_down: [],
    })
    setPostingComment(false)

    if (insertError) {
      console.error(insertError)
      setError('Could not post comment.')
      return
    }
    setNewComment('')
    fetchComments()
  }

  const commentTree = useMemo(() => {
    const map = {}
    const roots = []
    comments.forEach((c) => {
      map[c.id] = { ...c, children: [] }
    })
    comments.forEach((c) => {
      const node = map[c.id]
      if (c.parent_comment_id && map[c.parent_comment_id]) {
        map[c.parent_comment_id].children.push(node)
      } else {
        roots.push(node)
      }
    })
    const sortNodes = (nodes) => {
      nodes.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
      nodes.forEach((n) => sortNodes(n.children))
    }
    sortNodes(roots)
    return roots
  }, [comments])

  if (loading) {
    return <p className="details__loading">Loading…</p>
  }

  if (!post) {
    return (
      <section className="details details--missing">
        <h2>Post not found</h2>
        <p>{error || 'This conversation may have been removed.'}</p>
        <Link to="/" className="btn btn-primary">
          Return home
        </Link>
      </section>
    )
  }

  const isAuthor = username && username === post.user

  return (
    <section className="details">
      <nav className="details__breadcrumbs">
        <Link to="/">Home</Link>
        <span aria-hidden="true">·</span>
        {post.category && (
          <>
            <Link to={`/${post.category}`} style={{ textTransform: 'capitalize' }}>
              {post.category}
            </Link>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span className="details__breadcrumbs-current">Discussion</span>
      </nav>

      <article className="details__post">
        <header className="details__header">
          <p className="details__meta">
            <span className="details__author">{post.user}</span>
            {post.created_at && (
              <>
                <span aria-hidden="true">·</span>
                <time
                  className="details__time"
                  dateTime={post.created_at}
                >
                  {formatDate(post.created_at)}
                </time>
              </>
            )}
            {post.category && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tag">{post.category}</span>
              </>
            )}
          </p>
          <h1 className="details__title">{post.title}</h1>
          {isAuthor && (
            <Link to={`/edit/${post.id}`} className="details__edit">
              Edit
            </Link>
          )}
        </header>

        {post.image_url && (
          <figure className="details__figure">
            <img src={post.image_url} alt={post.title} />
          </figure>
        )}

        {post.text && <p className="details__body">{post.text}</p>}

        <footer className="details__footer">
          <div
            className={
              'vote-control vote-control--lg' +
              (votedUp ? ' vote-control--up' : '') +
              (votedDown ? ' vote-control--down' : '')
            }
          >
            <button
              type="button"
              className={
                'vote-btn vote-btn--up' + (votedUp ? ' is-active' : '')
              }
              onClick={handleUp}
              aria-label="Upvote"
              disabled={!isAuthenticated}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5l7 8h-4v6h-6v-6H5l7-8z" fill="currentColor" />
              </svg>
            </button>
            <span className="vote-count">{post.votes}</span>
            <button
              type="button"
              className={
                'vote-btn vote-btn--down' + (votedDown ? ' is-active' : '')
              }
              onClick={handleDown}
              aria-label="Downvote"
              disabled={!isAuthenticated}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 19l-7-8h4V5h6v6h4l-7 8z" fill="currentColor" />
              </svg>
            </button>
          </div>

          <span className="details__count">
            {comments.length}{' '}
            {comments.length === 1 ? 'reflection' : 'reflections'}
          </span>
        </footer>
      </article>

      <section className="comments">
        <h2 className="comments__title">Reflections</h2>

        {isAuthenticated ? (
          <form onSubmit={submitComment} className="comments__form">
            <label htmlFor="new-comment" className="form-label">
              Add your thoughts
            </label>
            <textarea
              id="new-comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What did this make you feel? What did it remind you of?"
            />
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={postingComment || !newComment.trim()}
              >
                {postingComment ? 'Posting…' : 'Post reflection'}
              </button>
            </div>
          </form>
        ) : (
          <p className="comments__signin">
            <Link to="/">Sign in</Link> to join the conversation.
          </p>
        )}

        <div className="comments__list">
          {commentTree.length === 0 && (
            <p className="comments__empty">
              No reflections yet — be the first to share one.
            </p>
          )}
          {commentTree.map((node) => (
            <Comment
              key={node.id}
              comment={node}
              session={session}
              postId={id}
              onChange={fetchComments}
              depth={0}
            />
          ))}
        </div>
      </section>
    </section>
  )
}
