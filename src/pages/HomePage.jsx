import './HomePage.css'
import Auth from './Auth.jsx'

const HomePage = ({ session }) => {
  if (!session) {
    return (
      <div className="home">
        <h2 className="home__guest-title">Join the Discussion</h2>
        <Auth />
      </div>
    );
  }

  const username = session.user.user_metadata?.username || 'Anonymous';

  return (
    <section className="home">
      <h2 className="home__welcome">{`Welcome to Cultura, ${username}.`}</h2>
      <hr className="home__divider" />
      <p className="home__intro">
        Here, you are free to express your opinion — even if it concerns an
        acclaimed writer from a century ago.
      </p>
      <p className="home__intro">
        You hate it? Express it. You love it? Then, why?
      </p>
      <p className="home__intro home__intro--accent">
        Of course, every opinion is validated with argumentation. Be yourself.
      </p>
    </section>
  )
}

export default HomePage
