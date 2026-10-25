import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./workbench.css";
class Boundary extends React.Component<
  { children: React.ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    return this.state.error ? (
      <div className="error-screen">
        <h1>场景加载遇到问题</h1>
        <p>{this.state.error}</p>
        <p>请使用支持 WebGL2 的桌面浏览器，并确认模型文件可访问。</p>
        <button onClick={() => location.reload()}>重新加载</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <Boundary>
    <App />
  </Boundary>,
);
