import './Post.css'
import more from './more.png'
import { Link } from 'react-router-dom'
import { supabase } from '../client'
import { useState } from 'react'

const formatPostDate = (iso) => {
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

const Post = ({ props, session }) => {
  const username = session?.user?.user_metadata?.username
  const [post, setPost] = useState(props)
  const [votedUp, setVotedUp] = useState(
    !!username && props.voted_up?.includes(username)
  )
  const [votedDown, setVotedDown] = useState(
    !!username && props.voted_down?.includes(username)
  )

  const isAuthor = username && username === props.user

  const persistVote = async (newPost) => {
    await supabase
      .from('Posts')
      .update({
        votes: newPost.votes,
        voted_up: newPost.voted_up,
        voted_down: newPost.voted_down,
      })
      .eq('id', props.id)
  }

  const handleUp = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!username) return

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
      } else {
        newVotes += 1
      }
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
    await persistVote(updated)
  }

  const handleDown = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!username) return

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
      } else {
        newVotes--
      }
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
    await persistVote(updated)
  }

  return (
    <article className="Post">
      {isAuthor && (
        <Link
          to={'/edit/' + props.id}
          className="Post__edit"
          aria-label="Edit post"
          onClick={(e) => e.stopPropagation()}
        >
          <img className="moreButton" alt="" src={more} />
        </Link>
      )}

      <Link to={`/details/${props.id}`} className="Post__link">
        <p className="user">
          <span>{props.user}</span>
          {props.created_at && (
            <time className="Post__time" dateTime={props.created_at}>
              {formatPostDate(props.created_at)}
            </time>
          )}
        </p>
        <h3 className="title">{props.title}</h3>

        {props.image_url && (
          <div className="Post__image-wrap">
            <img
              className="Post__image"
              src={props.image_url}
              alt={props.title}
            />
          </div>
        )}

        {props.text && <p className="text">{props.text}</p>}
      </Link>

      <footer className="Post__footer">
        <div
          className={
            'vote-control' +
            (votedUp ? ' vote-control--up' : '') +
            (votedDown ? ' vote-control--down' : '')
          }
        >
          <button
            type="button"
            className={'vote-btn vote-btn--up' + (votedUp ? ' is-active' : '')}
            onClick={handleUp}
            aria-label="Upvote"
            aria-pressed={votedUp}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 5l7 8h-4v6h-6v-6H5l7-8z"
                fill="currentColor"
              />
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
            aria-pressed={votedDown}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 19l-7-8h4V5h6v6h4l-7 8z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <Link to={`/details/${props.id}`} className="Post__discuss">
          Read & discuss →
        </Link>
      </footer>
    </article>
  )
}

export default Post
