// --------------- //
// INITIALIZE GAME //
// --------------- //

const startModal = document.getElementById("startModal");
const loadingModal = document.getElementById("loadingModal");
const correct = new Audio("assets/sounds/Correct Ding - Sound effect (HD) - HighQualitySFX.mp3");
const wrong = new Audio("assets/sounds/Wrong Answer Sound effect - VS Mode.mp3");

async function initializeGame() {

   await loadVoices();

   await Promise.all([
      loadAudio(correct),
      loadAudio(wrong)
   ]);

   await new Promise(resolve => setTimeout(resolve, 500));

   loadingModal.classList.add("hidden");
   startModal.classList.remove("hidden");

}

// ------------ //
// VOICE OUTPUT //
// ------------ //

let voices = [];

// Load available voices
function loadVoices() {

   return new Promise(resolve => {

      let availableVoices = speechSynthesis.getVoices();

      if (availableVoices.length > 0) {
         voices = availableVoices;
         resolve();
         return;
      }

      speechSynthesis.onvoiceschanged = () => {

         voices = speechSynthesis.getVoices();
         resolve();

      };

   });

}

function loadAudio(audio) {
   return new Promise(resolve => {

      audio.addEventListener("canplaythrough", resolve, {
         once: true
      });

      audio.load();

   });
}

// ---------- //
// GAME STATE //
// ---------- //

const game = {
   currentQuestion: 1,
   totalQuestions: 10,
   score: 0,

   num1: 0,
   num2: 0,
   answer: 0,

   answered: false,

   firstAttempt: true,
};

// ---------- //
//    RNG     //
// ---------- //

function random(min, max) {
   return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Some browsers load voices asynchronously
loadVoices();
speechSynthesis.onvoiceschanged = loadVoices;

function speak(text) {

   speechSynthesis.cancel();

   const utterance = new SpeechSynthesisUtterance(text);

   utterance.rate = 0.9;
   utterance.pitch = 1.15;
   utterance.lang = "en-US";

   // Preferred female voices
   const preferredVoices = [
      "Microsoft Aria Online (Natural)",
      "Microsoft Jenny Online (Natural)",
      "Microsoft Zira Desktop",
      "Google UK English Female",
      "Samantha",
      "Karen"
   ];

   let selectedVoice = null;

   for (const name of preferredVoices) {
      selectedVoice = voices.find(v => v.name === name);
      if (selectedVoice) break;
   }

   // Fallback: any female-sounding voice
   if (!selectedVoice) {
      selectedVoice = voices.find(v =>
         /Aria|Jenny|Zira|Samantha|Karen|Female/i.test(v.name)
      );
   }

   // Final fallback
   utterance.voice = selectedVoice || voices[0];
   speechSynthesis.speak(utterance);
}

// ------------- //
// RENDER BLOCKS //
// ------------- //

const blocksContainer = document.getElementById("blocks");

function renderBlocks(rows, cols) {

   blocksContainer.innerHTML = "";

   blocksContainer.style.gridTemplateColumns = `repeat(${cols}, auto)`;

   for (let r = 0; r < rows; r++) {

      for (let c = 0; c < cols; c++) {

         const block = document.createElement("div");

         const index = r * cols + c;

         block.className =
            "w-6 h-6 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-lg bg-blue-500 border border-blue-600 shadow transition-all duration-300 hover:scale-110";

         blocksContainer.appendChild(block);

         setTimeout(() => {
            block.classList.add("pop-in");
         }, index * 40);

      }

   }

}

// --------- //
// QUESTIONS //
// --------- //

const question = document.getElementById("question");

function renderQuestion(num1, num2) {

   question.textContent = `${num1} × ${num2} = ?`;

   renderBlocks(num1, num2);

}

// ------------------ //
// GENERATE QUESTIONS //
// ------------------ //

const questionCounter = document.getElementById("questionCounter");
const scoreDisplay = document.getElementById("score");

const usedQuestions = new Set();
function generateQuestion() {

   game.answered = false;
   game.firstAttempt = true;

   let key;

   do {

      game.num1 = random(1, 10);
      game.num2 = random(1, 10);

      const small = Math.min(game.num1, game.num2);
      const large = Math.max(game.num1, game.num2);

      key = `${small}x${large}`;

   } while (usedQuestions.has(key));

   usedQuestions.add(key);

   game.answer = game.num1 * game.num2;

   renderQuestion(game.num1, game.num2);
   speak(`What is ${game.num1} times ${game.num2}?`);

   questionCounter.textContent =
      `Question ${game.currentQuestion} of ${game.totalQuestions}`;

   scoreDisplay.textContent =
      `Score: ${game.score}`;

}

// ------------- //
// NEXT QUESTION //
// ------------- //

function nextQuestion() {

   game.currentQuestion++;

   if (game.currentQuestion > game.totalQuestions) {

      endGame();
      return;

   }

   answerInput.value = "";
   answerInput.disabled = false;

   submitBtn.disabled = false;

   feedback.textContent = "";
   feedback.classList.add("hidden");

   nextBtn.classList.add("hidden");

   generateQuestion();

}

// ----------- //
// VALIDATIONS //
// ----------- //

const answerInput = document.getElementById("answerInput");
const submitBtn = document.getElementById("submitBtn");
const feedback = document.getElementById("feedback");

function checkAnswer() {

   if (game.answered) {
      return;
   }

   if (answerInput.value.trim() === "") {
      return;
   }

   const userAnswer = Number(answerInput.value);

   if (userAnswer === game.answer) {

      if (game.firstAttempt) {
         game.score++;
      }

      celebrate();
      correct.volume = 0.5;
      correct.currentTime = 1.8;
      correct.play();
      speak(`Correct! The answer is ${game.answer}`);
      game.answered = true;
      answerInput.disabled = true;
      submitBtn.disabled = true;

      nextBtn.classList.remove("hidden");

      scoreDisplay.textContent = `Score: ${game.score}`;

      feedback.className =
         "text-center mt-6 text-xl font-semibold text-green-600";

      feedback.textContent =
         "🎉 Correct! Great Job!";

   } else {
      wrong.volume = 0.5
      wrong.currentTime = 0.5;
      wrong.play();
      game.firstAttempt = false;
      speak(`Please try again`);

      feedback.className =
         "text-center mt-6 text-xl font-semibold text-red-500";

      feedback.textContent =
         "❌ Not quite right. Count the blocks and try again!";

   }

}

// ------------------- //
// CELEBRATE ANIMATION //
// ------------------- //

function celebrate() {

   confetti({
      particleCount: 120,
      spread: 90,
      origin: {
         y: 0.6
      }
   });

}

// -------- //
// END GAME //
// -------- //

function endGame() {

   gameCard.innerHTML = `
    
        <div class="text-center">

            <h1 class="text-4xl font-bold text-blue-600">
                🎉 Congratulations!
            </h1>

            <p class="mt-6 text-2xl">
                Final Score
            </p>

            <h2 class="text-6xl font-bold mt-3">
                ${game.score}/${game.totalQuestions}
            </h2>

            <button
                onclick="location.reload()"
                class="mt-8 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg">

                Play Again

            </button>

        </div>

    `;

}

// --------------- //
// EVENT LISTENERS //
// --------------- //

submitBtn.addEventListener("click", checkAnswer);
nextBtn.addEventListener("click", nextQuestion);
answerInput.addEventListener("keydown", (event) => {

   if (event.key === "Enter") {

      checkAnswer();

   }

});

initializeGame();

const playBtn = document.getElementById("playBtn");

playBtn.addEventListener("click", () => {

   startModal.classList.add("hidden");

   generateQuestion();

});

