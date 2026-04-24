/**
 * Analyzer (Local Only)
 * Computes letter analytics locally.
 */
function analyzeWord(word) {
  if (!word) return null;
  
  const upperWord = word.toUpperCase();
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  
  let vowel_count = 0;
  let consonant_count = 0;
  const letterCount = {};
  const foundVowels = [];
  
  for (const char of upperWord) {
    if (/[A-Z]/.test(char)) {
      if (vowels.includes(char)) {
        vowel_count++;
        if (!foundVowels.includes(char)) {
          foundVowels.push(char);
        }
      } else {
        consonant_count++;
      }
      
      letterCount[char] = (letterCount[char] || 0) + 1;
    }
  }
  
  const repeated_letters = Object.keys(letterCount)
    .filter(char => letterCount[char] > 1)
    .join(',');
    
  const vowel_letters = foundVowels.join(',');

  return {
    letter_count: upperWord.length,
    vowel_count,
    vowel_letters,
    consonant_count,
    repeated_letters,
    first_letter: upperWord[0] || ''
  };
}

module.exports = {
  analyzeWord
};
