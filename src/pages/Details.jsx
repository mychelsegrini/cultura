import { supabase } from '../client'
import { useState, useEffect } from 'react'

export default function Details({session}) {
    const { id } = useParams()
    if(!session) window.location = `/`

    const [post, setPost] = useState(null)

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

    useEffect(() => { initializePost() },
    [session])
}