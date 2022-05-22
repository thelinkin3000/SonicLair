import { Link, useNavigate } from 'react-router-dom';
import logo from '../logo.svg';
import PlayTest from './PlayTest';
import classnames from 'classnames';
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  setTimeout(() => { navigate("/playtest") }, 3000);
  return (
    <header className="App-header">
      <motion.div
        className="container"
        initial={{ scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}>
      <img src={logo} className="App-logo" alt="logo" />
        </motion.div>
      <p>
        SonicLair
      </p>

    </header>
  );
}