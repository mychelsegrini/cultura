import './Post.css'
import more from './more.png'
import { Link } from 'react-router-dom'

const Post = (props) => {
  return (
    <article className="Post">
      <Link to={'/edit/' + props.id} aria-label="Edit post">
        <img className="moreButton" alt="edit button" src={more} />
      </Link>
      <p className="user">{props.user}</p>
      <h3 className="title">{props.title}</h3>
      <p className="text">{props.text}</p>
    </article>
  );
};

export default Post
