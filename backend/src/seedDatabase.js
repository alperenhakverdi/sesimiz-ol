import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

const usersData = [
  { 
    nickname: "AyşeninSesi", 
    email: "ayse@example.com",
    password: "12345678",
    avatar: "https://i.pravatar.cc/150?u=1" 
  },
  { 
    nickname: "GüvenliLiman", 
    email: "guvenli@example.com",
    password: "12345678",
    avatar: "https://i.pravatar.cc/150?u=2" 
  },
  { 
    nickname: "UmutluKalbim", 
    email: "umutlu@example.com", 
    password: "12345678",
    avatar: "https://i.pravatar.cc/150?u=3" 
  },
  { 
    nickname: "GüçlüKadın", 
    email: "guclu@example.com",
    password: "12345678", 
    avatar: "https://i.pravatar.cc/150?u=4" 
  },
  { 
    nickname: "YalnızKuş", 
    email: "yalniz@example.com",
    password: "12345678",
    avatar: "https://i.pravatar.cc/150?u=5" 
  },
  { 
    nickname: "SessizÇığlık", 
    email: "sessiz@example.com",
    password: "12345678",
    avatar: "https://i.pravatar.cc/150?u=6" 
  },
  { 
    nickname: "DirençliRuh", 
    email: "direncli@example.com",
    password: "12345678",
    avatar: "https://i.pravatar.cc/150?u=7" 
  },
  { 
    nickname: "KırılganAma", 
    email: "kirilgan@example.com",
    password: "12345678",
    avatar: "https://i.pravatar.cc/150?u=8" 
  },
  { 
    nickname: "YeniBaşlangıç", 
    email: "yeni@example.com",
    password: "12345678",
    avatar: "https://i.pravatar.cc/150?u=9" 
  },
  { 
    nickname: "SabrıTükendi", 
    email: "sabri@example.com",
    password: "12345678",
    avatar: "https://i.pravatar.cc/150?u=10" 
  }
]

const stories = [
  {
    title: "İş Yerinde Yaşadığım Mobbing",
    content: "3 yıldır çalıştığım şirkette erkek meslektaşlarım sürekli fikirlerimi görmezden geliyor. Toplantılarda konuştuğumda 'kızlar işinden anlamaz' gibi yorumlar yapıyorlar. Patronum da erkek olduğu için onların tarafını tutuyor. Özgüvenim çok sarsıldı ama bırakmamaya kararlıyım. Bu durumu nasıl aşabilirim bilmiyorum.",
    authorIndex: 0
  },
  {
    title: "Annemle Aramızdaki Sorunlar",
    content: "Annem sürekli evlenme konusunda baskı yapıyor. 'Yaşın geçiyor, kimse seni almaz' diyor. 30 yaşındayım ve kariyerime odaklanmak istiyorum ama ailem bunu anlayamıyor. Her aile toplantısı büyük bir işkenceye dönüşüyor. Kendi kararlarımı veremiyorum gibi hissediyorum.",
    authorIndex: 1
  },
  {
    title: "Tek Başıma Anne Olmak",
    content: "Bebeğimin babası hamilelik öğrenince ortadan kayboldu. Şimdi 2 yaşındaki oğlumla tek başımayım. Mali durumum zor, ailem destek olmuyor 'neden evlenmedin önce' diyorlar. Çok yoruldum ama oğlum için güçlü olmaya çalışıyorum. Bazen ne kadar dayanabilirim bilmiyorum.",
    authorIndex: 2
  },
  {
    title: "Üniversitede Taciz Yaşadım",
    content: "Hocam sürekli kişisel sorular soruyor, derse kalmam için bahaneler üreterek yanımda durmaya çalışıyor. Şikayet etmek istiyorum ama kanıtım yok. Ailem 'sen yanlış anlamışsındır' diyor. Okulu bırakmayı düşünüyorum ama hayallerimi de bırakmak istemiyorum.",
    authorIndex: 3
  },
  {
    title: "Kocamın Ailesi Beni Kabul Etmiyor",
    content: "2 yıldır evliyim ama kayınvalidem hiçbir şeyimi beğenmiyor. Yemek yapışımdan temizliğime kadar her şeye karışıyor. Eşim araya girmiyor, 'annem haklı' diyor. Evimde yabancı gibi hissediyorum. Kendi ailemi özlüyorum ama onlar da 'sabret, zamanla geçer' diyor.",
    authorIndex: 4
  },
  {
    title: "Doğum Sonrası Depresyonum",
    content: "Bebeğimi doğurduktan sonra çok mutlu olacağımı düşünüyordum ama sürekli ağlama krizleri geçiriyorum. Bebeğime bakamayacağımı düşünüyorum. Çevremdekiler 'bu doğal' diyor ama ben normal hissetmiyorum. Yardım istiyorum ama kimse ciddiye almıyor.",
    authorIndex: 5
  },
  {
    title: "Abim Beni Sürekli Dövüyor",
    content: "19 yaşındayım ama abim hala beni küçük çocuk gibi görüyor. Geç geldiğimde ya da erkek arkadaşlarımla konuştuğumda beni dövüyor. Babam 'erkek kardeş böyle korur' diyor. Evden kaçmayı düşünüyorum ama nereye gideceğimi bilmiyorum.",
    authorIndex: 6
  },
  {
    title: "İş Bulamıyorum Çünkü Kadınım",
    content: "Mühendislik mezunuyum ama 6 aydır işsizim. Mülakatların çoğunda 'evlenince çalışmaya devam eder misin' sorusu geliyor. Biri açıkça 'erkek mühendis tercih ediyoruz' dedi. Ailem 'zor alan seçtin' diyor. Hayallerimi gerçekleştirmek bu kadar zor olacağını bilmiyordum.",
    authorIndex: 7
  },
  {
    title: "Eski Sevgilim Beni Stalklıyor",
    content: "Ayrıldığımız halde eski sevgilim peşimi bırakmıyor. İş yerimin önünde bekliyor, telefonumu arıyor, sosyal medyada takip ediyor. Aileme söylediğimde 'ona da acı' dediler. Polis 'somut bir zarar vermedikçe yapacak bir şey yok' diyor. Çok korkuyorum.",
    authorIndex: 8
  },
  {
    title: "Hamile Kaldığım İçin İşten Çıkarıldım",
    content: "Hamile olduğumu patron öğrenince 'şirkete yük olacaksın' deyip işten çıkardı. Hukuken haksız olduğunu biliyorum ama davaya gücüm yetmiyor. Eşim 'bir yerden başka iş bulursun' diyor ama kimse hamile birini işe almak istemiyor. Bebeğim doğana kadar nasıl geçineceğiz bilmiyorum.",
    authorIndex: 9
  }
]

const comments = [
  // Comments for "İş Yerinde Yaşadığım Mobbing" (Story 0)
  {
    content: "Senin durumun çok tanıdık geliyor, ben de benzer şeyler yaşadım. Güçlü kal, haklı olan sensin. İnsan kaynakları bölümüne gidebilirsin.",
    storyIndex: 0,
    authorIndex: 1
  },
  {
    content: "Bu kadar açık mobbing yapıyorlarsa kesinlikle kayıt altına al. Ses kaydı, mail yazışmaları falan... Legal süreçte işine yarar.",
    storyIndex: 0,
    authorIndex: 6
  },
  {
    content: "Bırakma sakın! Sen onların istediğini yaparsın. Daha güçlü dön, kendini geliştir. Onlar senin değerini bilmiyor.",
    storyIndex: 0,
    authorIndex: 3
  },
  
  // Comments for "Annemle Aramızdaki Sorunlar" (Story 1)
  {
    content: "Ailemde de aynı baskıyı yapıyorlar. 'Saatin geçiyor' lafından bıktım artık. Kendi hayatımızı yaşamak istiyoruz sadece.",
    storyIndex: 1,
    authorIndex: 4
  },
  {
    content: "30 yaş hiç de geç değil, tam tersi kariyerini kurma zamanı. Annen muhtemelen seni merak ediyor ama yanlış ifade ediyor.",
    storyIndex: 1,
    authorIndex: 8
  },
  
  // Comments for "Tek Başıma Anne Olmak" (Story 2)
  {
    content: "Çok güçlü bir kadınsın! Tek başına bir çocuk büyütmek kolay değil. Devletten alacağın destekler var mı, araştırdın mı?",
    storyIndex: 2,
    authorIndex: 0
  },
  {
    content: "Belediyenin sosyal yardımları var, kreş imkanları falan. Ben de tek başıma büyüttüm kızımı, her şey düzelecek.",
    storyIndex: 2,
    authorIndex: 7
  },
  {
    content: "Ailenden destek alamaman çok üzücü. Ama sen ve oğlun için daha iyi bir gelecek kurabilirsin, inan buna.",
    storyIndex: 2,
    authorIndex: 5
  },
  
  // Comments for "Üniversitede Taciz Yaşadım" (Story 3)
  {
    content: "Kesinlikle dekanlığa şikayet et! Bu kabul edilemez. Başka kızlar da aynı şeyi yaşıyor olabilir. Sen konuşmazsan devam eder.",
    storyIndex: 3,
    authorIndex: 2
  },
  {
    content: "Bu durumu mutlaka kayıt altına al. WhatsApp mesajları, email'ler, her şeyi sakla. Kanıt olmadan da şikayet edebilirsin.",
    storyIndex: 3,
    authorIndex: 9
  },
  
  // Comments for "Kocamın Ailesi Beni Kabul Etmiyor" (Story 4)
  {
    content: "Eşin seni desteklemiyorsa asıl sorun orda. Evlilik iki kişi arasında, kayınvalide değil. Eşinle ciddi konuşman gerek.",
    storyIndex: 4,
    authorIndex: 6
  },
  {
    content: "Aynı durumu yaşadım. Kayınvalidemle sınır çizince düzeldi. Sen de kendi kurallarını koy, saygı duy ama boyun eğme.",
    storyIndex: 4,
    authorIndex: 1
  },
  
  // Comments for "Doğum Sonrası Depresyonum" (Story 5)
  {
    content: "Bu çok ciddi bir durum, lütfen bir doktora git. Doğum sonrası depresyon gerçek bir hastalık, tedavisi var. Utanma, yardım iste.",
    storyIndex: 5,
    authorIndex: 3
  },
  {
    content: "Ben de yaşadım bunu. Psikoloğa gitmek çok iyi geldi. İlaç da kullandım bir süre. Şimdi çok iyiyim, sen de düzeleceksin.",
    storyIndex: 5,
    authorIndex: 8
  },
  
  // Comments for "Abim Beni Sürekli Dövüyor" (Story 6)
  {
    content: "Bu şiddet, hoş görülecek bir şey değil! 19 yaşındasın, yetişkinsin. Bu durumu bildirmen gerek, sana yardım edecek yerler var.",
    storyIndex: 6,
    authorIndex: 0
  },
  {
    content: "155'i ara, kadın danışma hattı var. Bu durum normal değil, ailenin de buna göz yumması çok yanlış.",
    storyIndex: 6,
    authorIndex: 4
  },
  
  // Comments for "İş Bulamıyorum Çünkü Kadınım" (Story 7)
  {
    content: "Bu sorular illegal aslında, ama ne yazık ki soruyorlar. CV'nde medeni durumunu belirtmene gerek yok.",
    storyIndex: 7,
    authorIndex: 5
  },
  {
    content: "Mühendis arkadaşlarımın kurduğu bir network var. İstersen seni ekleyelim, iş imkanları paylaşıyoruz orada.",
    storyIndex: 7,
    authorIndex: 2
  },
  
  // Comments for "Eski Sevgilim Beni Stalklıyor" (Story 8)
  {
    content: "Bu çok tehlikeli! Mutlaka polise git, tutanak tuttur. Her şeyi kaydet, fotoğrafla. Yakın çevrendekiler de haberdar olsun.",
    storyIndex: 8,
    authorIndex: 9
  },
  {
    content: "Ben de benzer şey yaşadım. Engelledim her yerden, adresimi değiştirdim. Sen de güvenlik önlemleri al lütfen.",
    storyIndex: 8,
    authorIndex: 7
  },
  
  // Comments for "Hamile Kaldığım İçin İşten Çıkarıldım" (Story 9)
  {
    content: "Bu kesinlikle yasal değil! İş mahkemesine ver, hakların var. Hamilelik nedeniyle işten çıkarmak yasak.",
    storyIndex: 9,
    authorIndex: 1
  },
  {
    content: "Avukatla görüş mutlaka. Bu davayı kazanırsın, tazminatın da var. Belgelerini sakla, tanık bul.",
    storyIndex: 9,
    authorIndex: 3
  }
]

async function main() {
  // Önce tüm verileri temizle
  await prisma.comment?.deleteMany({})
  await prisma.story.deleteMany({})
  await prisma.user.deleteMany({})
  
  console.log('🗑️  Eski veriler temizlendi')
  
  // Kullanıcıları oluştur (şifreler hash'lenerek)
  console.log('🔒 Şifreler hashleniyor...')
  const createdUsers = []
  for (let i = 0; i < usersData.length; i++) {
    const userData = usersData[i]
    const hashedPassword = await bcryptjs.hash(userData.password, 10)
    
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword
      }
    })
    createdUsers.push(user)
  }
  
  console.log('👥 10 kullanıcı oluşturuldu (güvenli şifrelerle)')
  
  // Hikayeleri oluştur
  const createdStories = []
  for (let i = 0; i < stories.length; i++) {
    const story = stories[i]
    const createdStory = await prisma.story.create({
      data: {
        title: story.title,
        content: story.content,
        authorId: createdUsers[story.authorIndex].id
      }
    })
    createdStories.push(createdStory)
  }
  
  console.log('📚 10 hikaye oluşturuldu')
  
  // Yorumları oluştur
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i]
    await prisma.comment?.create({
      data: {
        content: comment.content,
        storyId: createdStories[comment.storyIndex].id,
        authorId: createdUsers[comment.authorIndex].id
      }
    })
  }
  
  console.log('💬 ' + comments.length + ' yorum oluşturuldu')
  console.log('✅ Veritabanı başarıyla dolduruldu!')
  console.log('📊 Özet:')
  console.log(`   - ${createdUsers.length} kullanıcı (güvenli şifrelerle)`)
  console.log(`   - ${createdStories.length} hikaye`)
  console.log(`   - ${comments.length} yorum`)
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })