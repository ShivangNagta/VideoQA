import { useState, useRef } from 'react';
import {
  Upload,
  Send,
  Video,
  MessageCircle,
  FileVideo,
  Github
} from 'lucide-react';

export default function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    setVideoFile(file);
    setVideoURL(URL.createObjectURL(file));
    setIsVideoReady(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/clip', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.ready) {
        setIsVideoReady(true);
        alert('Video is processed. You can chat now.')
      } else {
        alert('Video was uploaded, but processing failed.');
      }
    } catch (err) {
      alert('Upload failed. Ensure backend is running.');
    }
  };

  const sendQuestion = async () => {
    if (!videoFile || !question.trim()) return;

    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/llava', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setChat((prev) => [...prev, { user: question, bot: data.answer }]);
      setQuestion('');
    } catch (err) {
      alert('LLaVA query failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && isVideoReady) {
      sendQuestion();
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-neutral-900 via-zinc-800 to-neutral-900 text-white">
      {/* Header */}
<header className="bg-white/5 backdrop-blur-md border-b border-white/10">
  <div className="px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-zinc-600/30 rounded-lg">
        <Video className="w-6 h-6 text-zinc-300" />
      </div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
        VideoQnA
      </h1>
    </div>
    <a
      href="https://github.com/coderuhaan2004/VideoQA"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
    >
    <Github className="w-6 h-6" />
      <span className="hidden sm:inline">GitHub</span>
    </a>
  </div>
</header>


      {/* Main Content */}
      <main className="flex-1 flex flex-col xl:flex-row gap-6 px-4 py-6 overflow-hidden">
        {/* Video Upload Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex-1 overflow-auto">
            <div className="flex items-center gap-3 mb-6">
              <FileVideo className="w-5 h-5 text-slate-400" />
              <h2 className="text-xl font-semibold text-white">Video Upload</h2>
            </div>

            {!videoURL ? (
              <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 mb-4">Upload a video file to get started</p>
                <label className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Choose Video File
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  src={videoURL}
                  controls
                  className="w-full rounded-xl border border-white/10 shadow-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-5 h-5 text-slate-400" />
            <h2 className="text-xl font-semibold text-white">Ask Questions</h2>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
            {chat.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  Upload a video and start asking questions about its content
                </p>
              </div>
            ) : (
              chat.map((msg, idx) => (
                <div key={idx} className="space-y-3">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white rounded-2xl px-4 py-3 max-w-xs lg:max-w-md shadow-lg">
                      <p className="text-sm">{msg.user}</p>
                    </div>
                  </div>

                  {/* Bot Message */}
                  <div className="flex justify-start">
                    <div className="bg-white/10 text-slate-100 rounded-2xl px-4 py-3 max-w-xs lg:max-w-md shadow-lg border border-white/10">
                      <p className="text-sm leading-relaxed">{msg.bot}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={
                isVideoReady
                  ? 'Ask a question about the video...'
                  : 'Upload a video first'
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isVideoReady}
              className={`flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                !isVideoReady ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <button
              onClick={sendQuestion}
              disabled={loading || !isVideoReady || !question.trim()}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                loading || !isVideoReady || !question.trim()
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
