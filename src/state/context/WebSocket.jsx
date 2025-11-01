import { createContext, useContext, useEffect, useRef } from "react";
import { selectAccessToken } from "../redux/auth/authSlice";
import { useSelector } from "react-redux";

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

const WebSocketProvider = ({ children }) => {
  /** @type {React.MutableRefObject<WebSocket>} */
  const webSocket = useRef(null);
  const token = useSelector(selectAccessToken);
  const subscribers = useRef({});

  const subscribe = (type, callback, id) => {
    if (!type) throw new Error("type is required to subscribe to socket");
    if (!id) throw new Error("id is required to subscribe to socket");
    if (!subscribers.current[type]) subscribers.current[type] = {};
    subscribers.current = {
      ...subscribers.current,
      [type]: {
        ...subscribers.current[type],
        [id]: callback,
      },
    };
    console.log(subscribers.current);
  };

  const unsubscribe = (type, id) => {
    if (!subscribers.current[type]) return;
    delete subscribers.current[type][id];
    console.log(subscribers.current);
  };

  useEffect(() => {
    if (!token) return;
    // In Vercel serverless, native WebSocket backends are not supported.
    // Only attempt connection if a socket URL is explicitly provided.
    if (webSocket.current) webSocket.current.close();
    console.log("Connecting to socket...");
    const socketUrl = import.meta.env.VITE_API_SOCKET_URL;
    if (!socketUrl) {
      console.log("Skipping WebSocket connect: VITE_API_SOCKET_URL not set.");
      return;
    }
    webSocket.current = new WebSocket(socketUrl);
    webSocket.current.onopen = () => {
      console.log("Connected to socket.");
      webSocket.current.send(JSON.stringify(["auth:connect", { token }]));
    };
    webSocket.current.onclose = () => {
      console.log("Disconnected from socket.");
    };
    webSocket.current.onmessage = (e) => {
      console.log(e);
      try {
        const [type, payload] = JSON.parse(e.data);
        console.log(type, payload);
        if (!subscribers.current[type]) return;
        console.log("Calling subscribers...");
        console.log(subscribers.current[type]);
        Object.values(subscribers.current[type]).forEach((callback) =>
          callback(payload)
        );
      } catch (err) {
        console.error(err);
      }
    };
    webSocket.current.onerror = (err) => {
      console.error(err);
    };
    return () => {
      webSocket.current.close();
    };
  }, [token]);

  const value = {
    subscribe,
    unsubscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
