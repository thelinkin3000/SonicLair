import { Link } from 'react-router-dom';
import logo from '../logo.svg';
import PlayTest from './PlayTest';
import classnames from 'classnames';
export default function Home() {
    return (
        <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <Link to={'/Playtest'} className={classnames('btn', 'btn-primary')}>Playtest</Link>
      </header>
    );
}