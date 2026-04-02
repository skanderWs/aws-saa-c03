const fs = require('fs');

// Remplace 'questions.txt' par le nom de ton fichier
const data = fs.readFileSync('questions.txt', 'utf8');

const blocks = data.split('**[⬆ Back to Top](#table-of-contents)**');
const quizData = [];

blocks.forEach(block => {
    const lines = block.trim().split('\n').filter(l => l.trim() !== '');
    if (lines.length < 3) return;

    // Extraire la question (la ligne qui commence par ###)
    const questionLine = lines.find(l => l.startsWith('###'));
    if (!questionLine) return;
    
    const questionText = questionLine.replace('### ', '').trim();

    // Extraire les options et les réponses
    const options = [];
    const correctIndices = [];

    const optionLines = lines.filter(l => l.startsWith('- ['));
    optionLines.forEach((line, index) => {
        const isCorrect = line.includes('[x]') || line.includes('[X]');
        const text = line.replace(/- \[[x ]\] /i, '').trim();
        
        options.push(text);
        if (isCorrect) {
            correctIndices.push(index);
        }
    });

    quizData.push({
        question: questionText,
        options: options,
        correct: correctIndices, // Tableau car peut avoir plusieurs réponses
        multiple: correctIndices.length > 1
    });
});

fs.writeFileSync('questions.json', JSON.stringify(quizData, null, 2));
console.log(`Terminé ! ${quizData.length} questions extraites.`);