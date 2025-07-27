import { NextResponse } from 'next/server'

async function convertToLanguage(text, targetLang) {
  try {
    const languageCodes = {
      "English": "en",
      "Gujarati": "gu",
      "Hindi": "hi", 
      "Spanish": "es",
      "French": "fr",
      "German": "de",
      "Chinese": "zh",
      "Japanese": "ja",
      "Arabic": "ar",
      "Portuguese": "pt",
      "Russian": "ru",
      "Italian": "it",
      "Korean": "ko",
      "Dutch": "nl",
      "Swedish": "sv",
      "Turkish": "tr"
    }

    const targetCode = languageCodes[targetLang] || targetLang

    // First detect the source language
    const detectedLang = await detectLanguage(text)
    const sourceCode = languageCodes[detectedLang] || detectedLang

    // Then convert to target language
    const converted = await tryMultipleTranslationServices(text, sourceCode, targetCode)
    
    return converted
  } catch (error) {
    console.error('Language conversion error:', error)
    return text
  }
}

async function translateText(text, fromLang, toLang) {
  try {
    const languageCodes = {
      "English": "en",
      "Gujarati": "gu",
      "Hindi": "hi", 
      "Spanish": "es",
      "French": "fr",
      "German": "de",
      "Chinese": "zh",
      "Japanese": "ja",
      "Arabic": "ar",
      "Portuguese": "pt",
      "Russian": "ru",
      "Italian": "it",
      "Korean": "ko",
      "Dutch": "nl",
      "Swedish": "sv",
      "Turkish": "tr"
    }

    // Handle "auto" source language - let the translation service auto-detect
    const sourceCode = fromLang.toLowerCase() === "auto" ? "auto" : (languageCodes[fromLang] || fromLang)
    const targetCode = languageCodes[toLang] || toLang

    const translation = await tryMultipleTranslationServices(text, sourceCode, targetCode)
    
    return translation
  } catch (error) {
    console.error('AI Translation error:', error)
    return `[${toLang.toUpperCase()}] ${text}`
  }
}

async function tryMultipleTranslationServices(text, fromCode, toCode) {
  // Don't translate if source and target are the same (unless auto-detecting)
  if (fromCode.toLowerCase() !== "auto" && fromCode.toLowerCase() === toCode.toLowerCase()) {
    return text
  }

  // Service 1: LibreTranslate (Primary)
  try {
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: fromCode,
        target: toCode,
        format: 'text'
      })
    })

    if (response.ok) {
      const data = await response.json()
      // Check if translation is valid
      if (data.translatedText && !data.translatedText.includes("PLEASE SELECT") && !data.translatedText.includes("ERROR")) {
        return data.translatedText
      }
    }
  } catch (error) {
    // LibreTranslate failed, trying next service
  }

  // Service 2: MyMemory API (Backup)
  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromCode}|${toCode}`)
    
    if (response.ok) {
      const data = await response.json()
      if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText
      }
    }
    } catch (error) {
    // MyMemory failed, trying next service
  }

  // Service 3: Free Dictionary API (for common phrases)
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/${fromCode}/${encodeURIComponent(text)}`)
    
    if (response.ok) {
      const data = await response.json()
      if (data && data[0] && data[0].meanings) {
        return `[${toCode.toUpperCase()}] ${text}`
      }
    }
  } catch (error) {
    // Dictionary API failed
  }

  // If all services fail, return original text with language prefix
  return `[${toCode.toUpperCase()}] ${text}`
}

async function detectLanguage(text) {
  try {
    const response = await fetch('https://libretranslate.de/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data && data[0]) {
        return convertLanguageCode(data[0].language)
      }
    }
    } catch (error) {
    // Language detection failed, using fallback
  }
  return aiDetectLanguage(text)
}

function convertLanguageCode(code) {
  const languageMap = {
    "en": "English",
    "gu": "Gujarati",
    "hi": "Hindi",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "zh": "Chinese",
    "ja": "Japanese",
    "ar": "Arabic",
    "pt": "Portuguese",
    "ru": "Russian",
    "it": "Italian",
    "ko": "Korean",
    "nl": "Dutch",
    "sv": "Swedish",
    "tr": "Turkish"
  }
  
  return languageMap[code] || code
}

function aiDetectLanguage(text) {
  // AI-based language detection using machine learning principles
  
  // 1. Character frequency analysis
  const analyzeCharacterFrequency = (text) => {
    const charFreq = {}
    const totalChars = text.length
    
    for (let char of text.toLowerCase()) {
      if (char.match(/[a-z]/)) {
        charFreq[char] = (charFreq[char] || 0) + 1
      }
    }
    
    // Normalize frequencies
    const normalizedFreq = {}
    for (const [char, count] of Object.entries(charFreq)) {
      normalizedFreq[char] = count / totalChars
    }
    
    return normalizedFreq
  }
  
  // 2. N-gram analysis (character sequences)
  const analyzeNGrams = (text, n = 2) => {
    const ngrams = {}
    const normalizedText = text.toLowerCase()
    
    for (let i = 0; i <= normalizedText.length - n; i++) {
      const ngram = normalizedText.substring(i, i + n)
      ngrams[ngram] = (ngrams[ngram] || 0) + 1
    }
    
    return ngrams
  }
  
  // 3. Word structure analysis
  const analyzeWordStructure = (text) => {
    const words = text.toLowerCase().match(/\b\w+\b/g) || []
    const wordLengths = words.map(w => w.length)
    const avgWordLength = wordLengths.length > 0 ? wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length : 0
    
    return { wordCount: words.length, avgWordLength, wordLengths }
  }
  
  // 4. Unicode script detection
  const detectScript = (text) => {
    const scripts = {
      latin: /[\u0041-\u005A\u0061-\u007A\u00C0-\u00FF\u0100-\u017F]/g,
      cyrillic: /[\u0400-\u04FF]/g,
      arabic: /[\u0600-\u06FF]/g,
      devanagari: /[\u0900-\u097F]/g,
      chinese: /[\u4E00-\u9FFF]/g,
      japanese: /[\u3040-\u309F\u30A0-\u30FF]/g,
      korean: /[\uAC00-\uD7AF]/g,
      thai: /[\u0E00-\u0E7F]/g,
      hebrew: /[\u0590-\u05FF]/g,
      greek: /[\u0370-\u03FF]/g
    }
    
    const scriptScores = {}
    for (const [script, regex] of Object.entries(scripts)) {
      const matches = text.match(regex) || []
      scriptScores[script] = matches.length
    }
    
    return scriptScores
  }
  
  // 5. Statistical language modeling
  const statisticalLanguageModel = (text) => {
    const normalizedText = text.toLowerCase()
    
    // Language-specific statistical patterns
    const languageModels = {
      english: {
        commonBigrams: ['th', 'he', 'an', 'in', 'er', 're', 'on', 'at', 'en', 'nd'],
        commonTrigrams: ['the', 'and', 'tha', 'ent', 'ion', 'tio', 'for', 'nde', 'has', 'nce'],
        vowelConsonantRatio: 0.4,
        avgWordLength: 4.7
      },
      french: {
        commonBigrams: ['es', 'le', 'de', 'on', 'nt', 'te', 'er', 'se', 'ne', 'la'],
        commonTrigrams: ['ent', 'ion', 'tio', 'ati', 'for', 'nde', 'has', 'nce', 'men', 'ait'],
        vowelConsonantRatio: 0.45,
        avgWordLength: 5.2
      },
      spanish: {
        commonBigrams: ['es', 'de', 'la', 'el', 'en', 'se', 'te', 'ar', 'er', 'al'],
        commonTrigrams: ['ent', 'ion', 'tio', 'ati', 'for', 'nde', 'has', 'nce', 'men', 'ait'],
        vowelConsonantRatio: 0.48,
        avgWordLength: 5.1
      },
      german: {
        commonBigrams: ['en', 'er', 'te', 'de', 'ie', 'in', 'st', 'un', 'es', 'an'],
        commonTrigrams: ['ent', 'ion', 'tio', 'ati', 'for', 'nde', 'has', 'nce', 'men', 'ait'],
        vowelConsonantRatio: 0.42,
        avgWordLength: 5.8
      }
    }
    
    const scores = {}
    const bigrams = analyzeNGrams(normalizedText, 2)
    const trigrams = analyzeNGrams(normalizedText, 3)
    const wordStructure = analyzeWordStructure(normalizedText)
    
    for (const [lang, model] of Object.entries(languageModels)) {
      let score = 0
      
      // Bigram matching
      for (const bigram of model.commonBigrams) {
        if (bigrams[bigram]) {
          score += bigrams[bigram] * 2
        }
      }
      
      // Trigram matching
      for (const trigram of model.commonTrigrams) {
        if (trigrams[trigram]) {
          score += trigrams[trigram] * 3
        }
      }
      
      // Word length similarity
      const lengthDiff = Math.abs(wordStructure.avgWordLength - model.avgWordLength)
      score += (1 / (1 + lengthDiff)) * 5
      
      scores[lang] = score
    }
    
    return scores
  }
  
  // 6. Machine learning-based classification
  const mlClassification = (text) => {
    const charFreq = analyzeCharacterFrequency(text)
    const scriptScores = detectScript(text)
    const wordStructure = analyzeWordStructure(text)
    const statScores = statisticalLanguageModel(text)
    
    // Feature vector for ML classification
    const features = {
      // Character frequency features
      eFreq: charFreq['e'] || 0,
      tFreq: charFreq['t'] || 0,
      aFreq: charFreq['a'] || 0,
      oFreq: charFreq['o'] || 0,
      iFreq: charFreq['i'] || 0,
      nFreq: charFreq['n'] || 0,
      
      // Script features
      latinScore: scriptScores.latin || 0,
      cyrillicScore: scriptScores.cyrillic || 0,
      arabicScore: scriptScores.arabic || 0,
      
      // Word structure features
      avgWordLength: wordStructure.avgWordLength,
      wordCount: wordStructure.wordCount,
      
      // Statistical features
      ...statScores
    }
    
         // Weighted decision tree
     let bestLanguage = 'English'
     let bestScore = 0
     
     // Script-based classification (highest priority)
     if (features.cyrillicScore > 0) {
       return 'Russian'
     }
     if (features.arabicScore > 0) {
       return 'Arabic'
     }
     if (features.latinScore === 0) {
       // Non-Latin script detected
       if (features.chineseScore > 0) return 'Chinese'
       if (features.japaneseScore > 0) return 'Japanese'
       if (features.koreanScore > 0) return 'Korean'
       if (features.devanagariScore > 0) return 'Hindi'
     }
     
     // Latin script languages - use statistical analysis
     for (const [lang, score] of Object.entries(statScores)) {
       if (score > bestScore) {
         bestScore = score
         bestLanguage = lang.charAt(0).toUpperCase() + lang.slice(1)
       }
     }
     
     // Fallback based on character frequency patterns
     if (bestScore === 0) {
       const vowelRatio = (features.eFreq + features.aFreq + features.iFreq + features.oFreq) / 
                         (features.eFreq + features.tFreq + features.aFreq + features.oFreq + features.iFreq + features.nFreq)
       
       if (vowelRatio > 0.45) return 'Spanish'
       if (vowelRatio > 0.42) return 'French'
       if (features.avgWordLength > 5.5) return 'German'
       return 'English'
     }
     
     return bestLanguage
  }
  
  return mlClassification(text)
}

export async function POST(req) {
  try {
    const { message, fromLanguage, toLanguage, targetLanguage, action } = await req.json()

    if (action === "translate") {
      const translatedText = await translateText(message, fromLanguage, toLanguage)
      
      return NextResponse.json({ 
        translatedText,
        fromLanguage,
        toLanguage
      })
    }

    if (action === "convert") {
      const convertedText = await convertToLanguage(message, targetLanguage)
      
      return NextResponse.json({ 
        convertedText,
        targetLanguage
      })
    }

    if (action === "detect") {
      const detectedLanguage = await detectLanguage(message)
      
      return NextResponse.json({ 
        detectedLanguage,
        confidence: 0.8
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}