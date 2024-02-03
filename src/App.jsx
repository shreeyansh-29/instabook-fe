import {Route, Switch} from "react-router-dom";
import Homepage from "./pages/homePage";
import ChatPage from "./pages/chatPage";
import "./App.css";

const App = () => {
  return (
    <div className="App">
      <Switch>
        <Route exact path="/" component={Homepage} />
        <Route path="/chats" component={ChatPage} />
      </Switch>
    </div>
  );
};

export default App;
