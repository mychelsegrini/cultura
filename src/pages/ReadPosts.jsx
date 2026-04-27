import './ReadPosts.css'
import { supabase } from '../client.js'
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Post from '../components/Post.jsx'

const ReadPosts = (props) => {
  const { category } = useParams()
  const [posts, setPosts] = useState([])

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('Posts')
      .select()
      .eq('category', category)
      .order('votes', { ascending: true })

    setPosts(data)
  }

  useEffect(() => {
    fetchPosts()
  }, [props])

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

      <div className="feed__list">
        {posts && posts.length > 0 ? (
          [...posts]
            .sort((a, b) => a.votes - b.votes)
            .map((post) => (
              <Post
                props={post}
                key={post.id}
                session={props.session}
              />
            ))
        ) : (
          <p className="feed__empty">{`No posts about ${category} right now.`}</p>
        )}
      </div>
    </section>
  )
}

export default ReadPosts;
