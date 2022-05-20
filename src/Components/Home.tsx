import { Link, useNavigate } from 'react-router-dom';
import logo from '../logo.svg';
import PlayTest from './PlayTest';
import classnames from 'classnames';
export default function Home() {
  const navigate = useNavigate();
    return (
        <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          // href="https://reactjs.org"
          // target="_blank"
          rel="noopener noreferrer"
          onClick={() => {navigate("/Playtest")}}
        >
          Learn React
        </a>
        <button onClick={() => {navigate("/Playtest")}} className="btn btn-primary">Go!</button>
        <Link to={'/Playtest'} className={classnames('btn', 'btn-primary')}>Playtest</Link>
      </header>
    );
}