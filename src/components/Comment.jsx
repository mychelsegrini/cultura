import './Comment.css'
import { useState } from 'react'
import { supabase } from '../client'

const MAX_VISUAL_DEPTH = 6

const formatDate = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
}

const Comment = ({ comment, session, postId, onChange, depth = 0 }) => {
  const username = session?.user?.user_metadata?.username
  const isAuthenticated = !!session

  const [local, setLocal] = useState(comment)
  const [votedUp, setVotedUp] = useState(
    !!username && comment.voted_up?.includes(username)
  )
  const [votedDown, setVotedDown] = useState(
    !!username && comment.voted_down?.includes(username)
  )

  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const persistVote = async (next) => {
    await supabase
      .from('comments')
      .update({
        votes: next.votes,
        voted_up: next.voted_up,
        voted_down: next.voted_down,
      })
      .eq('id', comment.id)
  }

  const handleUp = async () => {
    if (!isAuthenticated) return
    let newVotes = local.votes
    let newVotedUp = [...(local.voted_up || [])]
    let newVotedDown = [...(local.voted_down || [])]

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
    const next = {
      ...local,
      votes: newVotes,
      voted_up: newVotedUp,
      voted_down: newVotedDown,
    }
    setLocal(next)
    await persistVote(next)
    if (onChange) onChange()
  }

  const handleDown = async () => {
    if (!isAuthenticated) return
    let newVotes = local.votes
    let newVotedUp = [...(local.voted_up || [])]
    let newVotedDown = [...(local.voted_down || [])]

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
    const next = {
      ...local,
      votes: newVotes,
      voted_up: newVotedUp,
      voted_down: newVotedDown,
    }
    setLocal(next)
    await persistVote(next)
    if (onChange) onChange()
  }

  const submitReply = async (event) => {
    event.preventDefault()
    if (!replyText.trim() || !isAuthenticated) return
    setSubmitting(true)
    const { error } = await supabase.from('comments').insert({
      post_id: Number(postId),
      parent_comment_id: comment.id,
      username,
      content: replyText.trim(),
      votes: 0,
      voted_up: [],
      voted_down: [],
    })
    setSubmitting(false)

    if (error) {
      console.error(error)
      return
    }
    setReplyText('')
    setShowReply(false)
    if (onChange) onChange()
  }

  const visualDepth = Math.min(depth, MAX_VISUAL_DEPTH)

  return (
    <div
      className={'Comment' + (depth > 0 ? ' Comment--nested' : '')}
      style={{
        marginLeft: depth > 0 ? `${visualDepth * 18}px` : 0,
      }}
    >
      <div className="Comment__body">
        <header className="Comment__header">
          <span className="Comment__author">{local.username}</span>
          {local.created_at && (
            <time className="Comment__time" dateTime={local.created_at}>
              {formatDate(local.created_at)}
            </time>
          )}
        </header>

        <p className="Comment__content">{local.content}</p>

        <div className="Comment__actions">
          <div
            className={
              'vote-control vote-control--sm' +
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
            <span className="vote-count">{local.votes}</span>
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

          {isAuthenticated && (
            <button
              type="button"
              className="Comment__reply-btn"
              onClick={() => setShowReply((v) => !v)}
            >
              {showReply ? 'Cancel' : 'Reply'}
            </button>
          )}
        </div>

        {showReply && (
          <form onSubmit={submitReply} className="Comment__reply-form">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${local.username}…`}
            />
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !replyText.trim()}
              >
                {submitting ? 'Posting…' : 'Post reply'}
              </button>
            </div>
          </form>
        )}
      </div>

      {comment.children && comment.children.length > 0 && (
        <div className="Comment__children">
          {comment.children.map((child) => (
            <Comment
              key={child.id}
              comment={child}
              session={session}
              postId={postId}
              onChange={onChange}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Comment
