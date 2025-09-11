import React, { createContext, useContext, useEffect, useState } from 'react'

type WebSocketContextType = {
  socket: WebSocket | null,
  isConnected: boolean,
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
})

export const useWebSocket = () => {
  return useContext(WebSocketContext)
}

export const WebSocketProvider = ({children}: {children: React.ReactNode}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    ws.onopen = () => {
      console.log("Websocket connected.")
      setIsConnected(true)
    }
    ws.onclose = () => {
      console.log("Websocket disconnected.")
      setIsConnected(false)
    }
    setSocket(ws);
    return () => {
      ws.close()
    }
  },[])

  const value = {socket, isConnected}
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export default WebSocketContext