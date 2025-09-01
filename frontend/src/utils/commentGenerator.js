// Random comment generator for diverse story comments
// Creates supportive and empathetic comments for women's storytelling platform

const supportiveNicknames = [
  'SesimVar', 'UmutluYurek', 'GucluKadin', 'MeralKalp', 'CesurRuh',
  'DostuSen', 'YardimciEl', 'AydinlikYol', 'SicakNefes', 'IyilikMelegi',
  'DikkatliKulak', 'SevgiDolu', 'AnlayisliRuh', 'DesitekEden', 'BirlikteYiz',
  'GuvenkalpNaz', 'IyilikPeri', 'YanimdasinSen', 'DestekciKiz', 'BeslayenRuh',
  'HikayePaylasan', 'DinleyenDost', 'HikayemBende', 'BendeVarim', 'SeniBurada',
  'DinleyiciKiz', 'HikayemOyla', 'DestileyenEl', 'AnlayisMelegi'
]

const supportiveComments = [
  // Empowerment & Strength
  'Hikayende o kadar güçlü bir kadın var ki, seni görmek muhteşem.',
  'Bu deneyimin seni daha da güçlü kılmış. Bunu hissedebiliyorum.',
  'Gösterdiğin cesaret gerçekten ilham verici. Teşekkürler.',
  'Sen harika bir kadınsın ve bunu paylaştığın için minnettarım.',
  'Bu hikaye bana kendi gücümü hatırlattı. Sağ ol.',
  
  // Solidarity & Understanding  
  'Sen yalnız değilsin. Benzer bir şeyi ben de yaşadım.',
  'Hepimiz buradayız seninle. Hiç yalnız değilsin.',
  'Bu duyguları çok iyi anlıyorum. Yanındayım.',
  'Aynı yolda yürüyen birçok kadın var. Sen de birimizsin.',
  'Yaşadığın şeyleri anlıyorum. Birlikte güçlüyüz.',
  
  // Gratitude & Appreciation
  'Paylaştığın için çok teşekkür ederim. Bu cesaret ister.',
  'Bu hikayeyi okuduğum için şanslıyım. Çok değerli.',
  'Deneyimini bizimle paylaştığın için minnettarım.',
  'Böyle açık olman gerçekten cesareti temsil ediyor.',
  'Hikayeni paylaşman başkalarına da cesaret verecek.',
  
  // Hope & Healing
  'Umarım yazdıkça için ferahlar. Hikayeler iyileştirir.',
  'Zaman her şeyi iyileştirir ama sen zaten güçlüsün.',
  'Bu süreci geçiyorsan artık çok şey başarmışsın demektir.',
  'İyileşme süreci zor ama sen bunu hak ediyorsun.',
  'Kendine iyi bak. Hak ettiğin tüm iyilik seninle olsun.',
  
  // Validation & Support
  'Hissettiğin şeyler çok normal ve anlaşılabilir.',
  'Tepkilen tamamen haklı. Kendini suçlama sakın.',
  'Yaşadığın her şey geçerli ve değerli.',
  'Duygularını ifade etmen çok sağlıklı bir şey.',
  'Bu süreçte kendine karşı sabırlı ol.',
  
  // Community & Belonging
  'Bu toplulukta her zaman güvendesin.',
  'Burada seni anlayan ve destekleyen birçok kişi var.',
  'Hikayende kendimi buldum. Ne güzel bir bağ.',
  'Bu platformda paylaştığın her şey değerli.',
  'Sesiniz duyulsun. Hepimizin hikayesi önemli.',
  
  // Encouragement  
  'Devam et yazmaya. Sesin çok güçlü.',
  'Her hikaye başka birine umut veriyor.',
  'Cesaretin başkalarına da ilham veriyor.',
  'Güçlü duruşun takdire şayan.',
  'Böyle devam et. Sesin çok değerli.',
  
  // Recognition & Respect
  'Yaşadığın her şeye rağmen ayakta durman harika.',
  'Mücadelenı görmek ve saygı duymak istiyorum.',
  'Bu kadar zor bir süreçten geçmişsin, helal olsun.',
  'Direncin ve cesaretlin takdire şayan.',
  'Hayatındaki bu değişimi başarman muhteşem.',
  
  // Short supportive responses
  'Seninleyim ❤️',
  'Güçlü ol, başaracaksın.',
  'Cesur kız! 💪',
  'Seni anlıyorum.',
  'Yanındayım.',
  'Çok cesurca.',
  'Harikasın!',
  'Sen değerlisin.',
  '🤗💜',
  'Kocaman sarılıyorum sana.'
]

// Generate random time in the past (between 10 minutes and 7 days ago)
const getRandomPastTime = () => {
  const now = Date.now()
  const tenMinutes = 10 * 60 * 1000
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  const randomMs = Math.random() * (sevenDays - tenMinutes) + tenMinutes
  return new Date(now - randomMs)
}

// Generate unique but predictable random numbers based on storyId
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Generate comments for a specific story
export const generateCommentsForStory = (storyId, commentCount = null) => {
  if (!storyId) return []
  
  // Convert storyId to number for seeding
  const seed = typeof storyId === 'string' ? 
    storyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 
    storyId
  
  // Determine number of comments (2-5 comments per story)
  const numComments = commentCount || Math.floor(seededRandom(seed) * 4) + 2
  
  const comments = []
  const usedCommentIndices = new Set()
  const usedNicknames = new Set()
  
  for (let i = 0; i < numComments; i++) {
    // Generate unique comment content
    let commentIndex
    do {
      commentIndex = Math.floor(seededRandom(seed + i * 7) * supportiveComments.length)
    } while (usedCommentIndices.has(commentIndex))
    usedCommentIndices.add(commentIndex)
    
    // Generate unique nickname
    let nicknameIndex  
    do {
      nicknameIndex = Math.floor(seededRandom(seed + i * 11) * supportiveNicknames.length)
    } while (usedNicknames.has(nicknameIndex))
    usedNicknames.add(nicknameIndex)
    
    // Create comment
    comments.push({
      id: `${storyId}-comment-${i + 1}`,
      storyId: storyId,
      authorNickname: supportiveNicknames[nicknameIndex],
      content: supportiveComments[commentIndex],
      createdAt: getRandomPastTime()
    })
  }
  
  // Sort comments by creation time (newest first)
  return comments.sort((a, b) => b.createdAt - a.createdAt)
}

export default generateCommentsForStory