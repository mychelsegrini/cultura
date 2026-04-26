import './EditPost.css'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../client'

const EditPost = () => {
  const [post, setPost] = useState({ text: "", title: "" })
  const { id } = useParams()

  const updatePost = async (event) => {
    event.preventDefault()
    await supabase
      .from('Posts')
      .update({ user: post.user, text: post.text, title: post.title, category: post.category, votes: post.votes })
      .eq('id', id)

    window.location = `/${post.category}`
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setPost((prev) => ({ ...prev, [name]: value }))
  }

  const initializePost = async () => {
    const { data, error } = await supabase
      .from("Posts")
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      window.alert("There has been an error: " + error)
    }
    setPost(data)
  }

  useEffect(() => { initializePost() }, [id])

  return (
    <section className="post-form post-form--edit">
      <h2 className="post-form__title">Edit Thought</h2>
      <p className="post-form__subtitle">Refine what you wanted to say.</p>

      <form className="form">
        <div className="post-form__field">
          <label htmlFor="title">About what are you thinking?</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder={post.title}
            value={post.title || ''}
            onChange={handleChange}
          />
        </div>

        <div className="post-form__field">
          <label htmlFor="text">Express your opinion</label>
          <textarea
            id="text"
            name="text"
            placeholder={post.text}
            value={post.text || ''}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button type="submit" onClick={updatePost} className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </form>
    </section>
  )
}

export default EditPost;
