import logger from '../utils/logger.js';

class PlagiarismService {
  /**
   * Compare a submission with other submissions to detect plagiarism
   */
  async compareSubmissions(targetSubmission, otherSubmissions) {
    try {
      const matches = [];
      let totalSimilarity = 0;

      for (const otherSubmission of otherSubmissions) {
        const similarity = this.calculateSimilarity(targetSubmission, otherSubmission);

        if (similarity > 30) { // Threshold: 30% similarity
          matches.push({
            studentId: otherSubmission.student,
            similarity: similarity.toFixed(2),
            matchedText: this.getMatchedText(targetSubmission, otherSubmission),
          });
        }

        totalSimilarity += similarity;
      }

      const overallScore = otherSubmissions.length > 0
        ? totalSimilarity / otherSubmissions.length
        : 0;

      return {
        overallScore: overallScore.toFixed(2),
        matches: matches.sort((a, b) => b.similarity - a.similarity),
      };
    } catch (error) {
      logger.error('Failed to compare submissions', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate similarity between two submissions
   */
  calculateSimilarity(submission1, submission2) {
    let totalSimilarity = 0;
    let comparedQuestions = 0;

    // Compare answers for each question
    submission1.answers.forEach(answer1 => {
      const answer2 = submission2.answers.find(
        a => a.questionId.toString() === answer1.questionId.toString()
      );

      if (answer2 && typeof answer1.answer === 'string' && typeof answer2.answer === 'string') {
        const similarity = this.calculateTextSimilarity(answer1.answer, answer2.answer);
        totalSimilarity += similarity;
        comparedQuestions++;
      }
    });

    return comparedQuestions > 0 ? totalSimilarity / comparedQuestions : 0;
  }

  /**
   * Calculate text similarity using various algorithms
   */
  calculateTextSimilarity(text1, text2) {
    // Normalize texts
    const normalized1 = this.normalizeText(text1);
    const normalized2 = this.normalizeText(text2);

    // Use multiple similarity metrics
    const jaccardSim = this.jaccardSimilarity(normalized1, normalized2);
    const cosineSim = this.cosineSimilarity(normalized1, normalized2);
    const levenshteinSim = this.levenshteinSimilarity(text1, text2);

    // Weighted average
    return (jaccardSim * 0.3 + cosineSim * 0.4 + levenshteinSim * 0.3) * 100;
  }

  /**
   * Normalize text for comparison
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Jaccard Similarity: Measures overlap between two sets
   */
  jaccardSimilarity(text1, text2) {
    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Cosine Similarity: Measures angle between two vectors
   */
  cosineSimilarity(text1, text2) {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');

    // Create word frequency vectors
    const allWords = [...new Set([...words1, ...words2])];
    const vector1 = allWords.map(word => words1.filter(w => w === word).length);
    const vector2 = allWords.map(word => words2.filter(w => w === word).length);

    // Calculate dot product
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);

    // Calculate magnitudes
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
  }

  /**
   * Levenshtein Distance Similarity: Measures edit distance
   */
  levenshteinSimilarity(text1, text2) {
    const distance = this.levenshteinDistance(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);

    return maxLength > 0 ? 1 - distance / maxLength : 1;
  }

  /**
   * Calculate Levenshtein Distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get matched text snippets
   */
  getMatchedText(submission1, submission2) {
    const matches = [];

    submission1.answers.forEach(answer1 => {
      const answer2 = submission2.answers.find(
        a => a.questionId.toString() === answer1.questionId.toString()
      );

      if (answer2 && typeof answer1.answer === 'string' && typeof answer2.answer === 'string') {
        const similarity = this.calculateTextSimilarity(answer1.answer, answer2.answer);

        if (similarity > 50) {
          // Find common phrases
          const commonPhrases = this.findCommonPhrases(answer1.answer, answer2.answer);
          if (commonPhrases.length > 0) {
            matches.push(...commonPhrases.slice(0, 3)); // Top 3 matches
          }
        }
      }
    });

    return matches.join(' ... ');
  }

  /**
   * Find common phrases between two texts
   */
  findCommonPhrases(text1, text2, minLength = 5) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const commonPhrases = [];

    for (let i = 0; i < words1.length - minLength; i++) {
      for (let len = minLength; len <= Math.min(15, words1.length - i); len++) {
        const phrase = words1.slice(i, i + len).join(' ');
        const phrase2 = words2.join(' ');

        if (phrase2.includes(phrase)) {
          commonPhrases.push(phrase);
        }
      }
    }

    return [...new Set(commonPhrases)].sort((a, b) => b.length - a.length);
  }

  /**
   * Detect code plagiarism (for programming questions)
   */
  detectCodePlagiarism(code1, code2) {
    // Remove comments and whitespace
    const cleanCode1 = this.cleanCode(code1);
    const cleanCode2 = this.cleanCode(code2);

    // Calculate similarity
    const similarity = this.calculateTextSimilarity(cleanCode1, cleanCode2);

    // Detect structural similarity
    const structuralSim = this.compareCodeStructure(code1, code2);

    return {
      similarity: (similarity * 0.6 + structuralSim * 0.4).toFixed(2),
      isPlagiarized: similarity > 70 || structuralSim > 80,
    };
  }

  /**
   * Clean code for comparison
   */
  cleanCode(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Compare code structure
   */
  compareCodeStructure(code1, code2) {
    // Extract structural elements (functions, loops, conditions)
    const structure1 = this.extractCodeStructure(code1);
    const structure2 = this.extractCodeStructure(code2);

    return this.jaccardSimilarity(structure1, structure2) * 100;
  }

  /**
   * Extract code structure
   */
  extractCodeStructure(code) {
    const patterns = [
      /function\s+\w+/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /if\s*\(/g,
      /class\s+\w+/g,
    ];

    const structures = [];
    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        structures.push(...matches);
      }
    });

    return structures.join(' ');
  }
}

export default new PlagiarismService();
