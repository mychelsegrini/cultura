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
        acclaimed writer from two thousand years ago. You hate it? Express it. You love it? Then, why? <br/>
        Every opinion is validated with argumentation.
      </p>
      <br/>
      <br/>
      <p className="home__intro home__intro--accent">
        "But many mortals are devoted to their bellies and to sleep; without learning <br/>
        and without culture, they pass through life like tourists."
      </p>
      <p className="home__intro">Sallust</p>
    </section>
  )
}

export default HomePage
