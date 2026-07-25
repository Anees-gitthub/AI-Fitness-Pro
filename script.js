// ===== TYPE EFFECT =====
function typeEffect(text, element) {
  element.innerText = ""; // clear first (IMPORTANT)
  let i = 0;

  let interval = setInterval(() => {
    if (i < text.length) {
      element.innerText += text.charAt(i);
      i++;
    } else {
      clearInterval(interval);
    }
  }, 20);
}

// ===== CHAT =====
async function sendMessage() {

  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");

  const userText = input.value.trim();

  if(userText === "") return;

  // USER MESSAGE (RIGHT SIDE)

  const userMessage = document.createElement("div");

  userMessage.classList.add("user-msg");

  userMessage.innerText = userText;

  chatBox.appendChild(userMessage);

  // CLEAR INPUT

  input.value = "";

  // AI MESSAGE LOADING

  const botMessage = document.createElement("div");

  botMessage.classList.add("bot-msg");

  botMessage.innerText = "Typing...";

  chatBox.appendChild(botMessage);

  // AUTO SCROLL

  chatBox.scrollTop = chatBox.scrollHeight;

  try{

    // YOUR AI API CALL HERE

    const response = await fetch("https://ai-fitness-pro-24vl.onrender.com", {

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        message:userText
      })

    });

    const data = await response.json();

    // REPLACE TYPING WITH AI RESPONSE

    botMessage.innerText = data.reply;

  }

  catch(error){

    botMessage.innerText = "Error connecting to AI.";

  }

  // AUTO SCROLL

  chatBox.scrollTop = chatBox.scrollHeight;
}


// ===== VOICE =====
function startVoice() {
  let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  recognition.start();

  recognition.onresult = function(event) {
    document.getElementById("userInput").value =
      event.results[0][0].transcript;
  };
}