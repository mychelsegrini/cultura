import './CreatePost.css'
import { supabase } from '../client'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

const CreatePost = () => {
  const { category, user } = useParams()
  const [post, setPost] = useState({ user: user, text: "", title: "", category: category, votes: 0 })

  const createPost = async (event) => {
    event.preventDefault()
    if (post.title == null || post.text == null) {
      window.alert("Finish your post before submitting.")
      return
    }
    await supabase
      .from('Posts')
      .insert({ user: post.user, text: post.text, title: post.title, category: post.category, votes: post.votes })
      .select()

    window.location = `/${category}`;
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setPost((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <section className="post-form">
      <h2 className="post-form__title">Share a Thought</h2>
      <p className="post-form__subtitle">
        {category ? `Category: ${category}` : 'Tell the community what you are thinking.'}
      </p>

      <form className="form">
        <div className="post-form__field">
          <label htmlFor="title">About what are you thinking?</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="A title for your thought…"
            onChange={handleChange}
          />
        </div>

        <div className="post-form__field">
          <label htmlFor="text">Express your opinion</label>
          <textarea
            id="text"
            name="text"
            placeholder="What did you think? What did you feel?"
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button type="submit" onClick={createPost} className="btn btn-primary">
            Publish
          </button>
        </div>
      </form>
    </section>
  )
}

export default CreatePost;
