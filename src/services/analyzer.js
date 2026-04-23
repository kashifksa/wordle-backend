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
  
  for (const char of upperWord) {
    if (/[A-Z]/.test(char)) {
      if (vowels.includes(char)) {
        vowel_count++;
      } else {
        consonant_count++;
      }
      
      letterCount[char] = (letterCount[char] || 0) + 1;
    }
  }
  
  const repeated_letters = Object.keys(letterCount)
    .filter(char => letterCount[char] > 1)
    .join(',');
    
  return {
    letter_count: upperWord.length,
    vowel_count,
    consonant_count,
    repeated_letters,
    first_letter: upperWord[0] || ''
  };
}

module.exports = {
  analyzeWord
};
