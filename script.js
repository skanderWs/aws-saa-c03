let allQuestions = [];
let selectedQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // Format: { questionIndex: [selectedIndices] }
let timer;
let timeLeft = 130 * 60; // 130 minutes en secondes

// 1. Chargement des questions
async function loadQuiz() {
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        setupQuiz();
    } catch (error) {
        console.error("Erreur de chargement:", error);
    }
}

// 2. Préparation du Quiz (65 questions)
function setupQuiz() {
    // Mélange de toutes les questions
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    
    // Sélection des 65 questions
    selectedQuestions = shuffled.slice(0, 65).map((q, index) => ({
        ...q,
        isScored: index < 50 // Les 50 premières comptent pour le score
    }));

    startTimer();
    showQuestion();
}

// 3. Gestion du Chrono
function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        document.getElementById('time').textContent = 
            `${mins}:${secs.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            finishQuiz();
        }
    }, 1000);
}

// Affiche la question et gère l'état du bouton
function showQuestion() {
    const q = selectedQuestions[currentQuestionIndex];
    document.getElementById('q-number').textContent = `Question ${currentQuestionIndex + 1} / 65`;
    document.getElementById('q-text').textContent = q.question;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    q.options.forEach((opt, idx) => {
        const div = document.createElement('div');
        div.className = 'option';
        if (userAnswers[currentQuestionIndex]?.includes(idx)) div.classList.add('selected');
        
        div.textContent = opt;
        div.onclick = () => selectOption(idx, q.multiple);
        container.appendChild(div);
    });

    // VERROU : Désactive le bouton si aucune réponse n'est sélectionnée
    const nextBtn = document.querySelector('button[onclick="nextQuestion()"]');
    const hasAnswered = userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].length > 0;
    nextBtn.disabled = !hasAnswered;
}

// 5. Sélection des réponses
// Sélection et déverrouillage immédiat
function selectOption(index, isMultiple) {
    if (!userAnswers[currentQuestionIndex]) userAnswers[currentQuestionIndex] = [];
    
    if (isMultiple) {
        const pos = userAnswers[currentQuestionIndex].indexOf(index);
        if (pos > -1) userAnswers[currentQuestionIndex].splice(pos, 1);
        else userAnswers[currentQuestionIndex].push(index);
    } else {
        userAnswers[currentQuestionIndex] = [index];
    }
    showQuestion(); // Rafraîchit pour activer le bouton "Suivant"
}

// 6. Navigation
// Navigation avec modale à la fin
function nextQuestion() {
    if (currentQuestionIndex < 64) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        // Au lieu du confirm(), on affiche la modale
        document.getElementById('custom-modal').style.display = 'flex';
    }
}
function closeModal() {
    document.getElementById('custom-modal').style.display = 'none';
}

// 7. Calcul du score final (Scaled 1000)
function finishQuiz() {
    clearInterval(timer);
    let correctScored = 0;
    let reportHTML = '';

    selectedQuestions.forEach((q, idx) => {
        const userAnsArray = userAnswers[idx] || [];
        const userAnsSorted = [...userAnsArray].sort().join(',');
        const correctAnsSorted = [...q.correct].sort().join(',');
        const isCorrect = userAnsSorted === correctAnsSorted;

        if (q.isScored && isCorrect) {
            correctScored++;
        }

        // Construction du rapport pour cette question
        const statusClass = isCorrect ? 'report-correct' : 'report-wrong';
        const userText = userAnsArray.length > 0 
            ? userAnsArray.map(i => q.options[i]).join(' | ') 
            : "Aucune réponse donnée";
        const correctText = q.correct.map(i => q.options[i]).join(' | ');

        reportHTML += `
            <div class="report-item ${statusClass}">
                <strong>Question ${idx + 1}: ${q.question}</strong>
                <span class="label">Votre réponse :</span> 
                <span style="color: ${isCorrect ? 'green' : 'red'}">${userText}</span>
                ${!isCorrect ? `<span class="label">Réponse correcte :</span> <span class="correct-text">${correctText}</span>` : ''}
                <small style="display:block; margin-top:5px; color:#666">
                    ${q.isScored ? "(Compté dans le score)" : "(Question expérimentale - Non notée)"}
                </small>
            </div>
        `;
    });

    const scaledScore = Math.round((correctScored / 50) * 1000);
    const passed = scaledScore >= 720;

    // Affichage final
    document.body.innerHTML = `
        <div class="card" style="max-width: 900px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1>Résultat : ${scaledScore} / 1000</h1>
                <h2 style="color: ${passed ? '#28a745' : '#d9534f'}">
                    ${passed ? "RÉUSSI (PASS)" : "ÉCHEC (FAIL)"}
                </h2>
                <p>Précision sur les questions notées : ${correctScored} / 50</p>
                <button onclick="location.reload()">Recommencer un nouvel examen</button>
            </div>
            <hr>
            <h3>Révision des questions :</h3>
            ${reportHTML}
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="window.scrollTo(0,0)">Retour en haut</button>
            </div>
        </div>
    `;
}

loadQuiz();