import './Post.css'
import more from './more.png'
import up from '../assets/up.png'
import upFilled from '../assets/upFilled.png'
import down from '../assets/down.png'
import downFilled from '../assets/downFilled.png'
import { Link } from 'react-router-dom'
import {supabase} from '../client'
import {useState} from 'react'

const Post = ({props, session}) => {
  const username = session.user.user_metadata?.username
  const [votedUp, setVotedUp] = useState(props.voted_up.includes(username))
  const [votedDown, setVotedDown] = useState(props.voted_down.includes(username))

  const [post, setPost] = useState(props);

  const handleUp = async (event) => {
    event.preventDefault()

    let newVotes = post.votes
    let newVotedUp = [...post.voted_up]
    let newVotedDown = [...post.voted_down]

    if(votedUp) {
      newVotes--
      setVotedUp(false)
      newVotedUp = newVotedUp.filter((user) => user !== username);
    } else{
      if(votedDown){
        newVotes += 2
        newVotedDown = newVotedDown.filter((user) => user !== username)
        setVotedDown(false)
      } else newVotes += 1
      
      setVotedUp(true)
      
      newVotedUp.push(username)
    }

    const updatedPost = {
      ...post,
      votes: newVotes,
      voted_up: newVotedUp,
      voted_down: newVotedDown
    }

    setPost(updatedPost);

    await supabase
      .from('Posts')
      .update({ votes: newVotes, voted_up: newVotedUp, voted_down: newVotedDown })
      .eq('id', props.id)
  }

  const handleDown = async (event) => {
    event.preventDefault()

    let newVotes = post.votes
    let newVotedUp = post.voted_up
    let newVotedDown = post.voted_down

    if(votedDown) {
      newVotes++
      setVotedDown(false)
      newVotedDown = newVotedDown.filter((user) => user !== username);
    } else{
      if(votedUp){
        newVotes -= 2
        newVotedUp = newVotedUp.filter((user) => user !== username)
        setVotedUp(false)
      } else newVotes--
      
      setVotedDown(true)
      
      newVotedDown.push(username)
    }

    const updatedPost = {
      ...post,
      votes: newVotes,
      voted_up: newVotedUp,
      voted_down: newVotedDown
    }

    setPost(updatedPost);

    await supabase
      .from('Posts')
      .update({ votes: newVotes, voted_up: newVotedUp, voted_down: newVotedDown })
      .eq('id', props.id)
  }

  return (
    <article className="Post">
      <Link to={'/edit/' + props.id} aria-label="Edit post">
        <img className="moreButton" alt="edit button" src={more} />
      </Link>
      <p className="user">{props.user}</p>
      <h3 className="title">{props.title}</h3>
      <p className="text">{props.text}</p>
      <p className="votes">{post.votes}</p>
      <img className='upArrow' src={votedUp ? upFilled : up} onClick={handleUp}/>
      <img className='downArrow' src={votedDown ? downFilled : down} onClick={handleDown}/>
    </article>
  );
};

export default Post
