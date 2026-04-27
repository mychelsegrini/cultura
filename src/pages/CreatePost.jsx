import './CreatePost.css'
import { supabase } from '../client'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const CreatePost = ({ session }) => {
  const { category } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!session) navigate(`/${category}`)
  }, [session, category, navigate])

  const username = session?.user?.user_metadata?.username

  const [post, setPost] = useState({
    user: username,
    text: '',
    title: '',
    category: category,
    votes: 0,
    voted_up: [],
    voted_down: [],
  })

  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setPost((prev) => ({ ...prev, [name]: value }))
  }

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    setError('')
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setPreviewUrl(null)
  }

  const uploadImageIfPresent = async () => {
    if (!imageFile) return null

    const fileExt = imageFile.name.split('.').pop()
    const safeName = `${session.user.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${fileExt}`
    const path = `${category}/${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(path, imageFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('post-images').getPublicUrl(path)
    return data.publicUrl
  }

  const createPost = async (event) => {
    event.preventDefault()
    if (!post.title?.trim() || !post.text?.trim()) {
      setError('Please add both a title and some thoughts before publishing.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const imageUrl = await uploadImageIfPresent()
      const { error: insertError } = await supabase
        .from('Posts')
        .insert({ ...post, image_url: imageUrl })
        .select()

      if (insertError) throw insertError
      navigate(`/${category}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="post-form">
      <h2 className="post-form__title">Share a Thought</h2>
      <p className="post-form__subtitle">
        {category
          ? `Category: ${category}`
          : 'Tell the community what you are thinking.'}
      </p>

      <form className="form" onSubmit={createPost}>
        <div className="post-form__field">
          <label htmlFor="title">About what are you thinking?</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="A title for your thought…"
            value={post.title}
            onChange={handleChange}
          />
        </div>

        <div className="post-form__field">
          <label htmlFor="text">Express your opinion</label>
          <textarea
            id="text"
            name="text"
            placeholder="What did you think? What did you feel?"
            value={post.text}
            onChange={handleChange}
          />
        </div>

        <div className="post-form__field">
          <label htmlFor="image">An image to set the mood (optional)</label>

          {previewUrl ? (
            <div className="post-form__image-preview">
              <img src={previewUrl} alt="Selected attachment preview" />
              <button
                type="button"
                onClick={removeImage}
                className="btn btn-outline post-form__image-remove"
              >
                Remove image
              </button>
            </div>
          ) : (
            <label className="post-form__file-drop" htmlFor="image">
              <span className="post-form__file-drop-title">
                Click to upload an image
              </span>
              <span className="post-form__file-drop-hint">
                A book cover, a film still, an album sleeve…
              </span>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleFile}
                hidden
              />
            </label>
          )}
        </div>

        {error && <p className="form-message">{error}</p>}

        <div className="form-actions">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default CreatePost
