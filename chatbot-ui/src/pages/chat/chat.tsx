import { ChatInput } from "@/components/custom/chatinput";
import { useTheme } from "@/context/ThemeContext";
import { PreviewMessage, ThinkingMessage } from "../../components/custom/message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";
import { useState, useRef } from "react";
import { message } from "../../interfaces/interfaces";
import { Overview } from "@/components/custom/overview";
import { Header } from "@/components/custom/header";
import { v4 as uuidv4 } from "uuid";

const socket = new WebSocket("ws://localhost:8090"); // Change to your websocket endpoint

export function Chat() {
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [messages, setMessages] = useState<message[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const { isDarkMode } = useTheme();

  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  const cleanupMessageHandler = () => {
    if (messageHandlerRef.current && socket) {
      socket.removeEventListener("message", messageHandlerRef.current);
      messageHandlerRef.current = null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(""); // Clear any previous video URL to ensure the video isn't shown prematurely.
  
      // Send the video file to the server
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const message = {
            type: "video",
            filename: file.name,
            size: file.size,
          };
  
          // Send metadata first
          socket.send(JSON.stringify(message));
  
          // Send the video file data as binary
          socket.send(reader.result);
          console.log("Video sent to server.");
        }
      };
  
      reader.readAsArrayBuffer(file); // Read the file as binary data
  
      // Wait for the server confirmation
      socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        if (data.status === "video_processed") {
          // Once the backend sends the confirmation, set the video URL.
          setVideoUrl(URL.createObjectURL(file)); // Set video URL only after processing is done.
          console.log("Video successfully processed:", data.data);
        }
      });
    }
  };
  
  

  async function handleSubmit(text?: string) {
    if (!socket || socket.readyState !== WebSocket.OPEN || isLoading || !videoFile) return;
  
    const messageText = text || question;
    setIsLoading(true);
    cleanupMessageHandler();
  
    const traceId = uuidv4();
    setMessages((prev) => [...prev, { content: messageText, role: "user", id: traceId }]);
    setQuestion("");
  
    try {
      // Now you're sending only the question, not the video again.
      socket.send(JSON.stringify({ type: "question", question: messageText }));
  
      // Set up the message handler for server responses
      const messageHandler = (event: MessageEvent) => {
        setIsLoading(false);
        if (event.data.includes("[END]")) {
          return;
        }
  
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          const newContent =
            lastMessage?.role === "assistant" ? lastMessage.content + event.data : event.data;
  
          const newMessage = { content: newContent, role: "assistant", id: traceId };
          return lastMessage?.role === "assistant"
            ? [...prev.slice(0, -1), newMessage]
            : [...prev, newMessage];
        });
  
        if (event.data.includes("[END]")) {
          cleanupMessageHandler();
        }
      };
  
      messageHandlerRef.current = messageHandler;
      socket.addEventListener("message", messageHandler);
    } catch (error) {
      console.error("WebSocket error:", error);
      setIsLoading(false);
    }
  }
  

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <Header />
      <div className="flex flex-col md:flex-row min-w-0 h-full justify-between ">
        {/* Left Section: Video Upload */}
        <div
          className={`flex flex-col w-full md:w-1/2 px-4 border-b md:border-r md:border-b-0 ${isDarkMode ? "border-neutral-900 black" : "border-gray-200 bg-white-50"
            }`}
        >
          <h2
            className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-gray-100" : "text-neutral-800"
              }`}
          >
            Upload a Video
          </h2>
          {!videoFile ? (
            <div
              className={`flex flex-col items-center justify-center p-4 border border-dashed rounded-lg cursor-pointer h-60 transition md:h-1/2 lg:h-1/3 lg:mt-16 ${isDarkMode
                ? "border-gray-600 bg-neutral-900 hover:bg-neutral-800"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                }`}
            >

              <label
                htmlFor="video-upload"
                className={`text-center ${isDarkMode ? "text-gray-300 hover:text-gray-200" : "text-neutral-600 hover:text-gray-500"
                  } cursor-pointer`}
              >
                Click to upload a video
              </label>
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Supported formats: MP4, WebM, AVI, etc.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <video
                src={videoUrl}
                controls
                className="w-full rounded-lg shadow-md"
              />
              <p
                className={`mt-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
              >
                Video uploaded successfully.
              </p>
            </div>
          )}
        </div>


        {/* Right Section: Chat */}
        <div className="flex flex-col w-full md:w-1/2 p-4">
          {isDarkMode ? <h2 className="text-lg font-semibold text-gray-100 mb-4">Chatbot</h2> : <h2 className="text-lg font-semibold text-gray-800 mb-4">Chatbot</h2>}
          <div
            className={`flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 ${!videoFile ? "opacity-50 pointer-events-none" : ""
              }`}
            ref={messagesContainerRef}
          >
            {messages.length === 0 && <Overview />}
            {messages.map((message, index) => (
              <PreviewMessage key={index} message={message} />
            ))}
            {isLoading && <ThinkingMessage />}
            <div ref={messagesEndRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
          </div>
          {videoFile && (
            <div className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full">
              <ChatInput
                question={question}
                setQuestion={setQuestion}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
