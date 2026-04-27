import './EditPost.css'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../client'

const EditPost = ({ session }) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const username = session?.user?.user_metadata?.username

  useEffect(() => {
    if (!session) navigate('/')
  }, [session, navigate])

  const [post, setPost] = useState({ text: '', title: '' })
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
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
    setRemoveExistingImage(false)
  }

  const initializePost = async () => {
    const { data, error: fetchError } = await supabase
      .from('Posts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      setError('Could not load this post.')
      return
    }
    setPost(data)
  }

  useEffect(() => {
    initializePost()
  }, [id])

  const uploadImageIfPresent = async () => {
    if (!imageFile) return undefined

    const fileExt = imageFile.name.split('.').pop()
    const safeName = `${session.user.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${fileExt}`
    const path = `${post.category || 'misc'}/${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(path, imageFile, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('post-images').getPublicUrl(path)
    return data.publicUrl
  }

  const updatePost = async (event) => {
    event.preventDefault()
    if (username !== post.user) {
      setError('You can only edit your own posts.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const uploaded = await uploadImageIfPresent()
      const update = {
        user: post.user,
        text: post.text,
        title: post.title,
        category: post.category,
      }
      if (uploaded !== undefined) update.image_url = uploaded
      else if (removeExistingImage) update.image_url = null

      const { error: updateError } = await supabase
        .from('Posts')
        .update(update)
        .eq('id', id)

      if (updateError) throw updateError
      navigate(`/${post.category}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const deletePost = async () => {
    if (!window.confirm('Delete this post permanently?')) return
    await supabase.from('Posts').delete().eq('id', id)
    navigate(`/${post.category || ''}`)
  }

  const showCurrent =
    post.image_url && !previewUrl && !removeExistingImage

  return (
    <section className="post-form post-form--edit">
      <h2 className="post-form__title">Edit Thought</h2>
      <p className="post-form__subtitle">Refine what you wanted to say.</p>

      <form className="form" onSubmit={updatePost}>
        <div className="post-form__field">
          <label htmlFor="title">About what are you thinking?</label>
          <input
            type="text"
            id="title"
            name="title"
            value={post.title || ''}
            onChange={handleChange}
          />
        </div>

        <div className="post-form__field">
          <label htmlFor="text">Express your opinion</label>
          <textarea
            id="text"
            name="text"
            value={post.text || ''}
            onChange={handleChange}
          />
        </div>

        <div className="post-form__field">
          <label htmlFor="image">Image (optional)</label>

          {showCurrent && (
            <div className="post-form__image-preview">
              <img src={post.image_url} alt="Current attachment" />
              <div className="post-form__image-actions">
                <label className="btn btn-outline" htmlFor="image">
                  Replace image
                </label>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRemoveExistingImage(true)}
                >
                  Remove image
                </button>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleFile}
                  hidden
                />
              </div>
            </div>
          )}

          {previewUrl && (
            <div className="post-form__image-preview">
              <img src={previewUrl} alt="New attachment preview" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null)
                  setPreviewUrl(null)
                }}
                className="btn btn-outline post-form__image-remove"
              >
                Cancel new image
              </button>
            </div>
          )}

          {!post.image_url && !previewUrl && (
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

          {removeExistingImage && !previewUrl && (
            <p className="form-message">
              Image will be removed when you save.{' '}
              <button
                type="button"
                className="link-inline"
                onClick={() => setRemoveExistingImage(false)}
              >
                Undo
              </button>
            </p>
          )}
        </div>

        {error && <p className="form-message">{error}</p>}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={deletePost}
            className="btn btn-outline"
          >
            Delete
          </button>
        </div>
      </form>
    </section>
  )
}

export default EditPost
