import { useEffect, useState } from "react";
import { sendCommand } from "../services/api";

function JarvisOrb() {
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);

  const [message, setMessage] = useState(
    "Hello. I am Jarvis. How can I assist you?"
  );

  const [jarvisVoice, setJarvisVoice] = useState(null);

  // Find Microsoft Mark voice
  useEffect(() => {
    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();

      const markVoice = voices.find(
        (voice) =>
          voice.name === "Microsoft Mark - English (United States)"
      );

      if (markVoice) {
        setJarvisVoice(markVoice);
        console.log("JARVIS voice selected:", markVoice.name);
      } else {
        // Fallback to any en-US voice
        const fallbackVoice = voices.find(
          (voice) => voice.lang.toLowerCase() === "en-us"
        );

        setJarvisVoice(fallbackVoice || null);

        if (!fallbackVoice) {
          console.warn("Microsoft Mark voice was not found.");
        }
      }
    };

    loadVoice();

    window.speechSynthesis.onvoiceschanged = loadVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = (text) => {
    if (!text) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    if (jarvisVoice) {
      speech.voice = jarvisVoice;
    }

    speech.lang = "en-US";

    // JARVIS voice settings
    speech.rate = 0.9;
    speech.pitch = 0.7;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage(
        "Speech recognition is not supported in this browser."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    setListening(true);
    setMessage("Listening...");

    recognition.start();

    recognition.onresult = async (event) => {
      const command =
        event.results[0][0].transcript;

      setListening(false);
      setThinking(true);

      setMessage(`You: ${command}`);

      try {
        const data = await sendCommand(command);

        setThinking(false);

        setMessage(`Jarvis: ${data.response}`);

        speak(data.response);
      } catch (error) {
        console.error(error);

        setThinking(false);

        const errorMessage = error.message ||
          "I am unable to connect to my main system.";

        setMessage(`Jarvis: ${errorMessage}`);

        speak(errorMessage);
      }
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setListening(false);
      setThinking(false);

      setMessage(
        "I couldn't understand you. Please try again."
      );
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  return (
    <div className="jarvis-container">

      <h1>JARVIS</h1>

      <div
        className={`orb ${
          listening ? "listening" : ""
        } ${thinking ? "thinking" : ""}`}
      >
        <div className="orb-ring ring-one"></div>
        <div className="orb-ring ring-two"></div>

        <div className="orb-core">
          <span>J</span>
        </div>
      </div>

      <div className="status">
        {listening
          ? "LISTENING..."
          : thinking
          ? "THINKING..."
          : "SYSTEM READY"}
      </div>

      <div className="message">
        {message}
      </div>

      <button
        className="talk-button"
        onClick={startListening}
        disabled={listening || thinking}
      >
        🎤 Talk to Jarvis
      </button>

    </div>
  );
}

export default JarvisOrb;
